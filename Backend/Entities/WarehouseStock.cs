using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class WarehouseStock
{
    [Key]
    public int WarehouseStockId { get; set; }
    
    [Required]
    public int ProductId { get; set; }
    
    [Required]
    public int WarehouseId { get; set; }
    
    public int AvailableQuantity { get; set; }
    public int ReservedQuantity { get; set; }
    
    public int ReorderLevel { get; set; }
    
    public DateTime LastUpdated { get; set; }
    
    [Timestamp]
    public byte[] RowVersion { get; set; } = null!;
    
    // Navigation properties
    [ForeignKey("ProductId")]
    public Product Product { get; set; } = null!;
    
    [ForeignKey("WarehouseId")]
    public Warehouse Warehouse { get; set; } = null!;
}
