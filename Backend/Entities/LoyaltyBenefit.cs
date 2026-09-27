using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class LoyaltyBenefit
{
    [Key]
    public int BenefitId { get; set; }

    [Required]
    public int TierId { get; set; }

    [ForeignKey("TierId")]
    public LoyaltyTier Tier { get; set; } = null!;

    [Required]
    [MaxLength(200)]
    public string BenefitName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string BenefitType { get; set; } = string.Empty; // e.g. "Discount", "Bonus Points", "Cashback"

    [Column(TypeName = "decimal(18,2)")]
    public decimal? BenefitValue { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Active"; // Active, Inactive

    [Required]
    public int CreatedById { get; set; }

    [ForeignKey("CreatedById")]
    public User User { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
