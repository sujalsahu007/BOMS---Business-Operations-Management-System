using Backend.Data;
using Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize]
public class InventoryDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public InventoryDashboardController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<InventoryDashboardDto>> GetDashboard()
    {
        var dto = new InventoryDashboardDto();

        // --- KPIs (database-side counts) ---
        dto.TotalProducts = await _db.Products.CountAsync();
        dto.TotalWarehouses = await _db.Warehouses.CountAsync();
        dto.TotalStockQuantity = await _db.WarehouseStocks.SumAsync(ws => ws.AvailableQuantity);

        // Low stock: Available > 0 AND Available <= ReorderLevel AND ReorderLevel > 0
        dto.LowStockCount = await _db.WarehouseStocks
            .Where(ws => ws.AvailableQuantity > 0 && ws.ReorderLevel > 0 && ws.AvailableQuantity <= ws.ReorderLevel)
            .CountAsync();

        // Out of stock: Available == 0
        dto.OutOfStockCount = await _db.WarehouseStocks
            .Where(ws => ws.AvailableQuantity == 0)
            .CountAsync();

        // Pending POs: Draft or Submitted status
        dto.PendingPurchaseOrders = await _db.PurchaseOrders
            .Where(po => po.Status == "Draft" || po.Status == "Submitted")
            .CountAsync();

        // Pending receipts: Approved POs that are not FullyReceived
        dto.PendingGoodsReceipts = await _db.PurchaseOrders
            .Where(po => po.Status == "Approved" || po.Status == "PartiallyReceived")
            .CountAsync();

        // --- Stock Overview ---
        dto.InStockItems = await _db.WarehouseStocks
            .Where(ws => ws.AvailableQuantity > 0 && (ws.ReorderLevel == 0 || ws.AvailableQuantity > ws.ReorderLevel))
            .CountAsync();

        // --- Low Stock Items (top 10) ---
        dto.LowStockItems = await _db.WarehouseStocks
            .Include(ws => ws.Product)
            .Include(ws => ws.Warehouse)
            .Where(ws => ws.AvailableQuantity > 0 && ws.ReorderLevel > 0 && ws.AvailableQuantity <= ws.ReorderLevel)
            .OrderBy(ws => ws.AvailableQuantity)
            .Take(10)
            .Select(ws => new DashboardStockAlertDto
            {
                ProductId = ws.ProductId,
                ProductName = ws.Product.ProductName,
                SKU = ws.Product.SKU,
                WarehouseName = ws.Warehouse.WarehouseName,
                AvailableQuantity = ws.AvailableQuantity,
                ReorderLevel = ws.ReorderLevel
            })
            .ToListAsync();

        // --- Out of Stock Items (top 10) ---
        dto.OutOfStockItems = await _db.WarehouseStocks
            .Include(ws => ws.Product)
            .Include(ws => ws.Warehouse)
            .Where(ws => ws.AvailableQuantity == 0)
            .Take(10)
            .Select(ws => new DashboardStockAlertDto
            {
                ProductId = ws.ProductId,
                ProductName = ws.Product.ProductName,
                SKU = ws.Product.SKU,
                WarehouseName = ws.Warehouse.WarehouseName,
                AvailableQuantity = 0,
                ReorderLevel = ws.ReorderLevel
            })
            .ToListAsync();

        // --- Recent Transactions (last 10) ---
        dto.RecentTransactions = await _db.InventoryTransactions
            .Include(t => t.Product)
            .Include(t => t.Warehouse)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new DashboardTransactionDto
            {
                TransactionCode = t.TransactionCode,
                ProductName = t.Product.ProductName,
                WarehouseName = t.Warehouse.WarehouseName,
                TransactionType = t.TransactionType.ToString(),
                Quantity = t.Quantity,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        // --- PO Status Summary ---
        dto.PurchaseOrderSummary = await _db.PurchaseOrders
            .GroupBy(po => po.Status)
            .Select(g => new DashboardStatusCountDto
            {
                Status = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        // --- Recent Goods Receipts (last 5) ---
        dto.RecentGoodsReceipts = await _db.GoodsReceipts
            .Include(gr => gr.PurchaseOrder)
            .Include(gr => gr.Warehouse)
            .Include(gr => gr.Items)
            .OrderByDescending(gr => gr.CreatedAt)
            .Take(5)
            .Select(gr => new DashboardGoodsReceiptDto
            {
                ReceiptNumber = gr.ReceiptNumber,
                PONumber = gr.PurchaseOrder.PONumber,
                WarehouseName = gr.Warehouse.WarehouseName,
                TotalQuantityReceived = gr.Items.Sum(i => i.ReceivedNowQuantity),
                ReceiptDate = gr.ReceiptDate
            })
            .ToListAsync();

        return Ok(dto);
    }
}
