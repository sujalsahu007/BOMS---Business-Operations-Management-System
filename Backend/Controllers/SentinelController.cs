using System.Threading.Tasks;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SentinelController : ControllerBase
{
    private readonly ISentinelService _sentinelService;

    public SentinelController(ISentinelService sentinelService)
    {
        _sentinelService = sentinelService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (userId == 0) return Unauthorized();

        var dashboard = await _sentinelService.GetSentinelDashboardAsync(userId, User);
        return Ok(dashboard);
    }

    [HttpPost("{id}/acknowledge")]
    public async Task<IActionResult> Acknowledge(string id)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (userId == 0) return Unauthorized();

        await _sentinelService.AcknowledgeFindingAsync(id, userId);
        return Ok();
    }

    [HttpPost("{id}/resolve")]
    public async Task<IActionResult> Resolve(string id)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (userId == 0) return Unauthorized();

        await _sentinelService.ResolveFindingAsync(id, userId);
        return Ok();
    }
}
