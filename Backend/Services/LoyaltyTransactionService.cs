using System;
using System.Linq;
using System.Threading.Tasks;
using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class LoyaltyTransactionService : ILoyaltyTransactionService
{
    private readonly ApplicationDbContext _context;

    public LoyaltyTransactionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<LoyaltyTransactionDto>> GetTransactionsAsync(int page, int pageSize, string search, int? programId, string transactionType, string dateFilter)
    {
        var query = _context.LoyaltyTransactions
            .Include(t => t.LoyaltyMembership)
                .ThenInclude(m => m.ContractParty)
            .Include(t => t.LoyaltyMembership)
                .ThenInclude(m => m.LoyaltyProgram)
            .Include(t => t.CreatedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(t => 
                t.LoyaltyMembership.ContractParty.PartyName.ToLower().Contains(search) || 
                t.LoyaltyMembership.ContractParty.PartyCode.ToLower().Contains(search) ||
                (t.Reference != null && t.Reference.ToLower().Contains(search)));
        }

        if (programId.HasValue)
        {
            query = query.Where(t => t.LoyaltyMembership.LoyaltyProgramId == programId.Value);
        }

        if (!string.IsNullOrWhiteSpace(transactionType) && transactionType != "All")
        {
            query = query.Where(t => t.TransactionType == transactionType);
        }

        if (!string.IsNullOrWhiteSpace(dateFilter) && dateFilter != "All")
        {
            var now = DateTime.UtcNow;
            if (dateFilter == "Today")
                query = query.Where(t => t.TransactionDate.Date == now.Date);
            else if (dateFilter == "Last 7 Days")
                query = query.Where(t => t.TransactionDate >= now.AddDays(-7));
            else if (dateFilter == "This Month")
                query = query.Where(t => t.TransactionDate.Month == now.Month && t.TransactionDate.Year == now.Year);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new LoyaltyTransactionDto
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
            })
            .ToListAsync();

        return new PaginatedResult<LoyaltyTransactionDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<LoyaltyTransactionDto> GetTransactionByIdAsync(int id)
    {
        var t = await _context.LoyaltyTransactions
            .Include(x => x.LoyaltyMembership)
                .ThenInclude(m => m.ContractParty)
            .Include(x => x.LoyaltyMembership)
                .ThenInclude(m => m.LoyaltyProgram)
            .Include(x => x.CreatedBy)
            .FirstOrDefaultAsync(x => x.TransactionId == id);

        if (t == null)
            throw new Exception("Transaction not found.");

        return new LoyaltyTransactionDto
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
        };
    }

    public async Task<LoyaltyTransactionDto> CreateTransactionAsync(CreateLoyaltyTransactionDto dto, int userId)
    {
        var membership = await _context.LoyaltyMemberships
            .Include(m => m.ContractParty)
            .Include(m => m.LoyaltyProgram)
            .FirstOrDefaultAsync(m => m.MembershipId == dto.MembershipId);

        if (membership == null)
            throw new Exception("Loyalty membership not found.");

        if (membership.Status != "Active")
            throw new Exception("Cannot process transaction for an inactive membership.");

        if (dto.Points == 0)
            throw new Exception("Points amount cannot be zero.");

        if ((dto.TransactionType == "Earned" || dto.TransactionType == "Redeemed") && dto.Points < 0)
            throw new Exception("Points must be positive for Earned or Redeemed transactions.");

        decimal pointsChange = 0;
        
        switch (dto.TransactionType)
        {
            case "Earned":
                pointsChange = dto.Points;
                membership.LifetimePoints += dto.Points;
                break;
            case "Adjustment":
                pointsChange = dto.Points;
                break;
            case "Redeemed":
                pointsChange = -dto.Points;
                break;
            default:
                throw new Exception("Invalid transaction type.");
        }

        if (membership.PointsBalance + pointsChange < 0)
            throw new Exception("Insufficient points balance.");

        membership.PointsBalance += pointsChange;
        membership.UpdatedAt = DateTime.UtcNow;

        var transaction = new LoyaltyTransaction
        {
            MembershipId = dto.MembershipId,
            TransactionType = dto.TransactionType,
            Points = dto.Points, // Store absolute value
            BalanceAfter = membership.PointsBalance,
            Reference = dto.Reference,
            Description = dto.Description,
            TransactionDate = DateTime.UtcNow,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.LoyaltyTransactions.Add(transaction);

        // Audit log
        _context.AuditLogs.Add(new AuditLog
        {
            Action = "LoyaltyTransactionCreated",
            Module = "CustomerLoyalty",
            EntityType = "LoyaltyTransaction",
            EntityId = "", // Set below or let it be empty since it's pre-save
            UserId = userId,
            Timestamp = DateTime.UtcNow,
            NewValues = $"Type: {dto.TransactionType}, Points: {dto.Points}, Customer: {membership.ContractParty.PartyName}"
        });

        await _context.SaveChangesAsync();

        return await GetTransactionByIdAsync(transaction.TransactionId);
    }

    public async Task<LoyaltyTransactionKpiDto> GetTransactionKpisAsync()
    {
        var allTx = await _context.LoyaltyTransactions.ToListAsync();

        return new LoyaltyTransactionKpiDto
        {
            TotalTransactions = allTx.Count,
            PointsEarned = allTx.Where(t => t.TransactionType == "Earned").Sum(t => Math.Abs(t.Points)),
            PointsRedeemed = allTx.Where(t => t.TransactionType == "Redeemed").Sum(t => Math.Abs(t.Points)),
            TotalAdjustments = allTx.Where(t => t.TransactionType == "Adjustment").Sum(t => t.Points)
        };
    }
}
