using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class StockAdjustment
{
    [Key]
    public int AdjustmentId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string AdjustmentNumber { get; set; } = string.Empty;
    
    [Required]
    public int ProductId { get; set; }
    
    [Required]
    public int WarehouseId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string AdjustmentType { get; set; } = string.Empty; // "Increase" or "Decrease"
    
    public int Quantity { get; set; }
    
    [Required]
    [MaxLength(2000)]
    public string Reason { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Completed";
    
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
