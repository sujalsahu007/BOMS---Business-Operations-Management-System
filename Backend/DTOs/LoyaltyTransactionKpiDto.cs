namespace Backend.DTOs;

public class LoyaltyTransactionKpiDto
{
    public int TotalTransactions { get; set; }
    public decimal PointsEarned { get; set; }
    public decimal PointsRedeemed { get; set; }
    public decimal TotalAdjustments { get; set; }
}
