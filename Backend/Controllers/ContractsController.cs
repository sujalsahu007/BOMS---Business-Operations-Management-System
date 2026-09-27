using System.Threading.Tasks;
using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Authorization;

namespace Backend.Controllers;

[ApiController]
[Route("api/contracts")]
[Authorize]
public class ContractsController : ControllerBase
{
    private readonly IContractService _contractService;

    public ContractsController(IContractService contractService)
    {
        _contractService = contractService;
    }

    private int GetCurrentUserId() => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetContracts([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? status = null, [FromQuery] string? type = null, [FromQuery] int? partyId = null, [FromQuery] int? ownerId = null)
    {
        return Ok(await _contractService.GetContractsAsync(page, pageSize, search, status, type, partyId, ownerId));
    }

    [HttpGet("renewals-expiry")]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetRenewalsExpiry([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? status = null, [FromQuery] int? expiryWindowDays = null, [FromQuery] int? partyId = null, [FromQuery] int? ownerId = null, [FromQuery] string? sortBy = null)
    {
        return Ok(await _contractService.GetRenewalsExpiryAsync(page, pageSize, search, status, expiryWindowDays, partyId, ownerId, sortBy));
    }

    [HttpGet("{id:int}")]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetContractById(int id)
    {
        var contract = await _contractService.GetContractByIdAsync(id);
        if (contract == null) return NotFound("Contract not found");
        return Ok(contract);
    }

    [HttpPost]
    [RequirePermission("Contracts.Create")]
    public async Task<IActionResult> CreateContract([FromBody] CreateContractDto dto)
    {
        return Ok(await _contractService.CreateContractAsync(dto, GetCurrentUserId()));
    }

    [HttpPut("{id}")]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> UpdateContract(int id, [FromBody] UpdateContractDto dto)
    {
        return Ok(await _contractService.UpdateContractAsync(id, dto, GetCurrentUserId()));
    }

    [HttpPost("{id}/renew")]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> RenewContract(int id, [FromBody] CreateRenewalDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _contractService.RenewContractAsync(id, dto, currentUserId);
        return CreatedAtAction(nameof(GetContractById), new { id = result.ContractId }, result);
    }

    [HttpPost("{id}/send-signature")]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> SendForSignature(int id, [FromBody] SendForSignatureDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _contractService.SendForSignatureAsync(id, dto, currentUserId);
        return Ok(result);
    }

    [HttpGet("{id}/signing-request")]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetSigningRequest(int id)
    {
        var result = await _contractService.GetSigningRequestAsync(id);
        if (result == null) return NotFound("No signing request found for this contract.");
        return Ok(result);
    }

    // ==== OBLIGATIONS ====
    [HttpPost("{id}/submit-review")]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> SubmitForReview(int id)
    {
        await _contractService.SubmitForReviewAsync(id, GetCurrentUserId());
        return Ok(new { message = "Contract submitted for review" });
    }

    [HttpPost("{id}/submit-approval")]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> SubmitForApproval(int id)
    {
        await _contractService.SubmitForApprovalAsync(id, GetCurrentUserId());
        return Ok(new { message = "Contract submitted for approval" });
    }

    [HttpPost("{id}/approve")]
    [RequirePermission("Contracts.Approve")]
    public async Task<IActionResult> ApproveContract(int id, [FromBody] ContractApprovalSubmitDto dto)
    {
        await _contractService.ApproveContractAsync(id, dto, GetCurrentUserId());
        return Ok(new { message = "Contract approved" });
    }

    [HttpPost("{id}/reject")]
    [RequirePermission("Contracts.Approve")]
    public async Task<IActionResult> RejectContract(int id, [FromBody] ContractApprovalSubmitDto dto)
    {
        await _contractService.RejectContractAsync(id, dto, GetCurrentUserId());
        return Ok(new { message = "Contract rejected" });
    }

    [HttpPost("{id}/terminate")]
    [RequirePermission("Contracts.Delete")]
    public async Task<IActionResult> TerminateContract(int id)
    {
        await _contractService.TerminateContractAsync(id, GetCurrentUserId());
        return Ok(new { message = "Contract terminated" });
    }

    [HttpGet("{id}/approvals")]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetContractApprovals(int id)
    {
        return Ok(await _contractService.GetApprovalsAsync(id));
    }

    [HttpGet("approvals")]
    [RequirePermission("Contracts.Approve")]
    public async Task<IActionResult> GetPendingApprovals(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 15,
        [FromQuery] string? search = null,
        [FromQuery] string? type = null,
        [FromQuery] string? dateRange = null)
    {
        var result = await _contractService.GetPendingApprovalsAsync(GetCurrentUserId(), page, pageSize, search, type, dateRange);
        return Ok(result);
    }
}
