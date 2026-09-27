using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Authorization;
using Backend.DTOs;
using Backend.Interfaces;

namespace Backend.Controllers;

[ApiController]
[Route("api/loyalty")]
[Authorize]
public class LoyaltyTiersController : ControllerBase
{
    private readonly ILoyaltyTierService _tierService;

    public LoyaltyTiersController(ILoyaltyTierService tierService)
    {
        _tierService = tierService;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
        {
            return userId;
        }
        throw new UnauthorizedAccessException("User context is missing.");
    }

    [HttpGet("tiers")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetTiers([FromQuery] TierFilterDto filter)
    {
        try
        {
            var result = await _tierService.GetTiersAsync(filter);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("tiers/kpis")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetTierKpis()
    {
        try
        {
            var result = await _tierService.GetTierKpisAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("tiers/{id}")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetTierById(int id)
    {
        try
        {
            var result = await _tierService.GetTierByIdAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("tiers")]
    [RequirePermission("Loyalty.Create")]
    public async Task<IActionResult> CreateTier([FromBody] CreateLoyaltyTierDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _tierService.CreateTierAsync(dto, userId);
            return CreatedAtAction(nameof(GetTierById), new { id = result.TierId }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("tiers/{id}")]
    [RequirePermission("Loyalty.Edit")]
    public async Task<IActionResult> UpdateTier(int id, [FromBody] UpdateLoyaltyTierDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _tierService.UpdateTierAsync(id, dto, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("tiers/{id}/activate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> ActivateTier(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _tierService.ActivateTierAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("tiers/{id}/deactivate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> DeactivateTier(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _tierService.DeactivateTierAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ==========================================
    // BENEFITS
    // ==========================================

    [HttpGet("tiers/{tierId}/benefits")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetBenefitsByTier(int tierId)
    {
        try
        {
            var result = await _tierService.GetBenefitsByTierAsync(tierId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("tiers/{tierId}/benefits")]
    [RequirePermission("Loyalty.Edit")] // Requires edit to tier to add a benefit
    public async Task<IActionResult> CreateBenefit(int tierId, [FromBody] CreateLoyaltyBenefitDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _tierService.CreateBenefitAsync(tierId, dto, userId);
            return CreatedAtAction(nameof(GetBenefitsByTier), new { tierId = result.TierId }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("benefits/{id}")]
    [RequirePermission("Loyalty.Edit")]
    public async Task<IActionResult> UpdateBenefit(int id, [FromBody] UpdateLoyaltyBenefitDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _tierService.UpdateBenefitAsync(id, dto, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("benefits/{id}/activate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> ActivateBenefit(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _tierService.ActivateBenefitAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("benefits/{id}/deactivate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> DeactivateBenefit(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _tierService.DeactivateBenefitAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
