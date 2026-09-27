using System;

namespace Backend.DTOs;

public class LoyaltyTransactionDto
{
    public int TransactionId { get; set; }
    public int MembershipId { get; set; }
    public string CustomerName { get; set; } = null!;
    public string CustomerCode { get; set; } = null!;
    public string ProgramName { get; set; } = null!;
    public string TransactionType { get; set; } = null!;
    public decimal Points { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? Reference { get; set; }
    public string? Description { get; set; }
    public DateTime TransactionDate { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
}
