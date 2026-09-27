using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Entities;

public class ContractObligation
{
    [Key]
    public int ObligationId { get; set; }
    
    [Required]
    public int ContractId { get; set; }
    public Contract Contract { get; set; } = null!;
    
    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Description { get; set; }
    
    [Required]
    public DateTime DueDate { get; set; }
    
    [Required]
    public int OwnerId { get; set; }
    public User Owner { get; set; } = null!;
    
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Pending"; // Pending, In Progress, Completed, Overdue, Cancelled
    
    [Required]
    [MaxLength(50)]
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
