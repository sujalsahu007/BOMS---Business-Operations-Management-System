using Backend.Authorization;
using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    [RequirePermission("Inventory.View")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories([FromQuery] bool activeOnly = false)
    {
        var categories = await _categoryService.GetAllCategoriesAsync(activeOnly);
        return Ok(categories);
    }

    [HttpGet("{id}")]
    [RequirePermission("Inventory.View")]
    public async Task<ActionResult<CategoryDto>> GetCategory(int id)
    {
        var category = await _categoryService.GetCategoryByIdAsync(id);
        if (category == null) return NotFound(new { Message = "Category not found." });
        return Ok(category);
    }

    [HttpPost]
    [RequirePermission("Inventory.Create")]
    public async Task<ActionResult<CategoryDto>> CreateCategory(CreateCategoryDto request)
    {
        var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? "0");
        var category = await _categoryService.CreateCategoryAsync(request, currentUserId);
        return CreatedAtAction(nameof(GetCategory), new { id = category.CategoryId }, category);
    }

    [HttpPut("{id}")]
    [RequirePermission("Inventory.Edit")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(int id, UpdateCategoryDto request)
    {
        var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? "0");
        try
        {
            var category = await _categoryService.UpdateCategoryAsync(id, request, currentUserId);
            return Ok(category);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }
}
