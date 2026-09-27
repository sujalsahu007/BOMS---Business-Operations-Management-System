using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class PurchaseOrder
{
    [Key]
    public int PurchaseOrderId { get; set; }

    [Required]
    [MaxLength(50)]
    public string PONumber { get; set; } = null!;

    [Required]
    public int SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;

    [Required]
    public int WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;

    [Required]
    public DateTime OrderDate { get; set; }

    public DateTime? ExpectedDeliveryDate { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Tax { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Discount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal GrandTotal { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft"; // Draft, Submitted, Approved, Rejected, Ordered, PartiallyReceived, FullyReceived, Cancelled

    [Required]
    [MaxLength(50)]
    public string ApprovalStatus { get; set; } = "Pending"; // Pending, Approved, Rejected

    [Required]
    public int CreatedBy { get; set; }
    public User Creator { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
    public ICollection<POApproval> Approvals { get; set; } = new List<POApproval>();
}
