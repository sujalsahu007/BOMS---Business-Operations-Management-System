using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class CreatePurchaseOrderDto
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

public class CreatePurchaseOrderItemDto
{
    [Required]
    public int ProductId { get; set; }
    
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0.")]
    public int Quantity { get; set; }
    
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Unit price must be zero or greater.")]
    public decimal UnitPrice { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Tax must be zero or greater.")]
    public decimal Tax { get; set; } = 0;
    
    [Range(0, double.MaxValue, ErrorMessage = "Discount must be zero or greater.")]
    public decimal Discount { get; set; } = 0;
}
