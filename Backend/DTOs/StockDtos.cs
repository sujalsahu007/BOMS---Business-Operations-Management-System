using System.ComponentModel.DataAnnotations;
using Backend.Entities;

namespace Backend.DTOs;

public class WarehouseStockDto
{
    public int WarehouseStockId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int AvailableQuantity { get; set; }
    public int ReservedQuantity { get; set; }
    public int ReorderLevel { get; set; }
    public string StockStatus { get; set; } = string.Empty; // Calculated: Out of Stock, Low Stock, In Stock
    public DateTime LastUpdated { get; set; }
    public string RowVersion { get; set; } = string.Empty; // Base64 string for concurrency
}

public class InitializeStockDto
{
    [Required]
    public int WarehouseId { get; set; }
    
    [Required]
    public int ProductId { get; set; }
    
    [Required]
    [Range(0, int.MaxValue)]
    public int InitialQuantity { get; set; }
    
    [Required]
    [MaxLength(2000)]
    public string Reason { get; set; } = string.Empty;
}

public class InventoryTransactionDto
{
    public int TransactionId { get; set; }
    public string TransactionCode { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }
    public string ReferenceType { get; set; } = string.Empty;
    public int? ReferenceId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int CreatedBy { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class StockOverviewQueryDto
{
    public int? ProductId { get; set; }
    public int? WarehouseId { get; set; }
    public string? StockStatus { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class TransferStockDto
{
    [Required]
    public int ProductId { get; set; }
    [Required]
    public int SourceWarehouseId { get; set; }
    [Required]
    public int DestinationWarehouseId { get; set; }
    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
    [MaxLength(2000)]
    public string Remarks { get; set; } = string.Empty;
}

public class AdjustStockDto
{
    [Required]
    public int ProductId { get; set; }
    [Required]
    public int WarehouseId { get; set; }
    [Required]
    [MaxLength(50)]
    public string AdjustmentType { get; set; } = string.Empty; // "Increase" or "Decrease"
    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
    [Required]
    [MaxLength(2000)]
    public string Reason { get; set; } = string.Empty;
}

public class StockTransferDto
{
    public int TransferId { get; set; }
    public string TransferNumber { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int SourceWarehouseId { get; set; }
    public string SourceWarehouseName { get; set; } = string.Empty;
    public int DestinationWarehouseId { get; set; }
    public string DestinationWarehouseName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int CreatedBy { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class StockAdjustmentDto
{
    public int AdjustmentId { get; set; }
    public string AdjustmentNumber { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public string AdjustmentType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int CreatedBy { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
