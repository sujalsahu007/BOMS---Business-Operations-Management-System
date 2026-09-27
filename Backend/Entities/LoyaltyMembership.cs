using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class LoyaltyMembership
{
    [Key]
    public int MembershipId { get; set; }

    [Required]
    public int PartyId { get; set; }

    [ForeignKey("PartyId")]
    public ContractParty ContractParty { get; set; } = null!;

    [Required]
    public int LoyaltyProgramId { get; set; }

    [ForeignKey("LoyaltyProgramId")]
    public LoyaltyProgram LoyaltyProgram { get; set; } = null!;

    public int? TierId { get; set; }

    [ForeignKey("TierId")]
    public LoyaltyTier? LoyaltyTier { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PointsBalance { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal LifetimePoints { get; set; } = 0;

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Active"; // Active, Inactive

    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
