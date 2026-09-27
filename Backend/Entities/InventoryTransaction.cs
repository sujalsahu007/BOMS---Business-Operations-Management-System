using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public enum TransactionType
{
    InitialStock = 0,
    StockIn = 1,
    StockOut = 2,
    AdjustmentIncrease = 3,
    AdjustmentDecrease = 4,
    TransferIn = 5,
    TransferOut = 6,
    Reversal = 7
}

public class InventoryTransaction
{
    [Key]
    public int TransactionId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string TransactionCode { get; set; } = null!; // e.g. TXN-0001
    
    [Required]
    public int ProductId { get; set; }
    
    [Required]
    public int WarehouseId { get; set; }
    
    public TransactionType TransactionType { get; set; }
    
    public int Quantity { get; set; }
    
    public int PreviousQuantity { get; set; }
    
    public int NewQuantity { get; set; }
    
    [MaxLength(100)]
    public string ReferenceType { get; set; } = string.Empty; // e.g. "Initialization", "PurchaseOrder"
    
    public int? ReferenceId { get; set; }
    
    [MaxLength(2000)]
    public string Reason { get; set; } = string.Empty;
    
    public int CreatedBy { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    // Navigation Properties
    [ForeignKey("ProductId")]
    public Product Product { get; set; } = null!;
    
    [ForeignKey("WarehouseId")]
    public Warehouse Warehouse { get; set; } = null!;
    
    [ForeignKey("CreatedBy")]
    public User Creator { get; set; } = null!;
}
