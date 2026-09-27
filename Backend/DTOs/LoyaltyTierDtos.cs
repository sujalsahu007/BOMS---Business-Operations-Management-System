using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class LoyaltyTierDto
{
    public int TierId { get; set; }
    public int LoyaltyProgramId { get; set; }
    public string ProgramName { get; set; } = string.Empty; // Added for UI display
    public string TierCode { get; set; } = string.Empty;
    public string TierName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string QualificationType { get; set; } = string.Empty;
    public decimal QualificationThreshold { get; set; }
    public int DisplayOrder { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public int BenefitCount { get; set; } // Added for KPI/Table display
}

public class LoyaltyBenefitDto
{
    public int BenefitId { get; set; }
    public int TierId { get; set; }
    public string BenefitName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string BenefitType { get; set; } = string.Empty;
    public decimal? BenefitValue { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateLoyaltyTierDto
{
    [Required]
    public int LoyaltyProgramId { get; set; }

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
    public string QualificationType { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Qualification threshold must be greater than 0.")]
    public decimal QualificationThreshold { get; set; }

    [Required]
    public int DisplayOrder { get; set; }
}

public class UpdateLoyaltyTierDto
{
    [Required]
    [MaxLength(100)]
    public string TierName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string QualificationType { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Qualification threshold must be greater than 0.")]
    public decimal QualificationThreshold { get; set; }

    [Required]
    public int DisplayOrder { get; set; }
}

public class CreateLoyaltyBenefitDto
{
    [Required]
    [MaxLength(200)]
    public string BenefitName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string BenefitType { get; set; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "Benefit value cannot be negative.")]
    public decimal? BenefitValue { get; set; }
}

public class UpdateLoyaltyBenefitDto
{
    [Required]
    [MaxLength(200)]
    public string BenefitName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string BenefitType { get; set; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "Benefit value cannot be negative.")]
    public decimal? BenefitValue { get; set; }
}

public class TierFilterDto
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public int? LoyaltyProgramId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class LoyaltyTierKpiDto
{
    public int TotalTiers { get; set; }
    public int ActiveTiers { get; set; }
    public int TotalBenefits { get; set; }
    public int ProgramsWithTiers { get; set; }
}
