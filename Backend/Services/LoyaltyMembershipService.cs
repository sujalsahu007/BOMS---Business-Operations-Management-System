using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class LoyaltyMembershipService : ILoyaltyMembershipService
{
    private readonly ApplicationDbContext _context;

    public LoyaltyMembershipService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<LoyaltyMembershipDto> Items, int TotalCount)> GetMembershipsAsync(
        int page, int pageSize, string search, int? programId, int? tierId, string status)
    {
        var query = _context.LoyaltyMemberships
            .Include(m => m.ContractParty)
            .Include(m => m.LoyaltyProgram)
            .Include(m => m.LoyaltyTier)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(m => m.ContractParty.PartyName.Contains(search) || 
                                     m.ContractParty.PartyCode.Contains(search));
        }

        if (programId.HasValue)
        {
            query = query.Where(m => m.LoyaltyProgramId == programId.Value);
        }

        if (tierId.HasValue)
        {
            query = query.Where(m => m.TierId == tierId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            query = query.Where(m => m.Status == status);
        }

        int totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(m => m.EnrolledAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new LoyaltyMembershipDto
            {
                MembershipId = m.MembershipId,
                PartyId = m.PartyId,
                CustomerName = m.ContractParty.PartyName,
                CustomerCode = m.ContractParty.PartyCode,
                LoyaltyProgramId = m.LoyaltyProgramId,
                ProgramName = m.LoyaltyProgram.ProgramName,
                TierId = m.TierId,
                TierName = m.LoyaltyTier != null ? m.LoyaltyTier.TierName : null,
                PointsBalance = m.PointsBalance,
                LifetimePoints = m.LifetimePoints,
                Status = m.Status,
                EnrolledAt = m.EnrolledAt,
                UpdatedAt = m.UpdatedAt
            })
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<LoyaltyMembershipDto?> GetMembershipByIdAsync(int id)
    {
        var m = await _context.LoyaltyMemberships
            .Include(x => x.ContractParty)
            .Include(x => x.LoyaltyProgram)
            .Include(x => x.LoyaltyTier)
            .FirstOrDefaultAsync(x => x.MembershipId == id);

        if (m == null) return null;

        return new LoyaltyMembershipDto
        {
            MembershipId = m.MembershipId,
            PartyId = m.PartyId,
            CustomerName = m.ContractParty.PartyName,
            CustomerCode = m.ContractParty.PartyCode,
            LoyaltyProgramId = m.LoyaltyProgramId,
            ProgramName = m.LoyaltyProgram.ProgramName,
            TierId = m.TierId,
            TierName = m.LoyaltyTier != null ? m.LoyaltyTier.TierName : null,
            PointsBalance = m.PointsBalance,
            LifetimePoints = m.LifetimePoints,
            Status = m.Status,
            EnrolledAt = m.EnrolledAt,
            UpdatedAt = m.UpdatedAt
        };
    }

    public async Task<LoyaltyMembershipDto> EnrollCustomerAsync(CreateLoyaltyMembershipDto dto, int userId)
    {
        // Validate active program
        var program = await _context.LoyaltyPrograms.FindAsync(dto.LoyaltyProgramId);
        if (program == null) throw new Exception("Loyalty Program not found.");
        if (program.Status != "Active") throw new Exception("Cannot enroll in an inactive program.");

        // Validate customer
        var party = await _context.ContractParties.FindAsync(dto.PartyId);
        if (party == null) throw new Exception("Customer not found.");
        // We enforce that the party is a Customer
        if (!string.Equals(party.PartyType, "Customer", StringComparison.OrdinalIgnoreCase))
        {
            throw new Exception("Only valid Customers can be enrolled in a loyalty program.");
        }

        // Prevent duplicate membership
        var existing = await _context.LoyaltyMemberships
            .AnyAsync(m => m.PartyId == dto.PartyId && m.LoyaltyProgramId == dto.LoyaltyProgramId);
        
        if (existing) throw new Exception("Customer is already enrolled in this loyalty program.");

        var membership = new LoyaltyMembership
        {
            PartyId = dto.PartyId,
            LoyaltyProgramId = dto.LoyaltyProgramId,
            TierId = null, // Initially null
            PointsBalance = 0,
            LifetimePoints = 0,
            Status = "Active",
            EnrolledAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LoyaltyMemberships.Add(membership);
        
        // Audit log
        _context.Activities.Add(new Activity
        {
            UserId = userId,
            Module = "Loyalty",
            EntityType = "LoyaltyMembership",
            EntityId = "New", // Will update after save if needed, but 'New' is ok for simple logging
            Action = "Enroll",
            Description = $"Enrolled customer {party.PartyName} into program {program.ProgramName}.",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return await GetMembershipByIdAsync(membership.MembershipId) ?? throw new Exception("Failed to retrieve new membership.");
    }

    public async Task<bool> ActivateMembershipAsync(int id, int userId)
    {
        var membership = await _context.LoyaltyMemberships.FindAsync(id);
        if (membership == null) return false;

        membership.Status = "Active";
        membership.UpdatedAt = DateTime.UtcNow;

        _context.Activities.Add(new Activity
        {
            UserId = userId,
            Module = "Loyalty",
            EntityType = "LoyaltyMembership",
            EntityId = id.ToString(),
            Action = "Activate",
            Description = $"Activated membership {id}.",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeactivateMembershipAsync(int id, int userId)
    {
        var membership = await _context.LoyaltyMemberships.FindAsync(id);
        if (membership == null) return false;

        membership.Status = "Inactive";
        membership.UpdatedAt = DateTime.UtcNow;

        _context.Activities.Add(new Activity
        {
            UserId = userId,
            Module = "Loyalty",
            EntityType = "LoyaltyMembership",
            EntityId = id.ToString(),
            Action = "Deactivate",
            Description = $"Deactivated membership {id}.",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<object> GetMembershipKpisAsync()
    {
        var totalMembers = await _context.LoyaltyMemberships.CountAsync();
        var active = await _context.LoyaltyMemberships.CountAsync(m => m.Status == "Active");
        var inactive = await _context.LoyaltyMemberships.CountAsync(m => m.Status == "Inactive");
        var programsWithMembers = await _context.LoyaltyMemberships.Select(m => m.LoyaltyProgramId).Distinct().CountAsync();

        return new
        {
            totalMembers,
            active,
            inactive,
            programsWithMembers
        };
    }

    public async Task<IEnumerable<CustomerDropdownDto>> GetAvailableCustomersAsync(string search)
    {
        var query = _context.ContractParties
            .Where(p => p.PartyType == "Customer" && p.Status == "Active")
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p => p.PartyName.Contains(search) || p.PartyCode.Contains(search));
        }

        return await query
            .OrderBy(p => p.PartyName)
            .Take(50)
            .Select(p => new CustomerDropdownDto
            {
                PartyId = p.PartyId,
                PartyCode = p.PartyCode,
                PartyName = p.PartyName,
                PartyType = p.PartyType
            })
            .ToListAsync();
    }
}
