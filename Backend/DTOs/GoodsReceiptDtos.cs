using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Backend.Entities;

namespace Backend.DTOs;

public class GoodsReceiptListDto
{
    public int ReceiptId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public string PONumber { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string WarehouseCode { get; set; } = string.Empty;
    public DateTime ReceiptDate { get; set; }
    public string ReceivedByName { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class GoodsReceiptDetailDto
{
    public int ReceiptId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public int PurchaseOrderId { get; set; }
    public string PONumber { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string WarehouseCode { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public DateTime ReceiptDate { get; set; }
    public string ReceivedByName { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public List<GoodsReceiptItemDto> Items { get; set; } = new();
    public List<SystemActivityDto> RecentActivities { get; set; } = new();
    public List<InventoryTransactionDto> InventoryTransactions { get; set; } = new();
}

public class GoodsReceiptItemDto
{
    public int ReceiptItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int OrderedQuantity { get; set; }
    public int PreviouslyReceivedQuantity { get; set; }
    public int ReceivedNowQuantity { get; set; }
    public int RemainingQuantity { get; set; }
    public int TotalReceived => PreviouslyReceivedQuantity + ReceivedNowQuantity;
}

public class CreateGoodsReceiptDto
{
    [Required]
    public int PurchaseOrderId { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "At least one item must be received.")]
    public List<CreateGoodsReceiptItemDto> Items { get; set; } = new();
}

public class CreateGoodsReceiptItemDto
{
    [Required]
    public int PurchaseOrderItemId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Received quantity must be greater than 0.")]
    public int ReceivedNowQuantity { get; set; }
}

public class EligiblePurchaseOrderDto
{
    public int PurchaseOrderId { get; set; }
    public string PONumber { get; set; } = string.Empty;
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseCode { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string Status { get; set; } = string.Empty;

    public List<EligiblePurchaseOrderItemDto> Items { get; set; } = new();
}

public class EligiblePurchaseOrderItemDto
{
    public int PurchaseOrderItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int OrderedQuantity { get; set; }
    public int PreviouslyReceivedQuantity { get; set; }
    public int RemainingQuantity { get; set; }
}
