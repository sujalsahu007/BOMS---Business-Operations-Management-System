using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Data;
using System.Data.Common;

namespace Backend.Services;

public class WarehouseService : IWarehouseService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;

    public WarehouseService(ApplicationDbContext context, IAuditService auditService, IActivityService activityService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
    }

    public async Task<(IEnumerable<WarehouseDto> Items, int TotalCount)> GetWarehousesAsync(string? search, string? status, int page = 1, int pageSize = 20)
    {
        var query = _context.Warehouses
            .Include(w => w.Manager)
            .Include(w => w.Stocks)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(w => w.WarehouseName.Contains(search) || 
                                     w.WarehouseCode.Contains(search) || 
                                     w.Location.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            if (Enum.TryParse<WarehouseStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(w => w.Status == parsedStatus);
            }
        }

        var totalCount = await query.CountAsync();
        
        var warehouses = await query
            .OrderByDescending(w => w.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new WarehouseDto
            {
                WarehouseId = w.WarehouseId,
                WarehouseCode = w.WarehouseCode,
                WarehouseName = w.WarehouseName,
                Location = w.Location,
                Address = w.Address,
                ManagerUserId = w.ManagerUserId,
                ManagerName = w.Manager != null ? $"{w.Manager.FirstName} {w.Manager.LastName}" : "Unassigned",
                Capacity = w.Capacity,
                Status = w.Status.ToString(),
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt,
                ProductsCount = w.Stocks.Select(s => s.ProductId).Distinct().Count(),
                TotalAvailableUnits = w.Stocks.Sum(s => s.AvailableQuantity)
            })
            .ToListAsync();

        return (warehouses, totalCount);
    }

    public async Task<WarehouseDetailDto?> GetWarehouseByIdAsync(int warehouseId)
    {
        var w = await _context.Warehouses
            .Include(w => w.Manager)
            .Include(w => w.Stocks)
                .ThenInclude(s => s.Product)
            .FirstOrDefaultAsync(w => w.WarehouseId == warehouseId);

        if (w == null) return null;

        var dto = new WarehouseDetailDto
        {
            WarehouseId = w.WarehouseId,
            WarehouseCode = w.WarehouseCode,
            WarehouseName = w.WarehouseName,
            Location = w.Location,
            Address = w.Address,
            ManagerUserId = w.ManagerUserId,
            ManagerName = w.Manager != null ? $"{w.Manager.FirstName} {w.Manager.LastName}" : "Unassigned",
            Capacity = w.Capacity,
            Status = w.Status.ToString(),
            CreatedAt = w.CreatedAt,
            UpdatedAt = w.UpdatedAt,
            ProductsCount = w.Stocks.Select(s => s.ProductId).Distinct().Count(),
            TotalAvailableUnits = w.Stocks.Sum(s => s.AvailableQuantity)
        };

        foreach (var s in w.Stocks)
        {
            string status = "In Stock";
            if (s.AvailableQuantity == 0) status = "Out of Stock";
            else if (s.AvailableQuantity <= s.ReorderLevel) status = "Low Stock";

            dto.Stock.Add(new WarehouseStockDto
            {
                WarehouseStockId = s.WarehouseStockId,
                ProductId = s.ProductId,
                ProductName = s.Product.ProductName,
                SKU = s.Product.SKU,
                ImageUrl = s.Product.ImageUrl,
                WarehouseId = s.WarehouseId,
                WarehouseName = w.WarehouseName,
                AvailableQuantity = s.AvailableQuantity,
                ReservedQuantity = s.ReservedQuantity,
                ReorderLevel = s.ReorderLevel,
                StockStatus = status,
                LastUpdated = s.LastUpdated,
                RowVersion = Convert.ToBase64String(s.RowVersion)
            });
        }

        return dto;
    }

    public async Task<WarehouseDto> CreateWarehouseAsync(CreateWarehouseDto request, int userId, string userIp)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Validate manager
            if (request.ManagerUserId.HasValue)
            {
                var manager = await _context.Users.FindAsync(request.ManagerUserId.Value);
                if (manager == null || manager.Status != UserStatus.Active)
                    throw new ArgumentException("The selected manager is not available.");
            }

            // Get Sequence value using ADO.NET wrapper
            int seqValue = 0;
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT NEXT VALUE FOR dbo.WarehouseCodeSeq";
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                
                if (command.Connection?.State != ConnectionState.Open)
                    await command.Connection!.OpenAsync();
                    
                var result = await command.ExecuteScalarAsync();
                if (result != null)
                {
                    seqValue = Convert.ToInt32(result);
                }
            }

            string warehouseCode = $"WH-{seqValue:D4}";

            var warehouse = new Warehouse
            {
                WarehouseCode = warehouseCode,
                WarehouseName = request.WarehouseName,
                Location = request.Location,
                Address = request.Address,
                ManagerUserId = request.ManagerUserId,
                Capacity = request.Capacity,
                Status = Enum.Parse<WarehouseStatus>(request.Status),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Warehouses.Add(warehouse);
            await _context.SaveChangesAsync();

            await _auditService.LogAuditAsync(
                userId,
                "Warehouse Created",
                "Inventory",
                "Warehouse",
                warehouse.WarehouseCode,
                null,
                new { warehouse.WarehouseName, warehouse.Location, warehouse.Capacity },
                userIp
            );

            await _activityService.LogActivityAsync(
                userId,
                "Inventory",
                "Warehouse",
                warehouse.WarehouseId.ToString(),
                "Create",
                $"created warehouse {warehouse.WarehouseCode}."
            );

            await transaction.CommitAsync();
            return await GetWarehouseDtoAsync(warehouse.WarehouseId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<WarehouseDto> UpdateWarehouseAsync(int warehouseId, UpdateWarehouseDto request, int userId, string userIp)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var warehouse = await _context.Warehouses.FindAsync(warehouseId);
            if (warehouse == null) throw new KeyNotFoundException("Warehouse not found.");

            // Validate manager
            if (request.ManagerUserId.HasValue && request.ManagerUserId != warehouse.ManagerUserId)
            {
                var manager = await _context.Users.FindAsync(request.ManagerUserId.Value);
                if (manager == null || manager.Status != UserStatus.Active)
                    throw new ArgumentException("The selected manager is not available.");
            }

            var oldStatus = warehouse.Status;
            var newStatus = Enum.Parse<WarehouseStatus>(request.Status);
            string action = "Warehouse Updated";
            if (oldStatus != newStatus)
            {
                action = newStatus == WarehouseStatus.Active ? "Warehouse Activated" : "Warehouse Deactivated";
            }

            var oldValues = new { warehouse.WarehouseName, warehouse.Location, warehouse.Capacity, warehouse.ManagerUserId, warehouse.Status };
            
            warehouse.WarehouseName = request.WarehouseName;
            warehouse.Location = request.Location;
            warehouse.Address = request.Address;
            warehouse.ManagerUserId = request.ManagerUserId;
            warehouse.Capacity = request.Capacity;
            warehouse.Status = newStatus;
            warehouse.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditService.LogAuditAsync(
                userId,
                action,
                "Inventory",
                "Warehouse",
                warehouse.WarehouseCode,
                oldValues,
                new { warehouse.WarehouseName, warehouse.Location, warehouse.Capacity, warehouse.ManagerUserId, warehouse.Status },
                userIp
            );

            await _activityService.LogActivityAsync(
                userId,
                "Inventory",
                "Warehouse",
                warehouse.WarehouseId.ToString(),
                "Update",
                $"updated warehouse {warehouse.WarehouseCode}."
            );

            await transaction.CommitAsync();
            return await GetWarehouseDtoAsync(warehouse.WarehouseId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private async Task<WarehouseDto> GetWarehouseDtoAsync(int warehouseId)
    {
        var w = await _context.Warehouses
            .Include(w => w.Manager)
            .Include(w => w.Stocks)
            .FirstOrDefaultAsync(w => w.WarehouseId == warehouseId);

        return new WarehouseDto
        {
            WarehouseId = w!.WarehouseId,
            WarehouseCode = w.WarehouseCode,
            WarehouseName = w.WarehouseName,
            Location = w.Location,
            Address = w.Address,
            ManagerUserId = w.ManagerUserId,
            ManagerName = w.Manager != null ? $"{w.Manager.FirstName} {w.Manager.LastName}" : "Unassigned",
            Capacity = w.Capacity,
            Status = w.Status.ToString(),
            CreatedAt = w.CreatedAt,
            UpdatedAt = w.UpdatedAt,
            ProductsCount = w.Stocks.Select(s => s.ProductId).Distinct().Count(),
            TotalAvailableUnits = w.Stocks.Sum(s => s.AvailableQuantity)
        };
    }
}
