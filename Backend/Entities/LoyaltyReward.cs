using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class LoyaltyReward
{
    [Key]
    public int RewardId { get; set; }

    [Required]
    public int LoyaltyProgramId { get; set; }

    [ForeignKey("LoyaltyProgramId")]
    public LoyaltyProgram LoyaltyProgram { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string RewardCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string RewardName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string RewardType { get; set; } = "Discount";

    [Required]
    public int PointsCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? RewardValue { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

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
