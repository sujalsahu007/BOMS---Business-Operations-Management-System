using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Backend.Services;

public class ProductService : Backend.Interfaces.IProductService
{
    private readonly ApplicationDbContext _context;
    private readonly Backend.Interfaces.IAuditService _auditService;
    private readonly Backend.Interfaces.IActivityService _activityService;

    public ProductService(
        ApplicationDbContext context,
        Backend.Interfaces.IAuditService auditService,
        Backend.Interfaces.IActivityService activityService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
    }

    public async Task<PaginatedResult<ProductListDto>> GetProductsAsync(int page, int pageSize, string? search, int? categoryId, ProductStatus? status)
    {
        var query = _context.Products.Include(p => p.Category).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p => 
                p.ProductName.ToLower().Contains(searchLower) ||
                p.SKU.ToLower().Contains(searchLower) ||
                p.ProductCode.ToLower().Contains(searchLower) ||
                p.Brand.ToLower().Contains(searchLower)
            );
        }

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        var totalCount = await query.CountAsync();

        var products = await query
            .OrderByDescending(p => p.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductListDto
            {
                ProductId = p.ProductId,
                ProductCode = p.ProductCode,
                ProductName = p.ProductName,
                SKU = p.SKU,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.CategoryName,
                Brand = p.Brand,
                CostPrice = p.CostPrice,
                SellingPrice = p.SellingPrice,
                ReorderLevel = p.ReorderLevel,
                Status = p.Status,
                ImageUrl = p.ImageUrl,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return new PaginatedResult<ProductListDto>
        {
            Items = products,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ProductDetailDto?> GetProductByIdAsync(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.ProductId == id);

        if (product == null) return null;

        var activities = await _context.Activities
            .Include(a => a.User)
            .Where(a => a.Module == "Inventory" && a.EntityType == "Product" && a.EntityId == product.ProductCode)
            .OrderByDescending(a => a.Timestamp)
            .Take(10)
            .Select(a => new SystemActivityDto
            {
                User = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : "System",
                Action = a.Action,
                Module = a.Module,
                Time = a.Timestamp.ToString("o")
            })
            .ToListAsync();

        return new ProductDetailDto
        {
            ProductId = product.ProductId,
            ProductCode = product.ProductCode,
            ProductName = product.ProductName,
            SKU = product.SKU,
            CategoryId = product.CategoryId,
            CategoryName = product.Category.CategoryName,
            Brand = product.Brand,
            Description = product.Description,
            UnitOfMeasure = product.UnitOfMeasure,
            CostPrice = product.CostPrice,
            SellingPrice = product.SellingPrice,
            ReorderLevel = product.ReorderLevel,
            ImageUrl = product.ImageUrl,
            Status = product.Status,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            RecentActivities = activities
        };
    }

    public async Task<ProductDetailDto> CreateProductAsync(CreateProductDto request, int currentUserId)
    {
        // Category check
        var category = await _context.ProductCategories.FindAsync(request.CategoryId);
        if (category == null) throw new KeyNotFoundException("Category not found.");
        if (category.Status != ProductCategoryStatus.Active) throw new InvalidOperationException("Cannot create a product in an inactive category.");

        // SKU check
        if (await _context.Products.AnyAsync(p => p.SKU == request.SKU))
        {
            throw new InvalidOperationException("This SKU is already in use.");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var product = new Product
            {
                ProductName = request.ProductName,
                SKU = request.SKU,
                CategoryId = request.CategoryId,
                Brand = request.Brand,
                Description = request.Description,
                UnitOfMeasure = request.UnitOfMeasure,
                CostPrice = request.CostPrice,
                SellingPrice = request.SellingPrice,
                ReorderLevel = request.ReorderLevel,
                ImageUrl = request.ImageUrl,
                Status = request.Status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Generate ProductCode manually to avoid default constraint issues
            int seq;
            var connection = _context.Database.GetDbConnection();
            var wasClosed = connection.State == System.Data.ConnectionState.Closed;
            if (wasClosed) await connection.OpenAsync();
            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT NEXT VALUE FOR ProductCodeSeq";
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                seq = (int)await command.ExecuteScalarAsync();
            }
            finally
            {
                if (wasClosed) await connection.CloseAsync();
            }
            product.ProductCode = $"PROD-{seq:D4}";

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            await _auditService.LogAuditAsync(
                currentUserId,
                "Product Created",
                "Inventory",
                "Product",
                product.ProductCode,
                null,
                new { product.ProductName, product.SKU, product.Status },
                null
            );

            await _activityService.LogActivityAsync(
                currentUserId,
                "Created",
                "Product",
                product.ProductCode,
                $"Created new product: {product.ProductName}",
                "Inventory"
            );

            await transaction.CommitAsync();
            return await GetProductByIdAsync(product.ProductId) ?? throw new InvalidOperationException("Product creation failed.");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<ProductDetailDto> UpdateProductAsync(int id, UpdateProductDto request, int currentUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var product = await _context.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.ProductId == id);
            if (product == null) throw new KeyNotFoundException("Product not found.");

            // If changing category, check it's active
            if (product.CategoryId != request.CategoryId)
            {
                var category = await _context.ProductCategories.FindAsync(request.CategoryId);
                if (category == null) throw new KeyNotFoundException("Category not found.");
                if (category.Status != ProductCategoryStatus.Active) throw new InvalidOperationException("Cannot move a product to an inactive category.");
            }

            var oldStatus = product.Status;
            var oldValues = new { product.ProductName, product.CategoryId, product.Status };

            product.ProductName = request.ProductName;
            product.CategoryId = request.CategoryId;
            product.Brand = request.Brand;
            product.Description = request.Description;
            product.UnitOfMeasure = request.UnitOfMeasure;
            product.CostPrice = request.CostPrice;
            product.SellingPrice = request.SellingPrice;
            product.ReorderLevel = request.ReorderLevel;
            product.ImageUrl = request.ImageUrl;
            product.Status = request.Status;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var newValues = new { product.ProductName, product.CategoryId, product.Status };

            string action = oldStatus != product.Status ? 
                            $"Product {product.Status}" // Product Inactive, Product Discontinued, Product Active
                            : "Product Updated";

            await _auditService.LogAuditAsync(
                currentUserId,
                action,
                "Inventory",
                "Product",
                product.ProductCode,
                oldValues,
                newValues,
                null
            );

            await _activityService.LogActivityAsync(
                currentUserId,
                action.Replace("Product ", ""), // Updated, Inactive, Discontinued, Active
                "Product",
                product.ProductCode,
                $"{action}: {product.ProductName}",
                "Inventory"
            );

            await transaction.CommitAsync();
            return await GetProductByIdAsync(product.ProductId) ?? throw new InvalidOperationException("Product update failed.");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
