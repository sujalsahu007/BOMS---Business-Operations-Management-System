using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services;

public class GoodsReceiptService : IGoodsReceiptService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;
    private readonly INotificationService _notificationService;

    public GoodsReceiptService(
        ApplicationDbContext context,
        IAuditService auditService,
        IActivityService activityService,
        INotificationService notificationService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
        _notificationService = notificationService;
    }

    public async Task<PaginatedResult<GoodsReceiptListDto>> GetGoodsReceiptsAsync(int page, int pageSize, string? search, string? status, int? warehouseId, DateTime? date)
    {
        var query = _context.GoodsReceipts
            .Include(gr => gr.PurchaseOrder)
                .ThenInclude(po => po.Supplier)
            .Include(gr => gr.Warehouse)
            .Include(gr => gr.Receiver)
            .Include(gr => gr.Items)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(gr => 
                gr.ReceiptNumber.ToLower().Contains(s) || 
                gr.PurchaseOrder.PONumber.ToLower().Contains(s) ||
                gr.PurchaseOrder.Supplier.SupplierName.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(gr => gr.Status == status);
        }

        if (warehouseId.HasValue)
        {
            query = query.Where(gr => gr.WarehouseId == warehouseId.Value);
        }

        if (date.HasValue)
        {
            query = query.Where(gr => gr.ReceiptDate.Date == date.Value.Date);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(gr => gr.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(gr => new GoodsReceiptListDto
            {
                ReceiptId = gr.ReceiptId,
                ReceiptNumber = gr.ReceiptNumber,
                PONumber = gr.PurchaseOrder.PONumber,
                SupplierName = gr.PurchaseOrder.Supplier.SupplierName,
                WarehouseCode = gr.Warehouse.WarehouseCode,
                ReceiptDate = gr.ReceiptDate,
                ReceivedByName = $"{gr.Receiver.FirstName} {gr.Receiver.LastName}",
                TotalItems = gr.Items.Count,
                Status = gr.Status,
                CreatedAt = gr.CreatedAt
            })
            .ToListAsync();

        return new PaginatedResult<GoodsReceiptListDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<GoodsReceiptDetailDto?> GetGoodsReceiptByIdAsync(int id)
    {
        var gr = await _context.GoodsReceipts
            .Include(g => g.PurchaseOrder).ThenInclude(p => p.Supplier)
            .Include(g => g.Warehouse)
            .Include(g => g.Receiver)
            .Include(g => g.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(g => g.ReceiptId == id);

        if (gr == null) return null;

        var activities = await _context.Activities
            .Include(a => a.User)
            .Where(a => a.Module == "Inventory" && a.EntityType == "GoodsReceipt" && a.EntityId == gr.ReceiptNumber)
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

        var txns = await _context.InventoryTransactions
            .Include(t => t.Product)
            .Include(t => t.Warehouse)
            .Where(t => t.ReferenceType == "GoodsReceipt" && t.ReferenceId == gr.ReceiptId)
            .Select(t => new InventoryTransactionDto
            {
                TransactionCode = t.TransactionCode,
                ProductName = t.Product.ProductName,
                WarehouseName = t.Warehouse.WarehouseName,
                TransactionType = t.TransactionType.ToString(),
                Quantity = t.Quantity,
                PreviousQuantity = t.PreviousQuantity,
                NewQuantity = t.NewQuantity,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return new GoodsReceiptDetailDto
        {
            ReceiptId = gr.ReceiptId,
            ReceiptNumber = gr.ReceiptNumber,
            PurchaseOrderId = gr.PurchaseOrderId,
            PONumber = gr.PurchaseOrder.PONumber,
            SupplierName = gr.PurchaseOrder.Supplier.SupplierName,
            WarehouseCode = gr.Warehouse.WarehouseCode,
            WarehouseName = gr.Warehouse.WarehouseName,
            ReceiptDate = gr.ReceiptDate,
            ReceivedByName = $"{gr.Receiver.FirstName} {gr.Receiver.LastName}",
            Remarks = gr.Remarks,
            Status = gr.Status,
            CreatedAt = gr.CreatedAt,
            Items = gr.Items.Select(i => new GoodsReceiptItemDto
            {
                ReceiptItemId = i.ReceiptItemId,
                ProductId = i.ProductId,
                ProductName = i.Product.ProductName,
                SKU = i.Product.SKU,
                OrderedQuantity = i.OrderedQuantity,
                PreviouslyReceivedQuantity = i.PreviouslyReceivedQuantity,
                ReceivedNowQuantity = i.ReceivedNowQuantity,
                RemainingQuantity = i.RemainingQuantity
            }).ToList(),
            RecentActivities = activities,
            InventoryTransactions = txns
        };
    }

    public async Task<PaginatedResult<EligiblePurchaseOrderDto>> GetEligiblePurchaseOrdersAsync(int page, int pageSize, string? search)
    {
        var eligibleStatuses = new[] { "Approved", "Ordered", "PartiallyReceived" };

        var query = _context.PurchaseOrders
            .Include(po => po.Supplier)
            .Include(po => po.Warehouse)
            .Include(po => po.Items).ThenInclude(i => i.Product)
            .Where(po => eligibleStatuses.Contains(po.Status));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(po => 
                po.PONumber.ToLower().Contains(s) || 
                po.Supplier.SupplierName.ToLower().Contains(s));
        }

        var total = await query.CountAsync();

        var pos = await query
            .OrderByDescending(po => po.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(po => new EligiblePurchaseOrderDto
            {
                PurchaseOrderId = po.PurchaseOrderId,
                PONumber = po.PONumber,
                SupplierId = po.SupplierId,
                SupplierName = po.Supplier.SupplierName,
                WarehouseId = po.WarehouseId,
                WarehouseCode = po.Warehouse.WarehouseCode,
                WarehouseName = po.Warehouse.WarehouseName,
                OrderDate = po.OrderDate,
                ExpectedDeliveryDate = po.ExpectedDeliveryDate,
                Status = po.Status,
                Items = po.Items.Select(i => new EligiblePurchaseOrderItemDto
                {
                    PurchaseOrderItemId = i.POItemId,
                    ProductId = i.ProductId,
                    ProductName = i.Product.ProductName,
                    SKU = i.Product.SKU,
                    OrderedQuantity = i.Quantity,
                    PreviouslyReceivedQuantity = i.ReceivedQuantity,
                    RemainingQuantity = i.Quantity - i.ReceivedQuantity
                }).ToList()
            })
            .ToListAsync();

        // Filter out POs where all items are fully received just in case status is out of sync
        var items = pos.Where(p => p.Items.Any(i => i.RemainingQuantity > 0)).ToList();

        return new PaginatedResult<EligiblePurchaseOrderDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<GoodsReceiptDetailDto> CreateGoodsReceiptAsync(CreateGoodsReceiptDto request, int currentUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Validate Purchase Order
            var po = await _context.PurchaseOrders
                .Include(p => p.Items)
                .Include(p => p.Creator)
                .FirstOrDefaultAsync(p => p.PurchaseOrderId == request.PurchaseOrderId);

            if (po == null)
                throw new KeyNotFoundException("Purchase Order not found.");

            // 2. Validate PO Status
            var eligibleStatuses = new[] { "Approved", "Ordered", "PartiallyReceived" };
            if (!eligibleStatuses.Contains(po.Status))
                throw new InvalidOperationException($"Purchase Order status is {po.Status}, which is not eligible for receiving.");

            // 4. Create GoodsReceipt
            var goodsReceipt = new GoodsReceipt
            {
                PurchaseOrderId = po.PurchaseOrderId,
                WarehouseId = po.WarehouseId,
                ReceiptDate = DateTime.UtcNow,
                ReceivedBy = currentUserId,
                Remarks = request.Remarks,
                Status = "Completed",
                CreatedAt = DateTime.UtcNow
            };

            // Generate receipt number safely
            var connection = _context.Database.GetDbConnection();
            var wasClosed = connection.State == System.Data.ConnectionState.Closed;
            if (wasClosed) await connection.OpenAsync();
            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT NEXT VALUE FOR GoodsReceiptNumberSeq";
                command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                var seqResult = await command.ExecuteScalarAsync();
                int seq = Convert.ToInt32(seqResult);
                goodsReceipt.ReceiptNumber = $"GR-{seq:D4}";
            }
            finally
            {
                if (wasClosed) await connection.CloseAsync();
            }

            _context.GoodsReceipts.Add(goodsReceipt);
            await _context.SaveChangesAsync(); // get ReceiptId

            // Process Items
            var txnsToInsert = new List<InventoryTransaction>();

            foreach (var reqItem in request.Items)
            {
                var poItem = po.Items.FirstOrDefault(i => i.POItemId == reqItem.PurchaseOrderItemId);
                if (poItem == null)
                    throw new InvalidOperationException($"PO Item {reqItem.PurchaseOrderItemId} not found in this Purchase Order.");

                // 3. Validate received quantities
                int remaining = poItem.Quantity - poItem.ReceivedQuantity;
                if (reqItem.ReceivedNowQuantity <= 0)
                    throw new InvalidOperationException("Received quantity must be greater than zero.");
                if (reqItem.ReceivedNowQuantity > remaining)
                    throw new InvalidOperationException($"Cannot receive more than remaining quantity ({remaining}) for product {poItem.ProductId}.");

                var grItem = new GoodsReceiptItem
                {
                    GoodsReceiptId = goodsReceipt.ReceiptId,
                    ProductId = poItem.ProductId,
                    PurchaseOrderItemId = poItem.POItemId,
                    OrderedQuantity = poItem.Quantity,
                    PreviouslyReceivedQuantity = poItem.ReceivedQuantity,
                    ReceivedNowQuantity = reqItem.ReceivedNowQuantity,
                    RemainingQuantity = remaining - reqItem.ReceivedNowQuantity
                };
                _context.GoodsReceiptItems.Add(grItem);

                // 8. Update PurchaseOrderItem received quantities
                poItem.ReceivedQuantity += reqItem.ReceivedNowQuantity;

                // 6. Update WarehouseStock
                var stock = await _context.WarehouseStocks
                    .FirstOrDefaultAsync(s => s.ProductId == poItem.ProductId && s.WarehouseId == po.WarehouseId);

                int previousQuantity = 0;
                if (stock == null)
                {
                    stock = new WarehouseStock
                    {
                        ProductId = poItem.ProductId,
                        WarehouseId = po.WarehouseId,
                        AvailableQuantity = reqItem.ReceivedNowQuantity,
                        LastUpdated = DateTime.UtcNow
                    };
                    _context.WarehouseStocks.Add(stock);
                }
                else
                {
                    previousQuantity = stock.AvailableQuantity;
                    stock.AvailableQuantity += reqItem.ReceivedNowQuantity;
                    stock.LastUpdated = DateTime.UtcNow;
                    _context.WarehouseStocks.Update(stock);
                }

                // Generate TransactionCode
                int txnSeq;
                wasClosed = connection.State == System.Data.ConnectionState.Closed;
                if (wasClosed) await connection.OpenAsync();
                try
                {
                    using var command = connection.CreateCommand();
                    command.CommandText = "SELECT NEXT VALUE FOR TransactionCodeSeq";
                    command.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                    txnSeq = Convert.ToInt32(await command.ExecuteScalarAsync());
                }
                finally
                {
                    if (wasClosed) await connection.CloseAsync();
                }

                // 7. Create InventoryTransaction records
                var txn = new InventoryTransaction
                {
                    TransactionCode = $"TXN-{txnSeq:D4}",
                    ProductId = poItem.ProductId,
                    WarehouseId = po.WarehouseId,
                    TransactionType = TransactionType.StockIn,
                    Quantity = reqItem.ReceivedNowQuantity,
                    PreviousQuantity = previousQuantity,
                    NewQuantity = previousQuantity + reqItem.ReceivedNowQuantity,
                    ReferenceType = "GoodsReceipt",
                    ReferenceId = goodsReceipt.ReceiptId,
                    Reason = $"Received from PO {po.PONumber}",
                    CreatedBy = currentUserId,
                    CreatedAt = DateTime.UtcNow
                };
                txnsToInsert.Add(txn);
            }

            _context.InventoryTransactions.AddRange(txnsToInsert);

            // 9. Update PurchaseOrder delivery status
            bool isFullyReceived = po.Items.All(i => i.ReceivedQuantity >= i.Quantity);
            po.Status = isFullyReceived ? "FullyReceived" : "PartiallyReceived";
            po.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // 10. Create Audit entries
            await _auditService.LogAuditAsync(
                currentUserId,
                "Goods Receipt Created",
                "Inventory",
                "GoodsReceipt",
                goodsReceipt.ReceiptNumber,
                null,
                new { goodsReceipt.PurchaseOrderId, goodsReceipt.Status },
                null
            );

            // 11. Create Activity entries
            await _activityService.LogActivityAsync(
                currentUserId,
                "Created",
                "GoodsReceipt",
                goodsReceipt.ReceiptNumber,
                $"Goods Receipt {goodsReceipt.ReceiptNumber} created for PO {po.PONumber}.",
                "Inventory"
            );

            await _activityService.LogActivityAsync(
                currentUserId,
                "Updated",
                "PurchaseOrder",
                po.PONumber,
                $"PO {po.PONumber} is now {po.Status.ToLower()}.",
                "Inventory"
            );

            // 12. Create Notifications
            if (po.CreatedBy != currentUserId)
            {
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    RecipientUserId = po.CreatedBy,
                    Type = "Inventory",
                    Priority = "Normal",
                    Title = $"PO {po.PONumber} Received",
                    Message = $"Goods Receipt {goodsReceipt.ReceiptNumber} created. Status is now {po.Status}.",
                    ReferenceType = "PurchaseOrder",
                    ReferenceId = po.PONumber
                });
            }

            await transaction.CommitAsync();

            return await GetGoodsReceiptByIdAsync(goodsReceipt.ReceiptId) 
                ?? throw new InvalidOperationException("Failed to load created receipt.");
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync();
            throw new InvalidOperationException("Another user updated this stock concurrently. Refresh and try again.");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
