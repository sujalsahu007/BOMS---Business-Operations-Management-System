using System.Security.Claims;
using Backend.Authorization;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    [RequirePermission("Dashboard.View")]
    public async Task<IActionResult> GetDashboardData()
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
                return Unauthorized();

            var data = await _dashboardService.GetDashboardDataAsync(userId);
            return Ok(data);
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Failed to load dashboard data." });
        }
    }
}
