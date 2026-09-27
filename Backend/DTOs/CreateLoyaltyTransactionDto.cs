using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class CreateLoyaltyTransactionDto
{
    [Required]
    public int MembershipId { get; set; }

    [Required]
    [MaxLength(50)]
    public string TransactionType { get; set; } = null!; // Earned, Redeemed, Adjustment, Expired

    [Required]
    public decimal Points { get; set; }

    [MaxLength(100)]
    public string? Reference { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }
}
