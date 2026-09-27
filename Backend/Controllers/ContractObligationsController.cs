using System.Threading.Tasks;
using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Authorization;

namespace Backend.Controllers;

[ApiController]
[Route("api/contracts/{contractId}/obligations")]
[Authorize]
public class ContractObligationsController : ControllerBase
{
    private readonly IContractService _contractService;

    public ContractObligationsController(IContractService contractService)
    {
        _contractService = contractService;
    }

    private int GetCurrentUserId() => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("~/api/contracts/obligations")]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetAllObligations(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 15, 
        [FromQuery] string? search = null,
        [FromQuery] string? status = null, 
        [FromQuery] string? priority = null,
        [FromQuery] string? dateRange = null,
        [FromQuery] int? contractId = null)
    {
        return Ok(await _contractService.GetAllObligationsAsync(page, pageSize, search, status, priority, dateRange, contractId));
    }

    [HttpGet("~/api/contracts/obligations/kpis")]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetObligationKpis()
    {
        return Ok(await _contractService.GetObligationKpisAsync());
    }

    [HttpGet]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetObligations(int contractId)
    {
        return Ok(await _contractService.GetObligationsAsync(contractId));
    }

    [HttpPost]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> CreateObligation(int contractId, [FromBody] CreateObligationDto dto)
    {
        return Ok(await _contractService.CreateObligationAsync(contractId, dto, GetCurrentUserId()));
    }

    [HttpPut("~/api/obligations/{id}")]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> UpdateObligation(int id, [FromBody] UpdateObligationDto dto)
    {
        return Ok(await _contractService.UpdateObligationAsync(id, dto, GetCurrentUserId()));
    }

    [HttpPost("~/api/obligations/{id}/complete")]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> CompleteObligation(int id)
    {
        await _contractService.CompleteObligationAsync(id, GetCurrentUserId());
        return Ok(new { message = "Obligation completed successfully" });
    }

    [HttpPost("~/api/obligations/{id}/cancel")]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> CancelObligation(int id)
    {
        await _contractService.CancelObligationAsync(id, GetCurrentUserId());
        return Ok(new { message = "Obligation cancelled successfully" });
    }
}
