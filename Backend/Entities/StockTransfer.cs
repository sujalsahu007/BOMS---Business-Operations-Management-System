using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class StockTransfer
{
    [Key]
    public int TransferId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string TransferNumber { get; set; } = string.Empty;
    
    [Required]
    public int ProductId { get; set; }
    
    [Required]
    public int SourceWarehouseId { get; set; }
    
    [Required]
    public int DestinationWarehouseId { get; set; }
    
    public int Quantity { get; set; }
    
    [MaxLength(2000)]
    public string Remarks { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Completed";
    
    public int CreatedBy { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    // Navigation Properties
    [ForeignKey("ProductId")]
    public Product Product { get; set; } = null!;
    
    [ForeignKey("SourceWarehouseId")]
    public Warehouse SourceWarehouse { get; set; } = null!;
    
    [ForeignKey("DestinationWarehouseId")]
    public Warehouse DestinationWarehouse { get; set; } = null!;
    
    [ForeignKey("CreatedBy")]
    public User Creator { get; set; } = null!;
}
