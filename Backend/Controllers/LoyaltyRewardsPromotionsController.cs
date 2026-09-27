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
public class LoyaltyRewardsPromotionsController : ControllerBase
{
    private readonly ILoyaltyRewardPromotionService _service;

    public LoyaltyRewardsPromotionsController(ILoyaltyRewardPromotionService service)
    {
        _service = service;
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out int id) ? id : 0;
    }

    // ==========================================
    // REWARDS
    // ==========================================

    [HttpGet("rewards")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetRewards([FromQuery] RewardFilterDto filter)
    {
        var result = await _service.GetRewardsAsync(filter);
        return Ok(result);
    }

    [HttpGet("rewards/kpis")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetRewardKpis()
    {
        var result = await _service.GetRewardKpisAsync();
        return Ok(result);
    }

    [HttpGet("rewards/{id}")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetRewardById(int id)
    {
        try
        {
            var result = await _service.GetRewardByIdAsync(id);
            return Ok(result);
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Reward not found" });
        }
    }

    [HttpPost("rewards")]
    [RequirePermission("Loyalty.Create")]
    public async Task<IActionResult> CreateReward([FromBody] CreateLoyaltyRewardDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await _service.CreateRewardAsync(dto, GetCurrentUserId());
            return CreatedAtAction(nameof(GetRewardById), new { id = result.RewardId }, result);
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("rewards/{id}")]
    [RequirePermission("Loyalty.Edit")]
    public async Task<IActionResult> UpdateReward(int id, [FromBody] UpdateLoyaltyRewardDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await _service.UpdateRewardAsync(id, dto, GetCurrentUserId());
            return Ok(result);
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Reward not found" });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("rewards/{id}/activate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> ActivateReward(int id)
    {
        try
        {
            await _service.ActivateRewardAsync(id, GetCurrentUserId());
            return Ok(new { message = "Reward activated successfully." });
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Reward not found" });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("rewards/{id}/deactivate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> DeactivateReward(int id)
    {
        try
        {
            await _service.DeactivateRewardAsync(id, GetCurrentUserId());
            return Ok(new { message = "Reward deactivated successfully." });
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Reward not found" });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ==========================================
    // PROMOTIONS
    // ==========================================

    [HttpGet("promotions")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetPromotions([FromQuery] PromotionFilterDto filter)
    {
        var result = await _service.GetPromotionsAsync(filter);
        return Ok(result);
    }

    [HttpGet("promotions/kpis")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetPromotionKpis()
    {
        var result = await _service.GetPromotionKpisAsync();
        return Ok(result);
    }

    [HttpGet("promotions/{id}")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetPromotionById(int id)
    {
        try
        {
            var result = await _service.GetPromotionByIdAsync(id);
            return Ok(result);
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Promotion not found" });
        }
    }

    [HttpPost("promotions")]
    [RequirePermission("Loyalty.Create")]
    public async Task<IActionResult> CreatePromotion([FromBody] CreateLoyaltyPromotionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await _service.CreatePromotionAsync(dto, GetCurrentUserId());
            return CreatedAtAction(nameof(GetPromotionById), new { id = result.PromotionId }, result);
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("promotions/{id}")]
    [RequirePermission("Loyalty.Edit")]
    public async Task<IActionResult> UpdatePromotion(int id, [FromBody] UpdateLoyaltyPromotionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await _service.UpdatePromotionAsync(id, dto, GetCurrentUserId());
            return Ok(result);
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Promotion not found" });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("promotions/{id}/activate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> ActivatePromotion(int id)
    {
        try
        {
            await _service.ActivatePromotionAsync(id, GetCurrentUserId());
            return Ok(new { message = "Promotion activated successfully." });
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Promotion not found" });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("promotions/{id}/deactivate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> DeactivatePromotion(int id)
    {
        try
        {
            await _service.DeactivatePromotionAsync(id, GetCurrentUserId());
            return Ok(new { message = "Promotion deactivated successfully." });
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Promotion not found" });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
