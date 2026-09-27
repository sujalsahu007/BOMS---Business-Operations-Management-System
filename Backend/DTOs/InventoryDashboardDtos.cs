namespace Backend.DTOs;

// Single aggregated response for GET /api/inventory/dashboard
public class InventoryDashboardDto
{
    // KPI counts
    public int TotalProducts { get; set; }
    public int TotalWarehouses { get; set; }
    public int TotalStockQuantity { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public int PendingPurchaseOrders { get; set; }
    public int PendingGoodsReceipts { get; set; }

    // Stock overview
    public int InStockItems { get; set; }

    // Low stock items
    public List<DashboardStockAlertDto> LowStockItems { get; set; } = new();

    // Out of stock items
    public List<DashboardStockAlertDto> OutOfStockItems { get; set; } = new();

    // Recent transactions
    public List<DashboardTransactionDto> RecentTransactions { get; set; } = new();

    // PO status breakdown
    public List<DashboardStatusCountDto> PurchaseOrderSummary { get; set; } = new();

    // Recent goods receipts
    public List<DashboardGoodsReceiptDto> RecentGoodsReceipts { get; set; } = new();
}

public class DashboardStockAlertDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public int AvailableQuantity { get; set; }
    public int ReorderLevel { get; set; }
}

public class DashboardTransactionDto
{
    public string TransactionCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DashboardStatusCountDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class DashboardGoodsReceiptDto
{
    public string ReceiptNumber { get; set; } = string.Empty;
    public string PONumber { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public int TotalQuantityReceived { get; set; }
    public DateTime ReceiptDate { get; set; }
}
