using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Authorization;
using Backend.DTOs;
using Backend.Interfaces;

namespace Backend.Controllers;

[ApiController]
[Route("api/loyalty/programs")]
[Authorize]
public class LoyaltyProgramsController : ControllerBase
{
    private readonly ILoyaltyProgramService _service;

    public LoyaltyProgramsController(ILoyaltyProgramService service)
    {
        _service = service;
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out int id) ? id : 0;
    }

    [HttpGet]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetPrograms([FromQuery] string? search, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 10;

        var result = await _service.GetProgramsAsync(search, status, page, pageSize);
        return Ok(result);
    }

    [HttpGet("kpis")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetProgramKpis()
    {
        var result = await _service.GetProgramKpisAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetProgramById(int id)
    {
        try
        {
            var result = await _service.GetProgramByIdAsync(id);
            return Ok(result);
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Loyalty Program not found" });
        }
    }

    [HttpPost]
    [RequirePermission("Loyalty.Create")]
    public async Task<IActionResult> CreateProgram([FromBody] CreateLoyaltyProgramDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await _service.CreateProgramAsync(dto, GetCurrentUserId());
            return CreatedAtAction(nameof(GetProgramById), new { id = result.LoyaltyProgramId }, result);
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [RequirePermission("Loyalty.Edit")]
    public async Task<IActionResult> UpdateProgram(int id, [FromBody] UpdateLoyaltyProgramDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var result = await _service.UpdateProgramAsync(id, dto, GetCurrentUserId());
            return Ok(result);
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Loyalty Program not found" });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/activate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> ActivateProgram(int id)
    {
        try
        {
            await _service.ActivateProgramAsync(id, GetCurrentUserId());
            return Ok(new { message = "Program activated successfully." });
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Loyalty Program not found" });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/deactivate")]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> DeactivateProgram(int id)
    {
        try
        {
            await _service.DeactivateProgramAsync(id, GetCurrentUserId());
            return Ok(new { message = "Program deactivated successfully." });
        }
        catch (System.Collections.Generic.KeyNotFoundException)
        {
            return NotFound(new { message = "Loyalty Program not found" });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
