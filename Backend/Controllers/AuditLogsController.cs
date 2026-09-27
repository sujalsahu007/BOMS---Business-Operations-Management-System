using Backend.Authorization;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Backend.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuditLogsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [RequirePermission("Audit.View")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? module = null,
        [FromQuery] string? action = null,
        [FromQuery] int? userId = null,
        [FromQuery] string? search = null)
    {
        var query = _context.AuditLogs
            .Include(a => a.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(module))
        {
            query = query.Where(a => a.Module == module);
        }

        if (!string.IsNullOrEmpty(action))
        {
            query = query.Where(a => a.Action == action);
        }

        if (userId.HasValue)
        {
            query = query.Where(a => a.UserId == userId.Value);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            query = query.Where(a => a.EntityId.ToLower().Contains(s) || a.Action.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.AuditLogId,
                a.UserId,
                User = a.User != null ? new { a.User.FirstName, a.User.LastName, a.User.Username } : null,
                a.Action,
                a.Module,
                a.EntityType,
                a.EntityId,
                a.IpAddress,
                a.Timestamp
                // Do not load old/new values in the list endpoint to save bandwidth
            })
            .ToListAsync();

        return Ok(new
        {
            items = logs,
            page,
            pageSize,
            totalCount
        });
    }

    [HttpGet("{id}")]
    [RequirePermission("Audit.View")]
    public async Task<IActionResult> GetAuditLog(int id)
    {
        var log = await _context.AuditLogs
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.AuditLogId == id);

        if (log == null) return NotFound();

        return Ok(new
        {
            log.AuditLogId,
            log.UserId,
            User = log.User != null ? new { log.User.FirstName, log.User.LastName, log.User.Username } : null,
            log.Action,
            log.Module,
            log.EntityType,
            log.EntityId,
            log.IpAddress,
            OldValues = log.OldValues != null ? JsonSerializer.Deserialize<object>(log.OldValues) : null,
            NewValues = log.NewValues != null ? JsonSerializer.Deserialize<object>(log.NewValues) : null,
            log.Timestamp
        });
    }
}
