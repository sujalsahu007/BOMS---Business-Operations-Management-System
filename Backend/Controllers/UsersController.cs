using Backend.Authorization;
using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IUserService _userService;

    public UsersController(ApplicationDbContext context, IUserService userService)
    {
        _context = context;
        _userService = userService;
    }

    [HttpGet]
    [RequirePermission("Users.View")]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] UserStatus? status = null, [FromQuery] int? roleId = null)
    {
        var result = await _userService.GetUsersAsync(page, pageSize, search, status, roleId);
        return Ok(result);
    }

    [HttpGet("lookup")]
    public async Task<IActionResult> GetUserLookup()
    {
        // Allowed for all authenticated users
        var users = await _context.Users
            .Where(u => u.Status == UserStatus.Active)
            .Select(u => new { u.UserId, u.FirstName, u.LastName, u.Email })
            .ToListAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    [RequirePermission("Users.View")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    [RequirePermission("Users.Create")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto request)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _userService.CreateUserAsync(request, currentUserId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [RequirePermission("Users.Edit")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto request)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _userService.UpdateUserAsync(id, request, currentUserId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/activate")]
    [RequirePermission("Users.Manage")]
    public async Task<IActionResult> ActivateUser(int id)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _userService.ChangeStatusAsync(id, UserStatus.Active, currentUserId);
            return Ok(new { message = "User activated successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/deactivate")]
    [RequirePermission("Users.Manage")]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _userService.ChangeStatusAsync(id, UserStatus.Inactive, currentUserId);
            return Ok(new { message = "User deactivated successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/suspend")]
    [RequirePermission("Users.Manage")]
    public async Task<IActionResult> SuspendUser(int id)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _userService.ChangeStatusAsync(id, UserStatus.Suspended, currentUserId);
            return Ok(new { message = "User suspended successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/change-password")]
    [RequirePermission("Users.Manage")]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto request)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _userService.ChangePasswordAsync(id, request.NewPassword, currentUserId);
            return Ok(new { message = "Password changed successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{userId}/roles")]
    [RequirePermission("Users.Manage")]
    public async Task<IActionResult> AssignRole(int userId, [FromBody] AssignRoleRequest request)
    {
        var userExists = await _context.Users.AnyAsync(u => u.UserId == userId);
        if (!userExists) return NotFound("User not found.");

        var roleExists = await _context.Roles.AnyAsync(r => r.RoleId == request.RoleId);
        if (!roleExists) return NotFound("Role not found.");

        var exists = await _context.UserRoles.AnyAsync(ur => ur.UserId == userId && ur.RoleId == request.RoleId);
        if (exists) return Conflict(new { message = "Role already assigned to this user." });

        _context.UserRoles.Add(new UserRole { UserId = userId, RoleId = request.RoleId });
        await _context.SaveChangesAsync();

        return Ok(new { message = "Role assigned successfully." });
    }

    [HttpDelete("{userId}/roles/{roleId}")]
    [RequirePermission("Users.Manage")]
    public async Task<IActionResult> RemoveRole(int userId, int roleId)
    {
        var ur = await _context.UserRoles.FirstOrDefaultAsync(x => x.UserId == userId && x.RoleId == roleId);
        if (ur == null) return NotFound(new { message = "Role assignment not found." });

        _context.UserRoles.Remove(ur);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Role removed successfully." });
    }

    [HttpDelete("{id}")]
    [RequirePermission("Users.Manage")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await _userService.DeleteUserAsync(id, currentUserId);
            return Ok(new { message = "User deleted successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
