using Backend.Authorization;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    [RequirePermission("Inventory.View")]
    public async Task<ActionResult<PaginatedResult<ProductListDto>>> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] ProductStatus? status = null)
    {
        var result = await _productService.GetProductsAsync(page, pageSize, search, categoryId, status);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [RequirePermission("Inventory.View")]
    public async Task<ActionResult<ProductDetailDto>> GetProduct(int id)
    {
        var product = await _productService.GetProductByIdAsync(id);
        if (product == null) return NotFound(new { Message = "Product not found." });
        return Ok(product);
    }

    [HttpPost]
    [RequirePermission("Inventory.Create")]
    public async Task<ActionResult<ProductDetailDto>> CreateProduct(CreateProductDto request)
    {
        var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? "0");
        try
        {
            var product = await _productService.CreateProductAsync(request, currentUserId);
            return CreatedAtAction(nameof(GetProduct), new { id = product.ProductId }, product);
        }
        catch (InvalidOperationException ex)
        {
            // Specifically handling Duplicate SKU and Inactive Category here
            return Conflict(new { Message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [RequirePermission("Inventory.Edit")]
    public async Task<ActionResult<ProductDetailDto>> UpdateProduct(int id, UpdateProductDto request)
    {
        var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? "0");
        try
        {
            var product = await _productService.UpdateProductAsync(id, request, currentUserId);
            return Ok(product);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { Message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }
}
