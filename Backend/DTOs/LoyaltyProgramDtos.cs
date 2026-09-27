using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class LoyaltyProgramDto
{
    public int LoyaltyProgramId { get; set; }
    public string ProgramCode { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string PointsName { get; set; } = string.Empty;
    public decimal EarningAmount { get; set; }
    public int EarningPoints { get; set; }
    public int MinimumRedemptionPoints { get; set; }
    public int CreatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateLoyaltyProgramDto
{
    [Required]
    [MaxLength(200)]
    public string ProgramName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string PointsName { get; set; } = "Points";

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Earning Amount must be greater than 0.")]
    public decimal EarningAmount { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Earning Points must be greater than 0.")]
    public int EarningPoints { get; set; }

    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "Minimum Redemption Points must be 0 or greater.")]
    public int MinimumRedemptionPoints { get; set; }
}

public class UpdateLoyaltyProgramDto
{
    [Required]
    [MaxLength(200)]
    public string ProgramName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string PointsName { get; set; } = "Points";

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Earning Amount must be greater than 0.")]
    public decimal EarningAmount { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Earning Points must be greater than 0.")]
    public int EarningPoints { get; set; }

    [Required]
    [Range(0, int.MaxValue, ErrorMessage = "Minimum Redemption Points must be 0 or greater.")]
    public int MinimumRedemptionPoints { get; set; }
}

public class LoyaltyProgramKpiDto
{
    public int Total { get; set; }
    public int Active { get; set; }
    public int Draft { get; set; }
    public int Inactive { get; set; }
}
