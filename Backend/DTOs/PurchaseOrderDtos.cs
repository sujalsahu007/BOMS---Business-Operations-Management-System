using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class UpdatePurchaseOrderDto
{
    [Required]
    public int SupplierId { get; set; }
    
    [Required]
    public int WarehouseId { get; set; }
    
    [Required]
    public DateTime ExpectedDeliveryDate { get; set; }
    
    [MaxLength(1000)]
    public string? Remarks { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "Purchase order must have at least one item.")]
    public List<CreatePurchaseOrderItemDto> Items { get; set; } = new();
}

public class PurchaseOrderDto
{
    public int PurchaseOrderId { get; set; }
    public string PONumber { get; set; } = string.Empty;
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string SupplierCode { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseCode { get; set; } = string.Empty;
    
    public DateTime OrderDate { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string? Remarks { get; set; }
    
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal GrandTotal { get; set; }
    
    public string Status { get; set; } = string.Empty;
    public string ApprovalStatus { get; set; } = string.Empty;
    
    public int CreatedBy { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<PurchaseOrderItemDto> Items { get; set; } = new();
    public List<POApprovalDto> Approvals { get; set; } = new();
}

public class PurchaseOrderListDto
{
    public int PurchaseOrderId { get; set; }
    public string PONumber { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string WarehouseCode { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public decimal GrandTotal { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ApprovalStatus { get; set; } = string.Empty;
    public string CreatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class PurchaseOrderItemDto
{
    public int POItemId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal LineTotal { get; set; }
    
    public int ReceivedQuantity { get; set; }
}

public class POApprovalDto
{
    public int ApprovalId { get; set; }
    public int ApproverId { get; set; }
    public string ApproverName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public DateTime Timestamp { get; set; }
}

public class POApprovalRequestDto
{
    [Required]
    public string Action { get; set; } = string.Empty; // Approve, Reject
    
    [MaxLength(1000)]
    public string? Comment { get; set; }
}
