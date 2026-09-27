using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class LoyaltyTier
{
    [Key]
    public int TierId { get; set; }

    [Required]
    public int LoyaltyProgramId { get; set; }

    [ForeignKey("LoyaltyProgramId")]
    public LoyaltyProgram LoyaltyProgram { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string TierCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string TierName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string QualificationType { get; set; } = string.Empty; // e.g. "Points", "Spend"

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal QualificationThreshold { get; set; }

    [Required]
    public int DisplayOrder { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft"; // Draft, Active, Inactive

    [Required]
    public int CreatedById { get; set; }

    [ForeignKey("CreatedById")]
    public User User { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property for Benefits
    public ICollection<LoyaltyBenefit> Benefits { get; set; } = new List<LoyaltyBenefit>();
}
