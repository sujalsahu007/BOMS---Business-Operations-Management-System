using Backend.DTOs;
using Backend.Entities;

namespace Backend.Interfaces;

public interface IRoleService
{
    Task<IEnumerable<RoleDto>> GetRolesAsync(string? search);
    Task<RoleDto?> GetRoleByIdAsync(int id);
    Task<RoleDto> CreateRoleAsync(CreateRoleRequest request, int currentUserId);
    Task<RoleDto> UpdateRoleAsync(int id, UpdateRoleRequest request, int currentUserId);
    Task ChangeRoleStatusAsync(int id, RoleStatus status, int currentUserId);
    Task AssignPermissionAsync(int roleId, int permissionId, int currentUserId);
    Task RemovePermissionAsync(int roleId, int permissionId, int currentUserId);
    Task<IEnumerable<RoleUserDto>> GetRoleUsersAsync(int roleId);
    Task<IEnumerable<int>> GetRolePermissionsAsync(int roleId);
    Task RemoveUserFromRoleAsync(int roleId, int userId, int currentUserId);
}
