using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Backend.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;

    public UserService(ApplicationDbContext context, IAuditService auditService, IActivityService activityService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
    }

    public async Task<PaginatedResult<UserListDto>> GetUsersAsync(int page, int pageSize, string? search, UserStatus? status, int? roleId)
    {
        var query = _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => !u.Username.StartsWith("deleted_"))
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(u => u.FirstName.ToLower().Contains(s) 
                                  || u.LastName.ToLower().Contains(s) 
                                  || u.Username.ToLower().Contains(s)
                                  || u.Email.ToLower().Contains(s));
        }

        if (status.HasValue)
        {
            query = query.Where(u => u.Status == status.Value);
        }

        if (roleId.HasValue)
        {
            query = query.Where(u => u.UserRoles.Any(ur => ur.RoleId == roleId.Value));
        }

        var totalCount = await query.CountAsync();
        
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = users.Select(u => new UserListDto
        {
            UserId = u.UserId,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Username = u.Username,
            Email = u.Email,
            Status = u.Status.ToString(),
            CreatedAt = u.CreatedAt,
            LastLoginAt = u.LastLoginAt,
            Roles = u.UserRoles.Select(ur => ur.Role.RoleName).ToList()
        }).ToList();

        return new PaginatedResult<UserListDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<UserDetailDto?> GetUserByIdAsync(int id)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.UserId == id);

        if (user == null) return null;

        var activities = await _context.Activities
            .Include(a => a.User)
            .Where(a => a.UserId == id)
            .OrderByDescending(a => a.Timestamp)
            .Take(10)
            .ToListAsync();

        return new UserDetailDto
        {
            UserId = user.UserId,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Username = user.Username,
            Email = user.Email,
            Status = user.Status.ToString(),
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            Roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList(),
            RecentActivities = activities.Select(a => new SystemActivityDto
            {
                User = $"{a.User.FirstName} {a.User.LastName}",
                Action = a.Description,
                Module = a.Module,
                Time = a.Timestamp.ToString("o")
            }).ToList()
        };
    }

    public async Task<UserListDto> CreateUserAsync(CreateUserDto request, int currentUserId)
    {
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            throw new Exception("Username already exists.");

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            throw new Exception("Email already exists.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Username = request.Username,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Status = request.Status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var validRoles = await _context.Roles.Where(r => request.RoleIds.Contains(r.RoleId)).ToListAsync();
            foreach (var role in validRoles)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.UserId, RoleId = role.RoleId });
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            await _auditService.LogAuditAsync(currentUserId, "User Created", "Users", "User", user.UserId.ToString(), null, new { user.Username, user.Email, user.Status, Roles = validRoles.Select(r => r.RoleId) }, null);
            await _activityService.LogActivityAsync(currentUserId, "Users", "User", user.UserId.ToString(), "Created", $"Created user {user.FirstName} {user.LastName}");

            return await GetUserListDtoById(user.UserId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<UserListDto> UpdateUserAsync(int id, UpdateUserDto request, int currentUserId)
    {
        var user = await _context.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.UserId == id);
        if (user == null) throw new Exception("User not found.");

        if (await _context.Users.AnyAsync(u => u.Username == request.Username && u.UserId != id))
            throw new Exception("Username already exists.");

        if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.UserId != id))
            throw new Exception("Email already exists.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var oldValues = JsonSerializer.Serialize(new { user.FirstName, user.LastName, user.Username, user.Email, user.Status, Roles = user.UserRoles.Select(ur => ur.RoleId) });

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Username = request.Username;
            user.Email = request.Email;
            user.Status = request.Status;
            user.UpdatedAt = DateTime.UtcNow;

            _context.UserRoles.RemoveRange(user.UserRoles);
            await _context.SaveChangesAsync();

            var validRoles = await _context.Roles.Where(r => request.RoleIds.Contains(r.RoleId)).ToListAsync();
            foreach (var role in validRoles)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.UserId, RoleId = role.RoleId });
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            await _auditService.LogAuditAsync(currentUserId, "User Updated", "Users", "User", user.UserId.ToString(), new { user.FirstName, user.LastName, user.Username, user.Email, user.Status, Roles = user.UserRoles.Select(ur => ur.RoleId) }, new { user.FirstName, user.LastName, user.Username, user.Email, user.Status, Roles = validRoles.Select(r => r.RoleId) }, null);
            await _activityService.LogActivityAsync(currentUserId, "Users", "User", user.UserId.ToString(), "Updated", $"Updated user {user.FirstName} {user.LastName}");

            return await GetUserListDtoById(user.UserId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task ChangeStatusAsync(int id, UserStatus newStatus, int currentUserId)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) throw new Exception("User not found.");

        if (user.Status == newStatus) return;

        var oldStatus = user.Status;
        user.Status = newStatus;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, $"User {newStatus}", "Users", "User", user.UserId.ToString(), new { Status = oldStatus }, new { Status = user.Status }, null);
        await _activityService.LogActivityAsync(currentUserId, "Users", "User", user.UserId.ToString(), "StatusChanged", $"Changed user status to {newStatus}");
    }

    public async Task ChangePasswordAsync(int id, string newPassword, int currentUserId)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) throw new Exception("User not found.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Password Changed", "Users", "User", user.UserId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Users", "User", user.UserId.ToString(), "PasswordChanged", "Changed user password");
    }

    private async Task<UserListDto> GetUserListDtoById(int id)
    {
        var u = await _context.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).FirstAsync(x => x.UserId == id);
        return new UserListDto
        {
            UserId = u.UserId,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Username = u.Username,
            Email = u.Email,
            Status = u.Status.ToString(),
            CreatedAt = u.CreatedAt,
            LastLoginAt = u.LastLoginAt,
            Roles = u.UserRoles.Select(ur => ur.Role.RoleName).ToList()
        };
    }

    public async Task DeleteUserAsync(int id, int currentUserId)
    {
        if (id == currentUserId)
            throw new Exception("You cannot delete your own account.");

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.UserId == id);

        if (user == null)
            throw new Exception("User not found.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var username = user.Username;
            var fullName = $"{user.FirstName} {user.LastName}";

            // Remove user roles first (FK constraint)
            _context.UserRoles.RemoveRange(user.UserRoles);

            // Remove any notifications for this user
            var notifications = await _context.Notifications.Where(n => n.RecipientUserId == id).ToListAsync();
            _context.Notifications.RemoveRange(notifications);

            // Soft delete to avoid breaking FK constraints (Contracts, Activities, AuditLogs)
            user.Status = UserStatus.Inactive;
            user.LastName = user.LastName + " (Deleted)";
            user.Email = $"deleted_{id}_{user.Email}";
            user.Username = $"deleted_{id}_{user.Username}";

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            await _auditService.LogAuditAsync(currentUserId, "User Deleted", "Users", "User", id.ToString(), new { username, fullName }, null, null);
            await _activityService.LogActivityAsync(currentUserId, "Users", "User", id.ToString(), "Deleted", $"Deleted user {fullName} ({username})");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
