using Backend.Authorization;
using Backend.Data;
using Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/activities")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ActivitiesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [RequirePermission("Activity.View")]
    public async Task<IActionResult> GetActivities(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? module = null,
        [FromQuery] int? userId = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Activities
            .Include(a => a.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(module))
        {
            query = query.Where(a => a.Module == module);
        }

        if (userId.HasValue)
        {
            query = query.Where(a => a.UserId == userId.Value);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(a => a.Description.ToLower().Contains(s) || a.Action.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();

        var activities = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.ActivityId,
                a.UserId,
                User = new { a.User.FirstName, a.User.LastName, a.User.Username },
                a.Module,
                a.EntityType,
                a.EntityId,
                a.Action,
                a.Description,
                a.Timestamp
            })
            .ToListAsync();

        return Ok(new
        {
            items = activities,
            page,
            pageSize,
            totalCount
        });
    }

    [HttpGet("{entityType}/{entityId}")]
    public async Task<IActionResult> GetEntityActivities(string entityType, string entityId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        // For entity timeline, we might want to let any authorized user view it if they can view the entity, 
        // but for now we won't strictly enforce Activity.View here to allow User Timeline to work naturally.
        var query = _context.Activities
            .Include(a => a.User)
            .Where(a => a.EntityType == entityType && a.EntityId == entityId);

        var totalCount = await query.CountAsync();

        var activities = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.ActivityId,
                a.UserId,
                User = new { a.User.FirstName, a.User.LastName, a.User.Username },
                a.Module,
                a.EntityType,
                a.EntityId,
                a.Action,
                a.Description,
                a.Timestamp
            })
            .ToListAsync();

        return Ok(new
        {
            items = activities,
            page,
            pageSize,
            totalCount
        });
    }
}
