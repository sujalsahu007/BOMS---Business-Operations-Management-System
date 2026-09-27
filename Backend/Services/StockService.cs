using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Data;

namespace Backend.Services;

public class StockService : IStockService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;

    public StockService(ApplicationDbContext context, IAuditService auditService, IActivityService activityService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
    }

    public async Task<(IEnumerable<WarehouseStockDto> Items, int TotalCount)> GetStockOverviewAsync(StockOverviewQueryDto query)
    {
        var dbQuery = _context.WarehouseStocks
            .Include(s => s.Product)
            .Include(s => s.Warehouse)
            .AsQueryable();

        if (query.ProductId.HasValue)
        {
            dbQuery = dbQuery.Where(s => s.ProductId == query.ProductId.Value);
        }

        if (query.WarehouseId.HasValue)
        {
            dbQuery = dbQuery.Where(s => s.WarehouseId == query.WarehouseId.Value);
        }

        // We can't filter StockStatus easily in SQL because it's calculated on the fly.
        // But for this prompt, we'll fetch then filter if needed, or translate to a simple SQL condition.
        if (!string.IsNullOrWhiteSpace(query.StockStatus))
        {
            if (query.StockStatus == "Out of Stock")
                dbQuery = dbQuery.Where(s => s.AvailableQuantity == 0);
            else if (query.StockStatus == "Low Stock")
                dbQuery = dbQuery.Where(s => s.AvailableQuantity > 0 && s.AvailableQuantity <= s.ReorderLevel);
            else if (query.StockStatus == "In Stock")
                dbQuery = dbQuery.Where(s => s.AvailableQuantity > s.ReorderLevel);
        }

        var totalCount = await dbQuery.CountAsync();

        var stocks = await dbQuery
            .OrderByDescending(s => s.LastUpdated)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(s => new WarehouseStockDto
            {
                WarehouseStockId = s.WarehouseStockId,
                ProductId = s.ProductId,
                ProductName = s.Product.ProductName,
                SKU = s.Product.SKU,
                ImageUrl = s.Product.ImageUrl,
                WarehouseId = s.WarehouseId,
                WarehouseName = s.Warehouse.WarehouseName,
                AvailableQuantity = s.AvailableQuantity,
                ReservedQuantity = s.ReservedQuantity,
                ReorderLevel = s.ReorderLevel,
                StockStatus = s.AvailableQuantity == 0 ? "Out of Stock" : (s.AvailableQuantity <= s.ReorderLevel ? "Low Stock" : "In Stock"),
                LastUpdated = s.LastUpdated,
                RowVersion = Convert.ToBase64String(s.RowVersion)
            })
            .ToListAsync();

        return (stocks, totalCount);
    }

    public async Task<(IEnumerable<InventoryTransactionDto> Items, int TotalCount)> GetTransactionsAsync(int? warehouseId, int? productId, int page = 1, int pageSize = 20)
    {
        var query = _context.InventoryTransactions
            .Include(t => t.Product)
            .Include(t => t.Warehouse)
            .Include(t => t.Creator)
            .AsQueryable();

        if (warehouseId.HasValue)
            query = query.Where(t => t.WarehouseId == warehouseId.Value);
            
        if (productId.HasValue)
            query = query.Where(t => t.ProductId == productId.Value);

        var totalCount = await query.CountAsync();

        var txns = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new InventoryTransactionDto
            {
                TransactionId = t.TransactionId,
                TransactionCode = t.TransactionCode,
                ProductId = t.ProductId,
                ProductName = t.Product.ProductName,
                WarehouseId = t.WarehouseId,
                WarehouseName = t.Warehouse.WarehouseName,
                TransactionType = t.TransactionType.ToString(),
                Quantity = t.Quantity,
                PreviousQuantity = t.PreviousQuantity,
                NewQuantity = t.NewQuantity,
                ReferenceType = t.ReferenceType,
                ReferenceId = t.ReferenceId,
                Reason = t.Reason,
                CreatedBy = t.CreatedBy,
                CreatorName = $"{t.Creator.FirstName} {t.Creator.LastName}",
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return (txns, totalCount);
    }

    public async Task<WarehouseStockDto> InitializeStockAsync(InitializeStockDto request, int userId, string userIp)
    {
        if (request.InitialQuantity < 0)
            throw new ArgumentException("Stock quantity cannot be negative.");

        var warehouse = await _context.Warehouses.FindAsync(request.WarehouseId);
        if (warehouse == null || warehouse.Status != WarehouseStatus.Active)
            throw new ArgumentException("Invalid or inactive warehouse.");

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null || product.Status != ProductStatus.Active)
            throw new ArgumentException("Invalid or inactive product.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var stock = await _context.WarehouseStocks
                .FirstOrDefaultAsync(s => s.ProductId == request.ProductId && s.WarehouseId == request.WarehouseId);

            int previousQuantity = stock?.AvailableQuantity ?? 0;
            int newQuantity = previousQuantity + request.InitialQuantity;

            if (stock == null)
            {
                stock = new WarehouseStock
                {
                    ProductId = request.ProductId,
                    WarehouseId = request.WarehouseId,
                    AvailableQuantity = newQuantity,
                    ReorderLevel = product.ReorderLevel,
                    LastUpdated = DateTime.UtcNow
                };
                _context.WarehouseStocks.Add(stock);
            }
            else
            {
                stock.AvailableQuantity = newQuantity;
                stock.LastUpdated = DateTime.UtcNow;
            }

            int seqValue = 0;
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT NEXT VALUE FOR TransactionCodeSeq;";
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                
                if (command.Connection?.State != ConnectionState.Open)
                    await command.Connection!.OpenAsync();
                    
                var result = await command.ExecuteScalarAsync();
                if (result != null) seqValue = Convert.ToInt32(result);
            }

            var txn = new InventoryTransaction
            {
                TransactionCode = $"TXN-{seqValue:D6}",
                ProductId = request.ProductId,
                WarehouseId = request.WarehouseId,
                TransactionType = TransactionType.InitialStock,
                Quantity = request.InitialQuantity,
                PreviousQuantity = previousQuantity,
                NewQuantity = newQuantity,
                ReferenceType = "Initialization",
                Reason = request.Reason,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.InventoryTransactions.Add(txn);
            await _context.SaveChangesAsync();

            await _auditService.LogAuditAsync(
                userId,
                "Stock Initialized",
                "Inventory",
                "WarehouseStock",
                $"{request.WarehouseId}-{request.ProductId}",
                new { previousQuantity },
                new { newQuantity, request.Reason },
                userIp
            );

            await _activityService.LogActivityAsync(
                userId,
                "Inventory",
                "Warehouse",
                warehouse.WarehouseId.ToString(),
                "StockInit",
                $"initialized {request.InitialQuantity} units of {product.ProductCode} in {warehouse.WarehouseCode}."
            );

            await transaction.CommitAsync();

            string status = "In Stock";
            if (stock.AvailableQuantity == 0) status = "Out of Stock";
            else if (stock.AvailableQuantity <= stock.ReorderLevel) status = "Low Stock";

            return new WarehouseStockDto
            {
                WarehouseStockId = stock.WarehouseStockId,
                ProductId = stock.ProductId,
                ProductName = product.ProductName,
                SKU = product.SKU,
                ImageUrl = product.ImageUrl,
                WarehouseId = stock.WarehouseId,
                WarehouseName = warehouse.WarehouseName,
                AvailableQuantity = stock.AvailableQuantity,
                ReservedQuantity = stock.ReservedQuantity,
                ReorderLevel = stock.ReorderLevel,
                StockStatus = status,
                LastUpdated = stock.LastUpdated,
                RowVersion = Convert.ToBase64String(stock.RowVersion)
            };
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync();
            throw new InvalidOperationException("This stock record was updated by another user. Refresh and try again.");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<(IEnumerable<StockTransferDto> Items, int TotalCount)> GetTransfersAsync(int page = 1, int pageSize = 20)
    {
        var query = _context.StockTransfers
            .Include(t => t.Product)
            .Include(t => t.SourceWarehouse)
            .Include(t => t.DestinationWarehouse)
            .Include(t => t.Creator)
            .AsQueryable();

        var totalCount = await query.CountAsync();

        var transfers = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new StockTransferDto
            {
                TransferId = t.TransferId,
                TransferNumber = t.TransferNumber,
                ProductId = t.ProductId,
                ProductName = t.Product.ProductName,
                SourceWarehouseId = t.SourceWarehouseId,
                SourceWarehouseName = t.SourceWarehouse.WarehouseName,
                DestinationWarehouseId = t.DestinationWarehouseId,
                DestinationWarehouseName = t.DestinationWarehouse.WarehouseName,
                Quantity = t.Quantity,
                Remarks = t.Remarks,
                Status = t.Status,
                CreatedBy = t.CreatedBy,
                CreatorName = $"{t.Creator.FirstName} {t.Creator.LastName}",
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return (transfers, totalCount);
    }

    public async Task<StockTransferDto> CreateTransferAsync(TransferStockDto request, int userId, string userIp)
    {
        if (request.Quantity <= 0)
            throw new ArgumentException("Transfer quantity must be greater than zero.");
            
        if (request.SourceWarehouseId == request.DestinationWarehouseId)
            throw new ArgumentException("Source and destination warehouses must be different.");

        var sourceWh = await _context.Warehouses.FindAsync(request.SourceWarehouseId);
        var destWh = await _context.Warehouses.FindAsync(request.DestinationWarehouseId);
        
        if (sourceWh == null || sourceWh.Status != WarehouseStatus.Active || destWh == null || destWh.Status != WarehouseStatus.Active)
            throw new ArgumentException("One or both warehouses are invalid or inactive.");

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null || product.Status != ProductStatus.Active)
            throw new ArgumentException("Invalid or inactive product.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var sourceStock = await _context.WarehouseStocks
                .FirstOrDefaultAsync(s => s.ProductId == request.ProductId && s.WarehouseId == request.SourceWarehouseId);
                
            if (sourceStock == null || sourceStock.AvailableQuantity < request.Quantity)
                throw new ArgumentException("Transfer quantity exceeds available source stock.");

            var destStock = await _context.WarehouseStocks
                .FirstOrDefaultAsync(s => s.ProductId == request.ProductId && s.WarehouseId == request.DestinationWarehouseId);

            int sourcePrevQty = sourceStock.AvailableQuantity;
            int sourceNewQty = sourcePrevQty - request.Quantity;
            
            sourceStock.AvailableQuantity = sourceNewQty;
            sourceStock.LastUpdated = DateTime.UtcNow;

            int destPrevQty = destStock?.AvailableQuantity ?? 0;
            int destNewQty = destPrevQty + request.Quantity;

            if (destStock == null)
            {
                destStock = new WarehouseStock
                {
                    ProductId = request.ProductId,
                    WarehouseId = request.DestinationWarehouseId,
                    AvailableQuantity = destNewQty,
                    ReorderLevel = product.ReorderLevel,
                    LastUpdated = DateTime.UtcNow
                };
                _context.WarehouseStocks.Add(destStock);
            }
            else
            {
                destStock.AvailableQuantity = destNewQty;
                destStock.LastUpdated = DateTime.UtcNow;
            }
            
            var transfer = new StockTransfer
            {
                TransferNumber = $"TRF-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
                ProductId = request.ProductId,
                SourceWarehouseId = request.SourceWarehouseId,
                DestinationWarehouseId = request.DestinationWarehouseId,
                Quantity = request.Quantity,
                Remarks = request.Remarks,
                Status = "Completed",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.StockTransfers.Add(transfer);
            await _context.SaveChangesAsync(); // To get TransferId
            
            int seqValueOut = 0, seqValueIn = 0;
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT NEXT VALUE FOR TransactionCodeSeq;";
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                if (command.Connection?.State != ConnectionState.Open) await command.Connection!.OpenAsync();
                
                var r1 = await command.ExecuteScalarAsync();
                if (r1 != null) seqValueOut = Convert.ToInt32(r1);
                
                var r2 = await command.ExecuteScalarAsync();
                if (r2 != null) seqValueIn = Convert.ToInt32(r2);
            }

            var txnOut = new InventoryTransaction
            {
                TransactionCode = $"TXN-{seqValueOut:D6}",
                ProductId = request.ProductId,
                WarehouseId = request.SourceWarehouseId,
                TransactionType = TransactionType.TransferOut,
                Quantity = request.Quantity,
                PreviousQuantity = sourcePrevQty,
                NewQuantity = sourceNewQty,
                ReferenceType = "Transfer",
                ReferenceId = transfer.TransferId,
                Reason = $"Transfer to {destWh.WarehouseCode}: {request.Remarks}",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };
            
            var txnIn = new InventoryTransaction
            {
                TransactionCode = $"TXN-{seqValueIn:D6}",
                ProductId = request.ProductId,
                WarehouseId = request.DestinationWarehouseId,
                TransactionType = TransactionType.TransferIn,
                Quantity = request.Quantity,
                PreviousQuantity = destPrevQty,
                NewQuantity = destNewQty,
                ReferenceType = "Transfer",
                ReferenceId = transfer.TransferId,
                Reason = $"Transfer from {sourceWh.WarehouseCode}: {request.Remarks}",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.InventoryTransactions.AddRange(txnOut, txnIn);
            await _context.SaveChangesAsync();
            
            await _auditService.LogAuditAsync(userId, "Stock Transferred", "Inventory", "StockTransfer", transfer.TransferId.ToString(), new { sourcePrevQty, destPrevQty }, new { sourceNewQty, destNewQty }, userIp);
            await _activityService.LogActivityAsync(userId, "Inventory", "Warehouse", request.SourceWarehouseId.ToString(), "Transferred", $"{request.Quantity} units of {product.ProductCode} transferred from {sourceWh.WarehouseCode} to {destWh.WarehouseCode}.");

            await transaction.CommitAsync();
            
            var creator = await _context.Users.FindAsync(userId);
            
            return new StockTransferDto
            {
                TransferId = transfer.TransferId,
                TransferNumber = transfer.TransferNumber,
                ProductId = transfer.ProductId,
                ProductName = product.ProductName,
                SourceWarehouseId = transfer.SourceWarehouseId,
                SourceWarehouseName = sourceWh.WarehouseName,
                DestinationWarehouseId = transfer.DestinationWarehouseId,
                DestinationWarehouseName = destWh.WarehouseName,
                Quantity = transfer.Quantity,
                Remarks = transfer.Remarks,
                Status = transfer.Status,
                CreatedBy = transfer.CreatedBy,
                CreatorName = creator != null ? $"{creator.FirstName} {creator.LastName}" : string.Empty,
                CreatedAt = transfer.CreatedAt
            };
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync();
            throw new InvalidOperationException("Stock was updated by another user. Refresh and try again.");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<(IEnumerable<StockAdjustmentDto> Items, int TotalCount)> GetAdjustmentsAsync(int page = 1, int pageSize = 20)
    {
        var query = _context.StockAdjustments
            .Include(a => a.Product)
            .Include(a => a.Warehouse)
            .Include(a => a.Creator)
            .AsQueryable();

        var totalCount = await query.CountAsync();

        var adjustments = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new StockAdjustmentDto
            {
                AdjustmentId = a.AdjustmentId,
                AdjustmentNumber = a.AdjustmentNumber,
                ProductId = a.ProductId,
                ProductName = a.Product.ProductName,
                WarehouseId = a.WarehouseId,
                WarehouseName = a.Warehouse.WarehouseName,
                AdjustmentType = a.AdjustmentType,
                Quantity = a.Quantity,
                Reason = a.Reason,
                Status = a.Status,
                CreatedBy = a.CreatedBy,
                CreatorName = $"{a.Creator.FirstName} {a.Creator.LastName}",
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return (adjustments, totalCount);
    }

    public async Task<StockAdjustmentDto> CreateAdjustmentAsync(AdjustStockDto request, int userId, string userIp)
    {
        if (request.Quantity <= 0)
            throw new ArgumentException("Adjustment quantity must be greater than zero.");
            
        if (request.AdjustmentType != "Increase" && request.AdjustmentType != "Decrease")
            throw new ArgumentException("Adjustment type must be either 'Increase' or 'Decrease'.");

        var warehouse = await _context.Warehouses.FindAsync(request.WarehouseId);
        if (warehouse == null || warehouse.Status != WarehouseStatus.Active)
            throw new ArgumentException("Invalid or inactive warehouse.");

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null || product.Status != ProductStatus.Active)
            throw new ArgumentException("Invalid or inactive product.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var stock = await _context.WarehouseStocks
                .FirstOrDefaultAsync(s => s.ProductId == request.ProductId && s.WarehouseId == request.WarehouseId);

            int previousQuantity = stock?.AvailableQuantity ?? 0;
            int newQuantity = request.AdjustmentType == "Increase" 
                ? previousQuantity + request.Quantity 
                : previousQuantity - request.Quantity;

            if (newQuantity < 0)
                throw new ArgumentException("Adjustment would result in negative stock.");

            if (stock == null)
            {
                stock = new WarehouseStock
                {
                    ProductId = request.ProductId,
                    WarehouseId = request.WarehouseId,
                    AvailableQuantity = newQuantity,
                    ReorderLevel = product.ReorderLevel,
                    LastUpdated = DateTime.UtcNow
                };
                _context.WarehouseStocks.Add(stock);
            }
            else
            {
                stock.AvailableQuantity = newQuantity;
                stock.LastUpdated = DateTime.UtcNow;
            }
            
            var adjustment = new StockAdjustment
            {
                AdjustmentNumber = $"ADJ-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
                ProductId = request.ProductId,
                WarehouseId = request.WarehouseId,
                AdjustmentType = request.AdjustmentType,
                Quantity = request.Quantity,
                Reason = request.Reason,
                Status = "Completed",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.StockAdjustments.Add(adjustment);
            await _context.SaveChangesAsync();
            
            int seqValue = 0;
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT NEXT VALUE FOR TransactionCodeSeq;";
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                if (command.Connection?.State != ConnectionState.Open) await command.Connection!.OpenAsync();
                var r = await command.ExecuteScalarAsync();
                if (r != null) seqValue = Convert.ToInt32(r);
            }

            var txnType = request.AdjustmentType == "Increase" ? TransactionType.AdjustmentIncrease : TransactionType.AdjustmentDecrease;

            var txn = new InventoryTransaction
            {
                TransactionCode = $"TXN-{seqValue:D6}",
                ProductId = request.ProductId,
                WarehouseId = request.WarehouseId,
                TransactionType = txnType,
                Quantity = request.Quantity,
                PreviousQuantity = previousQuantity,
                NewQuantity = newQuantity,
                ReferenceType = "Adjustment",
                ReferenceId = adjustment.AdjustmentId,
                Reason = request.Reason,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.InventoryTransactions.Add(txn);
            await _context.SaveChangesAsync();
            
            await _auditService.LogAuditAsync(userId, $"Stock Adjusted ({request.AdjustmentType})", "Inventory", "StockAdjustment", adjustment.AdjustmentId.ToString(), new { previousQuantity }, new { newQuantity }, userIp);
            
            string actionText = request.AdjustmentType == "Increase" ? "adjusted into" : "adjusted out of";
            await _activityService.LogActivityAsync(userId, "Inventory", "Warehouse", request.WarehouseId.ToString(), "Adjusted", $"{request.Quantity} units of {product.ProductCode} {actionText} {warehouse.WarehouseCode}.");

            await transaction.CommitAsync();
            
            var creator = await _context.Users.FindAsync(userId);
            
            return new StockAdjustmentDto
            {
                AdjustmentId = adjustment.AdjustmentId,
                AdjustmentNumber = adjustment.AdjustmentNumber,
                ProductId = adjustment.ProductId,
                ProductName = product.ProductName,
                WarehouseId = adjustment.WarehouseId,
                WarehouseName = warehouse.WarehouseName,
                AdjustmentType = adjustment.AdjustmentType,
                Quantity = adjustment.Quantity,
                Reason = adjustment.Reason,
                Status = adjustment.Status,
                CreatedBy = adjustment.CreatedBy,
                CreatorName = creator != null ? $"{creator.FirstName} {creator.LastName}" : string.Empty,
                CreatedAt = adjustment.CreatedAt
            };
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync();
            throw new InvalidOperationException("Stock was updated by another user. Refresh and try again.");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
