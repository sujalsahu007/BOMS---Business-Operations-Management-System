using Backend.Authorization;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    [RequirePermission("Roles.View")]
    public async Task<IActionResult> GetRoles([FromQuery] string? search = null)
    {
        var roles = await _roleService.GetRolesAsync(search);
        return Ok(roles);
    }

    [HttpGet("{id}")]
    [RequirePermission("Roles.View")]
    public async Task<IActionResult> GetRole(int id)
    {
        var role = await _roleService.GetRoleByIdAsync(id);
        if (role == null) return NotFound(new { message = "Role not found." });

        return Ok(role);
    }

    [HttpPost]
    [RequirePermission("Roles.Create")]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = await _roleService.CreateRoleAsync(request, currentUserId);
            return Ok(role);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [RequirePermission("Roles.Edit")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = await _roleService.UpdateRoleAsync(id, request, currentUserId);
            return Ok(role);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/activate")]
    [RequirePermission("Roles.Manage")]
    public async Task<IActionResult> ActivateRole(int id)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _roleService.ChangeRoleStatusAsync(id, RoleStatus.Active, currentUserId);
            return Ok(new { message = "Role activated successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/deactivate")]
    [RequirePermission("Roles.Manage")]
    public async Task<IActionResult> DeactivateRole(int id)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _roleService.ChangeRoleStatusAsync(id, RoleStatus.Inactive, currentUserId);
            return Ok(new { message = "Role deactivated successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{roleId}/permissions")]
    [RequirePermission("Roles.Manage")]
    public async Task<IActionResult> AssignPermission(int roleId, [FromBody] AssignPermissionRequest request)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _roleService.AssignPermissionAsync(roleId, request.PermissionId, currentUserId);
            return Ok(new { message = "Permission assigned successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{roleId}/permissions/{permissionId}")]
    [RequirePermission("Roles.Manage")]
    public async Task<IActionResult> RemovePermission(int roleId, int permissionId)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _roleService.RemovePermissionAsync(roleId, permissionId, currentUserId);
            return Ok(new { message = "Permission removed successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/users")]
    [RequirePermission("Roles.View")]
    public async Task<IActionResult> GetRoleUsers(int id)
    {
        var users = await _roleService.GetRoleUsersAsync(id);
        return Ok(users);
    }

    [HttpGet("{id}/permissions")]
    [RequirePermission("Roles.View")]
    public async Task<IActionResult> GetRolePermissions(int id)
    {
        var permissionIds = await _roleService.GetRolePermissionsAsync(id);
        return Ok(permissionIds);
    }

    [HttpDelete("{roleId}/users/{userId}")]
    [RequirePermission("Roles.Manage")]
    public async Task<IActionResult> RemoveUserFromRole(int roleId, int userId)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _roleService.RemoveUserFromRoleAsync(roleId, userId, currentUserId);
            return Ok(new { message = "User removed from role successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
