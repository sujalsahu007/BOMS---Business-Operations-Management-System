using Backend.DTOs;
using Backend.Interfaces;
using Backend.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StockController : ControllerBase
{
    private readonly IStockService _stockService;

    public StockController(IStockService stockService)
    {
        _stockService = stockService;
    }

    [HttpGet]
    [RequirePermission("Inventory.View")]
    public async Task<IActionResult> GetStockOverview([FromQuery] StockOverviewQueryDto query)
    {
        var (items, totalCount) = await _stockService.GetStockOverviewAsync(query);
        return Ok(new { Items = items, TotalCount = totalCount, Page = query.Page, PageSize = query.PageSize });
    }

    [HttpGet("transactions")]
    [RequirePermission("Inventory.View")]
    public async Task<IActionResult> GetTransactions([FromQuery] int? warehouseId, [FromQuery] int? productId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, totalCount) = await _stockService.GetTransactionsAsync(warehouseId, productId, page, pageSize);
        return Ok(new { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize });
    }

    [HttpPost("initialize")]
    [RequirePermission("Inventory.Create")]
    public async Task<IActionResult> InitializeStock([FromBody] InitializeStockDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        string userIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        try
        {
            var stock = await _stockService.InitializeStockAsync(request, userId, userIp);
            return Ok(stock);
        }
        catch (InvalidOperationException ex)
        {
            // Concurrency conflict
            return Conflict(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("transfers")]
    [RequirePermission("Inventory.View")]
    public async Task<IActionResult> GetTransfers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, totalCount) = await _stockService.GetTransfersAsync(page, pageSize);
        return Ok(new { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize });
    }

    [HttpPost("transfers")]
    [RequirePermission("Inventory.Create")]
    public async Task<IActionResult> CreateTransfer([FromBody] TransferStockDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        string userIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        try
        {
            var transfer = await _stockService.CreateTransferAsync(request, userId, userIp);
            return Ok(transfer);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("adjustments")]
    [RequirePermission("Inventory.View")]
    public async Task<IActionResult> GetAdjustments([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, totalCount) = await _stockService.GetAdjustmentsAsync(page, pageSize);
        return Ok(new { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize });
    }

    [HttpPost("adjustments")]
    [RequirePermission("Inventory.Create")]
    public async Task<IActionResult> CreateAdjustment([FromBody] AdjustStockDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        string userIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        try
        {
            var adjustment = await _stockService.CreateAdjustmentAsync(request, userId, userIp);
            return Ok(adjustment);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
