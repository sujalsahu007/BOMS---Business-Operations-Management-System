using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class LoyaltyTransaction
{
    [Key]
    public int TransactionId { get; set; }

    [Required]
    public int MembershipId { get; set; }

    [ForeignKey("MembershipId")]
    public LoyaltyMembership LoyaltyMembership { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string TransactionType { get; set; } = null!; // Earned, Redeemed, Adjustment, Expired

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Points { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceAfter { get; set; }

    [MaxLength(100)]
    public string? Reference { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

    public int? CreatedById { get; set; }

    [ForeignKey("CreatedById")]
    public User? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
