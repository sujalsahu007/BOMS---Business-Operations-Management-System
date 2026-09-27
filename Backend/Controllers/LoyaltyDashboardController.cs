using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Backend.Controllers;

[ApiController]
[Route("api/loyalty/dashboard")]
[Authorize] // Assuming standard authorization
public class LoyaltyDashboardController : ControllerBase
{
    private readonly ILoyaltyDashboardService _dashboardService;

    public LoyaltyDashboardController(ILoyaltyDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<LoyaltyDashboardSummaryDto>> GetSummary()
    {
        var summary = await _dashboardService.GetDashboardSummaryAsync();
        return Ok(summary);
    }
}
