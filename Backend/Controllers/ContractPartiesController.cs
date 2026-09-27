using System.Threading.Tasks;
using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Authorization;

namespace Backend.Controllers;

[ApiController]
[Route("api/contract-parties")]
[Authorize]
public class ContractPartiesController : ControllerBase
{
    private readonly IContractService _contractService;

    public ContractPartiesController(IContractService contractService)
    {
        _contractService = contractService;
    }

    private int GetCurrentUserId() => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetParties([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? type = null)
    {
        return Ok(await _contractService.GetPartiesAsync(page, pageSize, search, type));
    }

    [HttpGet("{id}")]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetParty(int id)
    {
        try
        {
            return Ok(await _contractService.GetPartyByIdAsync(id));
        }
        catch (System.Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [RequirePermission("Contracts.Create")]
    public async Task<IActionResult> CreateParty([FromBody] CreateContractPartyDto dto)
    {
        return Ok(await _contractService.CreatePartyAsync(dto, GetCurrentUserId()));
    }

    [HttpPut("{id}")]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> UpdateParty(int id, [FromBody] UpdateContractPartyDto dto)
    {
        try
        {
            return Ok(await _contractService.UpdatePartyAsync(id, dto, GetCurrentUserId()));
        }
        catch (System.Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/deactivate")]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> DeactivateParty(int id)
    {
        try
        {
            await _contractService.DeactivatePartyAsync(id, GetCurrentUserId());
            return Ok(new { message = "Party deactivated successfully." });
        }
        catch (System.Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
