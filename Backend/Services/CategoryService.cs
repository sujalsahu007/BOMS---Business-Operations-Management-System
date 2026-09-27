using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Backend.Services;

public class CategoryService : Backend.Interfaces.ICategoryService
{
    private readonly ApplicationDbContext _context;
    private readonly Backend.Interfaces.IAuditService _auditService;
    private readonly Backend.Interfaces.IActivityService _activityService;

    public CategoryService(
        ApplicationDbContext context,
        Backend.Interfaces.IAuditService auditService,
        Backend.Interfaces.IActivityService activityService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
    }

    public async Task<List<CategoryDto>> GetAllCategoriesAsync(bool activeOnly = false)
    {
        var query = _context.ProductCategories.AsQueryable();
        if (activeOnly)
        {
            query = query.Where(c => c.Status == ProductCategoryStatus.Active);
        }

        var categories = await query.OrderBy(c => c.CategoryName).ToListAsync();
        return categories.Select(MapToDto).ToList();
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(int id)
    {
        var category = await _context.ProductCategories.FindAsync(id);
        if (category == null) return null;
        return MapToDto(category);
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto request, int currentUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var category = new ProductCategory
            {
                CategoryName = request.CategoryName,
                Description = request.Description,
                Status = request.Status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Generate CategoryCode manually to avoid default constraint issues
            int seq;
            var connection = _context.Database.GetDbConnection();
            var wasClosed = connection.State == System.Data.ConnectionState.Closed;
            if (wasClosed) await connection.OpenAsync();
            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT NEXT VALUE FOR CategoryCodeSeq";
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                seq = (int)await command.ExecuteScalarAsync();
            }
            finally
            {
                if (wasClosed) await connection.CloseAsync();
            }
            category.CategoryCode = $"CAT-{seq:D4}";

            _context.ProductCategories.Add(category);
            await _context.SaveChangesAsync();

            // Audit
            await _auditService.LogAuditAsync(
                currentUserId,
                "Category Created",
                "Inventory",
                "ProductCategory",
                category.CategoryCode,
                null,
                new { category.CategoryName, category.Status },
                null
            );

            // Activity
            await _activityService.LogActivityAsync(
                currentUserId,
                "Created",
                "ProductCategory",
                category.CategoryCode,
                $"Created new category: {category.CategoryName}",
                "Inventory"
            );

            await transaction.CommitAsync();
            return MapToDto(category);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto request, int currentUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var category = await _context.ProductCategories.FindAsync(id);
            if (category == null) throw new KeyNotFoundException("Category not found.");

            var oldStatus = category.Status;
            
            var oldValues = new { category.CategoryName, category.Status, category.Description };

            category.CategoryName = request.CategoryName;
            category.Description = request.Description;
            category.Status = request.Status;
            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var newValues = new { category.CategoryName, category.Status, category.Description };

            string action = oldStatus != category.Status ? 
                            (category.Status == ProductCategoryStatus.Active ? "Category Activated" : "Category Deactivated") 
                            : "Category Updated";

            await _auditService.LogAuditAsync(
                currentUserId,
                action,
                "Inventory",
                "ProductCategory",
                category.CategoryCode,
                oldValues,
                newValues,
                null
            );

            await _activityService.LogActivityAsync(
                currentUserId,
                action.Split(' ')[1], // e.g., Updated, Activated, Deactivated
                "ProductCategory",
                category.CategoryCode,
                $"{action}: {category.CategoryName}",
                "Inventory"
            );

            await transaction.CommitAsync();
            return MapToDto(category);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static CategoryDto MapToDto(ProductCategory category)
    {
        return new CategoryDto
        {
            CategoryId = category.CategoryId,
            CategoryCode = category.CategoryCode,
            CategoryName = category.CategoryName,
            Description = category.Description,
            Status = category.Status,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }
}
