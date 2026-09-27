using Backend.Authorization;
using Backend.Data;
using Backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/permissions")]
public class PermissionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PermissionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [RequirePermission("Roles.View")]
    public async Task<IActionResult> GetPermissions()
    {
        var permissions = await _context.Permissions
            .Select(p => new PermissionDto 
            { 
                PermissionId = p.PermissionId, 
                PermissionCode = p.PermissionCode, 
                PermissionName = p.PermissionName, 
                Module = p.Module, 
                Description = p.Description 
            })
            .ToListAsync();
            
        return Ok(permissions);
    }
}
