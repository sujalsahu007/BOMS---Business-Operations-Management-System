using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class GoodsReceipt
{
    [Key]
    public int ReceiptId { get; set; }

    [Required]
    [MaxLength(50)]
    public string ReceiptNumber { get; set; } = null!;

    [Required]
    public int PurchaseOrderId { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;

    [Required]
    public int WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;

    [Required]
    public DateTime ReceiptDate { get; set; }

    [Required]
    public int ReceivedBy { get; set; }
    public User Receiver { get; set; } = null!;

    [MaxLength(1000)]
    public string? Remarks { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Completed";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<GoodsReceiptItem> Items { get; set; } = new List<GoodsReceiptItem>();
}
