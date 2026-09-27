using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public enum WarehouseStatus
{
    Active = 0,
    Inactive = 1
}

public class Warehouse
{
    [Key]
    public int WarehouseId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string WarehouseCode { get; set; } = null!;
    
    [Required]
    [MaxLength(255)]
    public string WarehouseName { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Location { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string Address { get; set; } = string.Empty;
    
    public int? ManagerUserId { get; set; }
    
    public int Capacity { get; set; }
    
    public WarehouseStatus Status { get; set; } = WarehouseStatus.Active;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation Properties
    [ForeignKey("ManagerUserId")]
    public User? Manager { get; set; }
    
    public ICollection<WarehouseStock> Stocks { get; set; } = new List<WarehouseStock>();
}
