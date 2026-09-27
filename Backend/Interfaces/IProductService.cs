using Backend.DTOs;
using Backend.Entities;

namespace Backend.Interfaces;

public interface IProductService
{
    Task<PaginatedResult<ProductListDto>> GetProductsAsync(int page, int pageSize, string? search, int? categoryId, ProductStatus? status);
    Task<ProductDetailDto?> GetProductByIdAsync(int id);
    Task<ProductDetailDto> CreateProductAsync(CreateProductDto request, int currentUserId);
    Task<ProductDetailDto> UpdateProductAsync(int id, UpdateProductDto request, int currentUserId);
}
