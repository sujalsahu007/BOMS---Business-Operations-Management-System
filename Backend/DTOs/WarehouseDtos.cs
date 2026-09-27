using System.ComponentModel.DataAnnotations;
using Backend.Entities;

namespace Backend.DTOs;

public class WarehouseDto
{
    public int WarehouseId { get; set; }
    public string WarehouseCode { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int? ManagerUserId { get; set; }
    public string ManagerName { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int ProductsCount { get; set; }
    public int TotalAvailableUnits { get; set; }
}

public class CreateWarehouseDto
{
    [Required]
    [MaxLength(255)]
    public string WarehouseName { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Location { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string Address { get; set; } = string.Empty;
    
    public int? ManagerUserId { get; set; }
    
    [Range(0, int.MaxValue)]
    public int Capacity { get; set; }
    
    [Required]
    public string Status { get; set; } = "Active";
}

public class UpdateWarehouseDto
{
    [Required]
    [MaxLength(255)]
    public string WarehouseName { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Location { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string Address { get; set; } = string.Empty;
    
    public int? ManagerUserId { get; set; }
    
    [Range(0, int.MaxValue)]
    public int Capacity { get; set; }
    
    [Required]
    public string Status { get; set; } = "Active";
}

public class WarehouseDetailDto : WarehouseDto
{
    public List<WarehouseStockDto> Stock { get; set; } = new();
}
