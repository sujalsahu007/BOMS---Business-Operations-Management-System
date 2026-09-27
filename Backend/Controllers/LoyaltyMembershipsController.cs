using Backend.DTOs;
using Backend.Interfaces;
using Backend.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Controllers;

[ApiController]
[Route("api/loyalty/memberships")]
[Authorize]
public class LoyaltyMembershipsController : ControllerBase
{
    private readonly ILoyaltyMembershipService _service;

    public LoyaltyMembershipsController(ILoyaltyMembershipService service)
    {
        _service = service;
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (idClaim != null && int.TryParse(idClaim.Value, out int id))
            return id;
        return 1; // Fallback for dev
    }

    [HttpGet]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetMemberships(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string search = "",
        [FromQuery] int? programId = null,
        [FromQuery] int? tierId = null,
        [FromQuery] string status = "All")
    {
        var (items, totalCount) = await _service.GetMembershipsAsync(page, pageSize, search, programId, tierId, status);
        return Ok(new { items, totalCount });
    }

    [HttpGet("{id}")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetMembershipById(int id)
    {
        var membership = await _service.GetMembershipByIdAsync(id);
        if (membership == null) return NotFound("Membership not found.");
        return Ok(membership);
    }

    [HttpPost]
    [RequirePermission("Loyalty.Create")]
    public async Task<IActionResult> EnrollCustomer([FromBody] CreateLoyaltyMembershipDto dto)
    {
        try
        {
            var result = await _service.EnrollCustomerAsync(dto, GetCurrentUserId());
            return CreatedAtAction(nameof(GetMembershipById), new { id = result.MembershipId }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/activate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> ActivateMembership(int id)
    {
        var success = await _service.ActivateMembershipAsync(id, GetCurrentUserId());
        if (!success) return NotFound("Membership not found.");
        return Ok(new { message = "Membership activated successfully." });
    }

    [HttpPost("{id}/deactivate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> DeactivateMembership(int id)
    {
        var success = await _service.DeactivateMembershipAsync(id, GetCurrentUserId());
        if (!success) return NotFound("Membership not found.");
        return Ok(new { message = "Membership deactivated successfully." });
    }

    [HttpGet("kpis")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetKpis()
    {
        var kpis = await _service.GetMembershipKpisAsync();
        return Ok(kpis);
    }
    
    [HttpGet("customers-dropdown")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetCustomersDropdown([FromQuery] string search = "")
    {
        var customers = await _service.GetAvailableCustomersAsync(search);
        return Ok(customers);
    }
}
