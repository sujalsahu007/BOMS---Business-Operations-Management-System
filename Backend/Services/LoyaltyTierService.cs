using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;

namespace Backend.Services;

public class LoyaltyTierService : ILoyaltyTierService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;

    public LoyaltyTierService(ApplicationDbContext context, IAuditService auditService, IActivityService activityService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
    }

    public async Task<PaginatedResult<LoyaltyTierDto>> GetTiersAsync(TierFilterDto filter)
    {
        var query = _context.LoyaltyTiers
            .Include(t => t.LoyaltyProgram)
            .Include(t => t.Benefits)
            .AsQueryable();

        if (filter.LoyaltyProgramId.HasValue)
            query = query.Where(t => t.LoyaltyProgramId == filter.LoyaltyProgramId.Value);

        if (!string.IsNullOrEmpty(filter.Status) && filter.Status != "All")
            query = query.Where(t => t.Status == filter.Status);

        if (!string.IsNullOrEmpty(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(t => 
                t.TierName.ToLower().Contains(search) || 
                t.TierCode.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(t => t.LoyaltyProgramId)
            .ThenBy(t => t.DisplayOrder)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(t => new LoyaltyTierDto
            {
                TierId = t.TierId,
                LoyaltyProgramId = t.LoyaltyProgramId,
                ProgramName = t.LoyaltyProgram.ProgramName,
                TierCode = t.TierCode,
                TierName = t.TierName,
                Description = t.Description,
                QualificationType = t.QualificationType,
                QualificationThreshold = t.QualificationThreshold,
                DisplayOrder = t.DisplayOrder,
                Status = t.Status,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                BenefitCount = t.Benefits.Count
            })
            .ToListAsync();

        return new PaginatedResult<LoyaltyTierDto> { TotalCount = totalCount, Items = items };
    }

    public async Task<LoyaltyTierDto> GetTierByIdAsync(int id)
    {
        var t = await _context.LoyaltyTiers
            .Include(x => x.LoyaltyProgram)
            .Include(x => x.Benefits)
            .FirstOrDefaultAsync(x => x.TierId == id);
            
        if (t == null) throw new KeyNotFoundException("Tier not found.");

        return new LoyaltyTierDto
        {
            TierId = t.TierId,
            LoyaltyProgramId = t.LoyaltyProgramId,
            ProgramName = t.LoyaltyProgram.ProgramName,
            TierCode = t.TierCode,
            TierName = t.TierName,
            Description = t.Description,
            QualificationType = t.QualificationType,
            QualificationThreshold = t.QualificationThreshold,
            DisplayOrder = t.DisplayOrder,
            Status = t.Status,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
            BenefitCount = t.Benefits.Count
        };
    }

    public async Task<LoyaltyTierDto> CreateTierAsync(CreateLoyaltyTierDto createDto, int userId)
    {
        var programExists = await _context.LoyaltyPrograms.AnyAsync(p => p.LoyaltyProgramId == createDto.LoyaltyProgramId);
        if (!programExists) throw new InvalidOperationException("Loyalty program not found.");

        var codeExists = await _context.LoyaltyTiers.AnyAsync(t => t.LoyaltyProgramId == createDto.LoyaltyProgramId && t.TierCode == createDto.TierCode);
        if (codeExists) throw new InvalidOperationException("Tier code must be unique within the same program.");

        var tier = new LoyaltyTier
        {
            LoyaltyProgramId = createDto.LoyaltyProgramId,
            TierCode = createDto.TierCode,
            TierName = createDto.TierName,
            Description = createDto.Description,
            QualificationType = createDto.QualificationType,
            QualificationThreshold = createDto.QualificationThreshold,
            DisplayOrder = createDto.DisplayOrder,
            Status = "Draft",
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LoyaltyTiers.Add(tier);
        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "LoyaltyTier", tier.TierId.ToString(), "Created", $"Created tier {tier.TierName}");
        await _auditService.LogAuditAsync(userId, "Created", "Loyalty", "LoyaltyTier", tier.TierId.ToString(), null, tier, null);

        return await GetTierByIdAsync(tier.TierId);
    }

    public async Task<LoyaltyTierDto> UpdateTierAsync(int id, UpdateLoyaltyTierDto updateDto, int userId)
    {
        var tier = await _context.LoyaltyTiers.FindAsync(id);
        if (tier == null) throw new KeyNotFoundException("Tier not found.");

        tier.TierName = updateDto.TierName;
        tier.Description = updateDto.Description;
        tier.QualificationType = updateDto.QualificationType;
        tier.QualificationThreshold = updateDto.QualificationThreshold;
        tier.DisplayOrder = updateDto.DisplayOrder;
        tier.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "LoyaltyTier", id.ToString(), "Updated", $"Updated tier {tier.TierName}");
        await _auditService.LogAuditAsync(userId, "Updated", "Loyalty", "LoyaltyTier", id.ToString(), null, tier, null);

        return await GetTierByIdAsync(id);
    }

    public async Task ActivateTierAsync(int id, int userId)
    {
        var tier = await _context.LoyaltyTiers.FindAsync(id);
        if (tier == null) throw new KeyNotFoundException("Tier not found.");
        
        tier.Status = "Active";
        tier.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        await _activityService.LogActivityAsync(userId, "Loyalty", "LoyaltyTier", id.ToString(), "Activated", $"Activated tier {tier.TierName}");
        await _auditService.LogAuditAsync(userId, "Activated", "Loyalty", "LoyaltyTier", id.ToString(), null, tier, null);
    }

    public async Task DeactivateTierAsync(int id, int userId)
    {
        var tier = await _context.LoyaltyTiers.FindAsync(id);
        if (tier == null) throw new KeyNotFoundException("Tier not found.");
        
        tier.Status = "Inactive";
        tier.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        await _activityService.LogActivityAsync(userId, "Loyalty", "LoyaltyTier", id.ToString(), "Deactivated", $"Deactivated tier {tier.TierName}");
        await _auditService.LogAuditAsync(userId, "Deactivated", "Loyalty", "LoyaltyTier", id.ToString(), null, tier, null);
    }

    public async Task<LoyaltyTierKpiDto> GetTierKpisAsync()
    {
        var total = await _context.LoyaltyTiers.CountAsync();
        var active = await _context.LoyaltyTiers.CountAsync(t => t.Status == "Active");
        var benefits = await _context.LoyaltyBenefits.CountAsync();
        var programsWithTiers = await _context.LoyaltyTiers.Select(t => t.LoyaltyProgramId).Distinct().CountAsync();

        return new LoyaltyTierKpiDto
        {
            TotalTiers = total,
            ActiveTiers = active,
            TotalBenefits = benefits,
            ProgramsWithTiers = programsWithTiers
        };
    }

    // Benefits logic
    public async Task<List<LoyaltyBenefitDto>> GetBenefitsByTierAsync(int tierId)
    {
        var exists = await _context.LoyaltyTiers.AnyAsync(t => t.TierId == tierId);
        if (!exists) throw new KeyNotFoundException("Tier not found.");

        return await _context.LoyaltyBenefits
            .Where(b => b.TierId == tierId)
            .OrderBy(b => b.CreatedAt)
            .Select(b => new LoyaltyBenefitDto
            {
                BenefitId = b.BenefitId,
                TierId = b.TierId,
                BenefitName = b.BenefitName,
                Description = b.Description,
                BenefitType = b.BenefitType,
                BenefitValue = b.BenefitValue,
                Status = b.Status,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<LoyaltyBenefitDto> CreateBenefitAsync(int tierId, CreateLoyaltyBenefitDto createDto, int userId)
    {
        var exists = await _context.LoyaltyTiers.AnyAsync(t => t.TierId == tierId);
        if (!exists) throw new KeyNotFoundException("Tier not found.");

        var benefit = new LoyaltyBenefit
        {
            TierId = tierId,
            BenefitName = createDto.BenefitName,
            Description = createDto.Description,
            BenefitType = createDto.BenefitType,
            BenefitValue = createDto.BenefitValue,
            Status = "Active",
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LoyaltyBenefits.Add(benefit);
        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "LoyaltyBenefit", benefit.BenefitId.ToString(), "Created", $"Added benefit {benefit.BenefitName}");
        await _auditService.LogAuditAsync(userId, "Created", "Loyalty", "LoyaltyBenefit", benefit.BenefitId.ToString(), null, benefit, null);

        return await GetBenefitsByTierAsync(tierId).ContinueWith(t => t.Result.First(b => b.BenefitId == benefit.BenefitId));
    }

    public async Task<LoyaltyBenefitDto> UpdateBenefitAsync(int id, UpdateLoyaltyBenefitDto updateDto, int userId)
    {
        var benefit = await _context.LoyaltyBenefits.FindAsync(id);
        if (benefit == null) throw new KeyNotFoundException("Benefit not found.");

        benefit.BenefitName = updateDto.BenefitName;
        benefit.Description = updateDto.Description;
        benefit.BenefitType = updateDto.BenefitType;
        benefit.BenefitValue = updateDto.BenefitValue;
        benefit.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "LoyaltyBenefit", id.ToString(), "Updated", $"Updated benefit {benefit.BenefitName}");
        await _auditService.LogAuditAsync(userId, "Updated", "Loyalty", "LoyaltyBenefit", id.ToString(), null, benefit, null);

        return await GetBenefitsByTierAsync(benefit.TierId).ContinueWith(t => t.Result.First(b => b.BenefitId == id));
    }

    public async Task ActivateBenefitAsync(int id, int userId)
    {
        var benefit = await _context.LoyaltyBenefits.FindAsync(id);
        if (benefit == null) throw new KeyNotFoundException("Benefit not found.");
        
        benefit.Status = "Active";
        benefit.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        await _activityService.LogActivityAsync(userId, "Loyalty", "LoyaltyBenefit", id.ToString(), "Activated", $"Activated benefit {benefit.BenefitName}");
        await _auditService.LogAuditAsync(userId, "Activated", "Loyalty", "LoyaltyBenefit", id.ToString(), null, benefit, null);
    }

    public async Task DeactivateBenefitAsync(int id, int userId)
    {
        var benefit = await _context.LoyaltyBenefits.FindAsync(id);
        if (benefit == null) throw new KeyNotFoundException("Benefit not found.");
        
        benefit.Status = "Inactive";
        benefit.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        await _activityService.LogActivityAsync(userId, "Loyalty", "LoyaltyBenefit", id.ToString(), "Deactivated", $"Deactivated benefit {benefit.BenefitName}");
        await _auditService.LogAuditAsync(userId, "Deactivated", "Loyalty", "LoyaltyBenefit", id.ToString(), null, benefit, null);
    }
}
