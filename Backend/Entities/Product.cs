namespace Backend.Entities;

public enum ProductStatus
{
    Active,
    Inactive,
    Discontinued
}

public class Product
{
    public int ProductId { get; set; }
    public string ProductCode { get; set; } = null!;
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    
    public int CategoryId { get; set; }
    public ProductCategory Category { get; set; } = null!;

    public string Brand { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string UnitOfMeasure { get; set; } = string.Empty;
    
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public int ReorderLevel { get; set; }
    public string? ImageUrl { get; set; }
    
    public ProductStatus Status { get; set; } = ProductStatus.Active;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
