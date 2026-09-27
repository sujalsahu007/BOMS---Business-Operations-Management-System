using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class RoleService : IRoleService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;

    public RoleService(ApplicationDbContext context, IAuditService auditService, IActivityService activityService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
    }

    public async Task<IEnumerable<RoleDto>> GetRolesAsync(string? search)
    {
        var query = _context.Roles
            .Include(r => r.UserRoles)
            .Include(r => r.RolePermissions)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(r => r.RoleName.ToLower().Contains(search) || r.Description.ToLower().Contains(search));
        }

        var roles = await query.ToListAsync();

        return roles.Select(r => new RoleDto
        {
            RoleId = r.RoleId,
            RoleName = r.RoleName,
            Description = r.Description,
            Status = r.Status.ToString(),
            UsersCount = r.UserRoles.Count,
            PermissionsCount = r.RolePermissions.Count,
            CreatedAt = r.CreatedAt
        });
    }

    public async Task<RoleDto?> GetRoleByIdAsync(int id)
    {
        var role = await _context.Roles
            .Include(r => r.UserRoles)
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.RoleId == id);

        if (role == null) return null;

        return new RoleDto
        {
            RoleId = role.RoleId,
            RoleName = role.RoleName,
            Description = role.Description,
            Status = role.Status.ToString(),
            UsersCount = role.UserRoles.Count,
            PermissionsCount = role.RolePermissions.Count,
            CreatedAt = role.CreatedAt
        };
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleRequest request, int currentUserId)
    {
        if (await _context.Roles.AnyAsync(r => r.RoleName == request.RoleName))
            throw new Exception("Role name must be unique.");

        if (!Enum.TryParse<RoleStatus>(request.Status, true, out var statusEnum))
            statusEnum = RoleStatus.Active;

        var role = new Role
        {
            RoleName = request.RoleName,
            Description = request.Description,
            Status = statusEnum,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync();

        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Role Created", "Roles", "Role", role.RoleId.ToString(), null, new { role.RoleName, role.Description, role.Status }, null);
        await _activityService.LogActivityAsync(currentUserId, "Roles", "Role", role.RoleId.ToString(), "Created", $"Created Role: {role.RoleName}");

        return await GetRoleByIdAsync(role.RoleId) ?? throw new Exception("Error retrieving created role.");
    }

    public async Task<RoleDto> UpdateRoleAsync(int id, UpdateRoleRequest request, int currentUserId)
    {
        var role = await _context.Roles.FindAsync(id);
        if (role == null) throw new Exception("Role not found.");

        if (await _context.Roles.AnyAsync(r => r.RoleName == request.RoleName && r.RoleId != id))
            throw new Exception("Role name must be unique.");

        if (!Enum.TryParse<RoleStatus>(request.Status, true, out var statusEnum))
            statusEnum = RoleStatus.Active;

        role.RoleName = request.RoleName;
        role.Description = request.Description;
        role.Status = statusEnum;
        role.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Role Updated", "Roles", "Role", role.RoleId.ToString(), new { role.RoleName, role.Description, role.Status }, new { RoleName = request.RoleName, request.Description, Status = statusEnum }, null);
        await _activityService.LogActivityAsync(currentUserId, "Roles", "Role", role.RoleId.ToString(), "Updated", $"Updated Role: {role.RoleName}");

        return await GetRoleByIdAsync(role.RoleId) ?? throw new Exception("Error retrieving updated role.");
    }

    public async Task ChangeRoleStatusAsync(int id, RoleStatus status, int currentUserId)
    {
        var role = await _context.Roles.FindAsync(id);
        if (role == null) throw new Exception("Role not found.");

        if (role.RoleName == "Administrator" && status == RoleStatus.Inactive)
            throw new Exception("Cannot deactivate the Administrator role.");

        var oldStatus = role.Status;
        role.Status = status;
        role.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, status == RoleStatus.Active ? "Role Activated" : "Role Deactivated", "Roles", "Role", role.RoleId.ToString(), new { Status = oldStatus }, new { Status = role.Status }, null);
        await _activityService.LogActivityAsync(currentUserId, "Roles", "Role", role.RoleId.ToString(), "StatusChanged", $"{(status == RoleStatus.Active ? "Activated" : "Deactivated")} Role: {role.RoleName}");
    }

    public async Task AssignPermissionAsync(int roleId, int permissionId, int currentUserId)
    {
        var roleExists = await _context.Roles.AnyAsync(r => r.RoleId == roleId);
        if (!roleExists) throw new Exception("Role not found.");

        var permissionExists = await _context.Permissions.AnyAsync(p => p.PermissionId == permissionId);
        if (!permissionExists) throw new Exception("Permission not found.");

        var exists = await _context.RolePermissions.AnyAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId);
        if (exists) throw new Exception("Permission already assigned to this role.");

        _context.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permissionId });
        
        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Permission Assigned", "Roles", "RolePermission", $"{roleId}-{permissionId}", null, new { roleId, permissionId }, null);
        await _activityService.LogActivityAsync(currentUserId, "Roles", "Role", roleId.ToString(), "PermissionAssigned", "Assigned Permission to Role");
    }

    public async Task RemovePermissionAsync(int roleId, int permissionId, int currentUserId)
    {
        var role = await _context.Roles.FindAsync(roleId);
        if (role != null && role.RoleName == "Administrator")
        {
            throw new Exception("Cannot modify permissions for the Administrator system role.");
        }

        var rp = await _context.RolePermissions.FirstOrDefaultAsync(x => x.RoleId == roleId && x.PermissionId == permissionId);
        if (rp == null) throw new Exception("Permission assignment not found.");

        _context.RolePermissions.Remove(rp);
        
        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Permission Removed", "Roles", "RolePermission", $"{roleId}-{permissionId}", new { roleId, permissionId }, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Roles", "Role", roleId.ToString(), "PermissionRemoved", "Removed Permission from Role");
    }

    public async Task<IEnumerable<RoleUserDto>> GetRoleUsersAsync(int roleId)
    {
        var users = await _context.UserRoles
            .Include(ur => ur.User)
            .Where(ur => ur.RoleId == roleId)
            .Select(ur => new RoleUserDto
            {
                UserId = ur.User.UserId,
                FirstName = ur.User.FirstName,
                LastName = ur.User.LastName,
                Username = ur.User.Username,
                Email = ur.User.Email,
                Status = ur.User.Status.ToString()
            })
            .ToListAsync();
            
        return users;
    }

    public async Task<IEnumerable<int>> GetRolePermissionsAsync(int roleId)
    {
        return await _context.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .Select(rp => rp.PermissionId)
            .ToListAsync();
    }

    public async Task RemoveUserFromRoleAsync(int roleId, int userId, int currentUserId)
    {
        var ur = await _context.UserRoles.FirstOrDefaultAsync(x => x.RoleId == roleId && x.UserId == userId);
        if (ur == null) throw new Exception("User is not assigned to this role.");

        var role = await _context.Roles.FindAsync(roleId);

        _context.UserRoles.Remove(ur);
        
        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "User Removed From Role", "Roles", "UserRole", $"{userId}-{roleId}", new { userId, roleId }, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Roles", "Role", roleId.ToString(), "UserRemoved", $"Removed user from Role: {role?.RoleName}");
    }
}
