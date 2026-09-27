using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class LoyaltyPromotion
{
    [Key]
    public int PromotionId { get; set; }

    [Required]
    public int LoyaltyProgramId { get; set; }

    [ForeignKey("LoyaltyProgramId")]
    public LoyaltyProgram LoyaltyProgram { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string PromotionCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string PromotionName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string PromotionType { get; set; } = "Bonus Points"; // Bonus Points, Points Multiplier

    public int? BonusPoints { get; set; }
    
    [Column(TypeName = "decimal(5,2)")]
    public decimal? PointsMultiplier { get; set; }

    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft"; // Draft, Active, Inactive

    [Required]
    public int CreatedById { get; set; }

    [ForeignKey("CreatedById")]
    public User User { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
