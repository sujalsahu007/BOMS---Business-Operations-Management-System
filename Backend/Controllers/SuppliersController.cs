using Backend.DTOs;
using Backend.Interfaces;
using Backend.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;

    public SuppliersController(ISupplierService supplierService)
    {
        _supplierService = supplierService;
    }

    [HttpGet]
    [RequirePermission("Inventory.View")]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? search = null, [FromQuery] string? status = null)
    {
        var (items, totalCount) = await _supplierService.GetAllSuppliersAsync(page, pageSize, search, status);
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
        try
        {
            var supplier = await _supplierService.GetSupplierByIdAsync(id);
            return Ok(supplier);
        }
        catch (System.Collections.Generic.KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [RequirePermission("Inventory.Manage")]
    public async Task<IActionResult> Create([FromBody] CreateSupplierDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "0");
        var userIp = HttpContext.Connection.RemoteIpAddress?.ToString();

        try
        {
            var supplier = await _supplierService.CreateSupplierAsync(request, userId, userIp);
            return CreatedAtAction(nameof(GetById), new { id = supplier.SupplierId }, supplier);
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the supplier.", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [RequirePermission("Inventory.Manage")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSupplierDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "0");
        var userIp = HttpContext.Connection.RemoteIpAddress?.ToString();

        try
        {
            var supplier = await _supplierService.UpdateSupplierAsync(id, request, userId, userIp);
            return Ok(supplier);
        }
        catch (System.Collections.Generic.KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while updating the supplier.", error = ex.Message });
        }
    }
}
