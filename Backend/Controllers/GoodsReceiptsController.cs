using Backend.Authorization;
using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GoodsReceiptsController : ControllerBase
{
    private readonly IGoodsReceiptService _goodsReceiptService;

    public GoodsReceiptsController(IGoodsReceiptService goodsReceiptService)
    {
        _goodsReceiptService = goodsReceiptService;
    }

    [HttpGet]
    [RequirePermission("Inventory.View")]
    public async Task<ActionResult<PaginatedResult<GoodsReceiptListDto>>> GetGoodsReceipts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] int? warehouseId = null,
        [FromQuery] DateTime? date = null)
    {
        var result = await _goodsReceiptService.GetGoodsReceiptsAsync(page, pageSize, search, status, warehouseId, date);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [RequirePermission("Inventory.View")]
    public async Task<ActionResult<GoodsReceiptDetailDto>> GetGoodsReceipt(int id)
    {
        var result = await _goodsReceiptService.GetGoodsReceiptByIdAsync(id);
        if (result == null) return NotFound(new { Message = "Goods receipt not found." });
        return Ok(result);
    }

    [HttpGet("eligible-pos")]
    [RequirePermission("Inventory.View")]
    public async Task<ActionResult<PaginatedResult<EligiblePurchaseOrderDto>>> GetEligiblePurchaseOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null)
    {
        var result = await _goodsReceiptService.GetEligiblePurchaseOrdersAsync(page, pageSize, search);
        return Ok(result);
    }

    [HttpPost]
    [RequirePermission("Inventory.Create")]
    public async Task<ActionResult<GoodsReceiptDetailDto>> CreateGoodsReceipt(CreateGoodsReceiptDto request)
    {
        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? "0");
        try
        {
            var result = await _goodsReceiptService.CreateGoodsReceiptAsync(request, currentUserId);
            return CreatedAtAction(nameof(GetGoodsReceipt), new { id = result.ReceiptId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }
}
