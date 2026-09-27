using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class CreateLoyaltyRewardDto
{
    [Required]
    public int LoyaltyProgramId { get; set; }

    [Required]
    [MaxLength(200)]
    public string RewardName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string RewardType { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "PointsCost must be greater than 0.")]
    public int PointsCost { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "RewardValue cannot be negative.")]
    public decimal? RewardValue { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class UpdateLoyaltyRewardDto
{
    [Required]
    [MaxLength(200)]
    public string RewardName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string RewardType { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "PointsCost must be greater than 0.")]
    public int PointsCost { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "RewardValue cannot be negative.")]
    public decimal? RewardValue { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class RewardFilterDto
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public int? LoyaltyProgramId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class CreateLoyaltyPromotionDto
{
    [Required]
    public int LoyaltyProgramId { get; set; }

    [Required]
    [MaxLength(200)]
    public string PromotionName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string PromotionType { get; set; } = string.Empty;

    public int? BonusPoints { get; set; }
    
    public decimal? PointsMultiplier { get; set; }

    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
}

public class UpdateLoyaltyPromotionDto
{
    [Required]
    [MaxLength(200)]
    public string PromotionName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string PromotionType { get; set; } = string.Empty;

    public int? BonusPoints { get; set; }
    
    public decimal? PointsMultiplier { get; set; }

    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
}

public class PromotionFilterDto
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public int? LoyaltyProgramId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
