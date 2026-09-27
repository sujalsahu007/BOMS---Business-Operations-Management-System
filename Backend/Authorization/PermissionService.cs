using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Authorization;

public class PermissionService : IPermissionService
{
    private readonly ApplicationDbContext _context;

    public PermissionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> HasPermissionAsync(int userId, string permissionCode)
    {
        bool isAdmin = await _context.UserRoles
            .AnyAsync(ur => ur.UserId == userId && ur.Role.RoleName == "Administrator" && ur.Role.Status == Entities.RoleStatus.Active);
            
        if (isAdmin) return true;

        return await _context.UserRoles
            .Where(ur => ur.UserId == userId && ur.Role.Status == Entities.RoleStatus.Active)
            .SelectMany(ur => ur.Role.RolePermissions)
            .AnyAsync(rp => rp.Permission.PermissionCode == permissionCode);
    }
}
