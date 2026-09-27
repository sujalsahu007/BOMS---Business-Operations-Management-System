using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Entities;

public class LoyaltyProgram
{
    [Key]
    public int LoyaltyProgramId { get; set; }

    [Required]
    [MaxLength(50)]
    public string ProgramCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string ProgramName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft"; // Draft, Active, Inactive

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string PointsName { get; set; } = "Points";

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal EarningAmount { get; set; }

    [Required]
    public int EarningPoints { get; set; }

    [Required]
    public int MinimumRedemptionPoints { get; set; }

    [Required]
    public int CreatedById { get; set; }
    
    [ForeignKey("CreatedById")]
    public User User { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property for Tiers
    [JsonIgnore]
    public ICollection<LoyaltyTier> Tiers { get; set; } = new List<LoyaltyTier>();
    
    // Navigation property for Rewards and Promotions
    [JsonIgnore]
    public ICollection<LoyaltyReward> Rewards { get; set; } = new List<LoyaltyReward>();
    
    [JsonIgnore]
    public ICollection<LoyaltyPromotion> Promotions { get; set; } = new List<LoyaltyPromotion>();
}
