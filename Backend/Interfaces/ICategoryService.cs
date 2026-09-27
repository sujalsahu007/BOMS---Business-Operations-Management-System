using Backend.DTOs;
using Backend.Entities;

namespace Backend.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllCategoriesAsync(bool activeOnly = false);
    Task<CategoryDto?> GetCategoryByIdAsync(int id);
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto request, int currentUserId);
    Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto request, int currentUserId);
}
