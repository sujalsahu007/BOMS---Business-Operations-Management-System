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
public class WarehousesController : ControllerBase
{
    private readonly IWarehouseService _warehouseService;

    public WarehousesController(IWarehouseService warehouseService)
    {
        _warehouseService = warehouseService;
    }

    [HttpGet]
    [RequirePermission("Inventory.View")]
    public async Task<IActionResult> GetWarehouses([FromQuery] string? search, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, totalCount) = await _warehouseService.GetWarehousesAsync(search, status, page, pageSize);
        return Ok(new { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize });
    }

    [HttpGet("{id}")]
    [RequirePermission("Inventory.View")]
    public async Task<IActionResult> GetWarehouseById(int id)
    {
        var warehouse = await _warehouseService.GetWarehouseByIdAsync(id);
        if (warehouse == null) return NotFound("Warehouse not found.");
        return Ok(warehouse);
    }

    [HttpPost]
    [RequirePermission("Inventory.Create")]
    public async Task<IActionResult> CreateWarehouse([FromBody] CreateWarehouseDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        string userIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        try
        {
            var warehouse = await _warehouseService.CreateWarehouseAsync(request, userId, userIp);
            return CreatedAtAction(nameof(GetWarehouseById), new { id = warehouse.WarehouseId }, warehouse);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [RequirePermission("Inventory.Edit")]
    public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] UpdateWarehouseDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        string userIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        try
        {
            var warehouse = await _warehouseService.UpdateWarehouseAsync(id, request, userId, userIp);
            return Ok(warehouse);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
