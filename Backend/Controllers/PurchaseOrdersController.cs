using System.Security.Claims;
using System.Threading.Tasks;
using Backend.Authorization;
using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseOrderService _poService;

    public PurchaseOrdersController(IPurchaseOrderService poService)
    {
        _poService = poService;
    }

    private int GetCurrentUserId()
    {
        return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
    }

    [HttpGet]
    [RequirePermission("Inventory.View")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int? supplierId,
        [FromQuery] int? warehouseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (items, totalCount) = await _poService.GetAllAsync(search, status, supplierId, warehouseId, page, pageSize);
        return Ok(new
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("{id}")]
    [RequirePermission("Inventory.View")]
    public async Task<IActionResult> GetById(int id)
    {
        var po = await _poService.GetByIdAsync(id);
        if (po == null) return NotFound();
        return Ok(po);
    }

    [HttpPost]
    [RequirePermission("Inventory.Create")]
    public async Task<IActionResult> CreateDraft([FromBody] CreatePurchaseOrderDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        
        try
        {
            var po = await _poService.CreateDraftAsync(dto, GetCurrentUserId());
            return CreatedAtAction(nameof(GetById), new { id = po.PurchaseOrderId }, po);
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [RequirePermission("Inventory.Edit")]
    public async Task<IActionResult> UpdateDraft(int id, [FromBody] UpdatePurchaseOrderDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var po = await _poService.UpdateDraftAsync(id, dto, GetCurrentUserId());
            return Ok(po);
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("{id}/submit")]
    [RequirePermission("Inventory.Edit")]
    public async Task<IActionResult> SubmitForApproval(int id)
    {
        try
        {
            var result = await _poService.SubmitForApprovalAsync(id, GetCurrentUserId());
            if (!result) return NotFound();
            return Ok(new { Message = "Purchase order submitted for approval." });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("{id}/approve")]
    [RequirePermission("Inventory.Approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] POApprovalRequestDto dto)
    {
        if (dto.Action != "Approve") return BadRequest(new { Message = "Invalid action." });

        try
        {
            var result = await _poService.ApprovePOAsync(id, dto, GetCurrentUserId());
            if (!result) return NotFound();
            return Ok(new { Message = "Purchase order approved successfully." });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("{id}/reject")]
    [RequirePermission("Inventory.Approve")]
    public async Task<IActionResult> Reject(int id, [FromBody] POApprovalRequestDto dto)
    {
        if (dto.Action != "Reject") return BadRequest(new { Message = "Invalid action." });

        try
        {
            var result = await _poService.RejectPOAsync(id, dto, GetCurrentUserId());
            if (!result) return NotFound();
            return Ok(new { Message = "Purchase order rejected successfully." });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("{id}/cancel")]
    [RequirePermission("Inventory.Edit")]
    public async Task<IActionResult> Cancel(int id)
    {
        try
        {
            var result = await _poService.CancelPOAsync(id, GetCurrentUserId());
            if (!result) return NotFound();
            return Ok(new { Message = "Purchase order cancelled." });
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
