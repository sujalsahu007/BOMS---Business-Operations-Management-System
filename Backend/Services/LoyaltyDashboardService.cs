using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Services;

public interface ILoyaltyDashboardService
{
    Task<LoyaltyDashboardSummaryDto> GetDashboardSummaryAsync();
}

public class LoyaltyDashboardService : ILoyaltyDashboardService
{
    private readonly ApplicationDbContext _context;

    public LoyaltyDashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<LoyaltyDashboardSummaryDto> GetDashboardSummaryAsync()
    {
        var summary = new LoyaltyDashboardSummaryDto();

        // 1. KPIs
        summary.Kpis.ActivePrograms = await _context.LoyaltyPrograms.CountAsync(p => p.Status == "Active");
        summary.Kpis.ActiveMembers = await _context.LoyaltyMemberships.CountAsync(m => m.Status == "Active");
        
        var earnedQuery = _context.LoyaltyTransactions.Where(t => t.TransactionType == "Earned");
        var redeemedQuery = _context.LoyaltyTransactions.Where(t => t.TransactionType == "Redeemed");
        
        summary.Kpis.PointsEarnedAllTime = await earnedQuery.SumAsync(t => (decimal?)t.Points) ?? 0;
        summary.Kpis.PointsRedeemedAllTime = await redeemedQuery.SumAsync(t => (decimal?)t.Points) ?? 0;

        // 2. Membership Overview
        summary.MembershipOverview.ActiveMembers = summary.Kpis.ActiveMembers;
        summary.MembershipOverview.InactiveMembers = await _context.LoyaltyMemberships.CountAsync(m => m.Status == "Inactive" || m.Status == "Suspended");

        // 3. Program Performance (Top 5 Active Programs by member count)
        var topPrograms = await _context.LoyaltyPrograms
            .Where(p => p.Status == "Active")
            .Select(p => new
            {
                p.LoyaltyProgramId,
                p.ProgramName,
                MembersCount = _context.LoyaltyMemberships.Count(m => m.LoyaltyProgramId == p.LoyaltyProgramId && m.Status == "Active"),
                PointsEarned = _context.LoyaltyTransactions
                                    .Where(t => _context.LoyaltyMemberships.Any(m => m.MembershipId == t.MembershipId && m.LoyaltyProgramId == p.LoyaltyProgramId) && t.TransactionType == "Earned")
                                    .Sum(t => (decimal?)t.Points) ?? 0,
                PointsRedeemed = _context.LoyaltyTransactions
                                    .Where(t => _context.LoyaltyMemberships.Any(m => m.MembershipId == t.MembershipId && m.LoyaltyProgramId == p.LoyaltyProgramId) && t.TransactionType == "Redeemed")
                                    .Sum(t => (decimal?)t.Points) ?? 0
            })
            .OrderByDescending(p => p.MembersCount)
            .Take(5)
            .ToListAsync();

        summary.ProgramPerformance = topPrograms.Select(p => new LoyaltyProgramPerformanceDto
        {
            ProgramId = p.LoyaltyProgramId,
            ProgramName = p.ProgramName,
            MembersCount = p.MembersCount,
            PointsEarned = p.PointsEarned,
            PointsRedeemed = p.PointsRedeemed
        }).ToList();

        // 4. Points Activity (Last 30 Days)
        var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-29); // include today
        var recentTransactions = await _context.LoyaltyTransactions
            .Where(t => t.TransactionDate >= thirtyDaysAgo && (t.TransactionType == "Earned" || t.TransactionType == "Redeemed"))
            .Select(t => new { t.TransactionDate, t.TransactionType, t.Points })
            .ToListAsync();

        // Group by day in memory since EF might not translate Date grouping well for all DBs
        var activityDict = new Dictionary<DateTime, LoyaltyPointsActivityDto>();
        for (int i = 0; i < 30; i++)
        {
            var date = thirtyDaysAgo.AddDays(i);
            activityDict[date] = new LoyaltyPointsActivityDto 
            { 
                Date = date, 
                DateLabel = date.ToString("MMM dd"), 
                Earned = 0, 
                Redeemed = 0 
            };
        }

        foreach (var t in recentTransactions)
        {
            var date = t.TransactionDate.Date;
            if (activityDict.ContainsKey(date))
            {
                if (t.TransactionType == "Earned")
                    activityDict[date].Earned += t.Points;
                else
                    activityDict[date].Redeemed += t.Points;
            }
        }
        
        summary.PointsActivity = activityDict.Values.OrderBy(x => x.Date).ToList();

        // 5. Tier Distribution
        var tierDist = await _context.LoyaltyTiers
            .Where(t => t.Status == "Active")
            .Select(t => new LoyaltyTierDistributionDto
            {
                TierName = t.TierName,
                Count = _context.LoyaltyMemberships.Count(m => m.Status == "Active" && m.TierId == t.TierId)
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();
            
        summary.TierDistribution = tierDist;

        // 6. Recent Activity
        var recent = await _context.LoyaltyTransactions
            .Include(t => t.LoyaltyMembership)
                .ThenInclude(m => m.ContractParty)
            .Include(t => t.LoyaltyMembership)
                .ThenInclude(m => m.LoyaltyProgram)
            .Include(t => t.CreatedBy)
            .OrderByDescending(t => t.TransactionDate)
            .Take(10)
            .ToListAsync();

        summary.RecentActivity = recent.Select(t => new LoyaltyTransactionDto
        {
            TransactionId = t.TransactionId,
            MembershipId = t.MembershipId,
            CustomerName = t.LoyaltyMembership.ContractParty.PartyName,
            CustomerCode = t.LoyaltyMembership.ContractParty.PartyCode,
            ProgramName = t.LoyaltyMembership.LoyaltyProgram.ProgramName,
            TransactionType = t.TransactionType,
            Points = t.Points,
            BalanceAfter = t.BalanceAfter,
            Reference = t.Reference,
            Description = t.Description,
            TransactionDate = t.TransactionDate,
            CreatedByName = t.CreatedBy != null ? (string.IsNullOrWhiteSpace(t.CreatedBy.FirstName) ? t.CreatedBy.Username : (t.CreatedBy.FirstName + " " + t.CreatedBy.LastName).Trim()) : "System",
            CreatedAt = t.CreatedAt
        }).ToList();

        return summary;
    }
}
