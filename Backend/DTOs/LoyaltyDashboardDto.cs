namespace Backend.DTOs;

public class LoyaltyDashboardSummaryDto
{
    public LoyaltyDashboardKpisDto Kpis { get; set; } = new();
    public LoyaltyMembershipOverviewDto MembershipOverview { get; set; } = new();
    public List<LoyaltyProgramPerformanceDto> ProgramPerformance { get; set; } = new();
    public List<LoyaltyPointsActivityDto> PointsActivity { get; set; } = new();
    public List<LoyaltyTierDistributionDto> TierDistribution { get; set; } = new();
    public List<LoyaltyTransactionDto> RecentActivity { get; set; } = new();
}

public class LoyaltyDashboardKpisDto
{
    public int ActivePrograms { get; set; }
    public int ActiveMembers { get; set; }
    public decimal PointsEarnedAllTime { get; set; }
    public decimal PointsRedeemedAllTime { get; set; }
}

public class LoyaltyMembershipOverviewDto
{
    public int ActiveMembers { get; set; }
    public int InactiveMembers { get; set; }
}

public class LoyaltyProgramPerformanceDto
{
    public int ProgramId { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public int MembersCount { get; set; }
    public decimal PointsEarned { get; set; }
    public decimal PointsRedeemed { get; set; }
}

public class LoyaltyPointsActivityDto
{
    public string DateLabel { get; set; } = string.Empty; // Format: "MMM dd"
    public DateTime Date { get; set; }
    public decimal Earned { get; set; }
    public decimal Redeemed { get; set; }
}

public class LoyaltyTierDistributionDto
{
    public string TierName { get; set; } = string.Empty;
    public int Count { get; set; }
}
