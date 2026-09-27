using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public enum ProductCategoryStatus
{
    Active,
    Inactive
}

public class ProductCategory
{
    public int CategoryId { get; set; }
    [Required]
    [MaxLength(50)]
    public string CategoryCode { get; set; } = null!;
    public string CategoryName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProductCategoryStatus Status { get; set; } = ProductCategoryStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
