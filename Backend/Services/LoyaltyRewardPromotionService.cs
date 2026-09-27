using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using System.Collections.Generic;

namespace Backend.Services;

public class LoyaltyRewardPromotionService : ILoyaltyRewardPromotionService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;

    public LoyaltyRewardPromotionService(
        ApplicationDbContext context,
        IAuditService auditService,
        IActivityService activityService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
    }

    private async Task<string> GenerateRewardCodeAsync()
    {
        var count = await _context.LoyaltyRewards.CountAsync();
        return $"REW-{(count + 1):D6}";
    }

    private async Task<string> GeneratePromotionCodeAsync()
    {
        var count = await _context.LoyaltyPromotions.CountAsync();
        return $"PROMO-{(count + 1):D6}";
    }

    // ==========================================
    // REWARDS
    // ==========================================

    public async Task<PaginatedResult<LoyaltyReward>> GetRewardsAsync(RewardFilterDto filter)
    {
        var query = _context.LoyaltyRewards
            .Include(r => r.LoyaltyProgram)
            .Include(r => r.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.ToLower();
            query = query.Where(r => r.RewardName.ToLower().Contains(term) || r.RewardCode.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(filter.Status) && filter.Status != "All")
        {
            query = query.Where(r => r.Status == filter.Status);
        }

        if (filter.LoyaltyProgramId.HasValue)
        {
            query = query.Where(r => r.LoyaltyProgramId == filter.LoyaltyProgramId.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PaginatedResult<LoyaltyReward>
        {
            Items = items,
            TotalCount = total,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<LoyaltyReward> GetRewardByIdAsync(int id)
    {
        var reward = await _context.LoyaltyRewards
            .Include(r => r.LoyaltyProgram)
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.RewardId == id);
            
        if (reward == null) throw new KeyNotFoundException("Reward not found");
        return reward;
    }

    public async Task<LoyaltyReward> CreateRewardAsync(CreateLoyaltyRewardDto dto, int userId)
    {
        var program = await _context.LoyaltyPrograms.FindAsync(dto.LoyaltyProgramId);
        if (program == null) throw new InvalidOperationException("Invalid Loyalty Program");
        if (program.Status != "Active" && program.Status != "Draft")
            throw new InvalidOperationException("Cannot add reward to inactive program");

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.EndDate < dto.StartDate)
            throw new InvalidOperationException("End date cannot be before start date");

        var reward = new LoyaltyReward
        {
            LoyaltyProgramId = dto.LoyaltyProgramId,
            RewardCode = await GenerateRewardCodeAsync(),
            RewardName = dto.RewardName,
            Description = dto.Description,
            RewardType = dto.RewardType,
            PointsCost = dto.PointsCost,
            RewardValue = dto.RewardValue,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Status = "Draft",
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LoyaltyRewards.Add(reward);
        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "Reward", reward.RewardId.ToString(), "Created", $"Created Reward {reward.RewardCode}");
        await _auditService.LogAuditAsync(userId, "Create", "Loyalty", "Reward", reward.RewardId.ToString(), null, reward, null);

        return await GetRewardByIdAsync(reward.RewardId);
    }

    public async Task<LoyaltyReward> UpdateRewardAsync(int id, UpdateLoyaltyRewardDto dto, int userId)
    {
        var reward = await _context.LoyaltyRewards.FindAsync(id);
        if (reward == null) throw new KeyNotFoundException("Reward not found");

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.EndDate < dto.StartDate)
            throw new InvalidOperationException("End date cannot be before start date");

        var oldValues = new
        {
            reward.RewardName,
            reward.Description,
            reward.RewardType,
            reward.PointsCost,
            reward.RewardValue,
            reward.StartDate,
            reward.EndDate
        };

        reward.RewardName = dto.RewardName;
        reward.Description = dto.Description;
        reward.RewardType = dto.RewardType;
        reward.PointsCost = dto.PointsCost;
        reward.RewardValue = dto.RewardValue;
        reward.StartDate = dto.StartDate;
        reward.EndDate = dto.EndDate;
        reward.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "Reward", reward.RewardId.ToString(), "Updated", $"Updated Reward {reward.RewardCode}");
        await _auditService.LogAuditAsync(userId, "Update", "Loyalty", "Reward", reward.RewardId.ToString(), oldValues, reward, null);

        return await GetRewardByIdAsync(id);
    }

    public async Task ActivateRewardAsync(int id, int userId)
    {
        var reward = await _context.LoyaltyRewards.FindAsync(id);
        if (reward == null) throw new KeyNotFoundException("Reward not found");
        if (reward.Status == "Active") throw new InvalidOperationException("Reward is already active");

        reward.Status = "Active";
        reward.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "Reward", reward.RewardId.ToString(), "Activated", $"Activated Reward {reward.RewardCode}");
        await _auditService.LogAuditAsync(userId, "Activate", "Loyalty", "Reward", reward.RewardId.ToString(), new { Status = "Draft/Inactive" }, new { Status = "Active" }, null);
    }

    public async Task DeactivateRewardAsync(int id, int userId)
    {
        var reward = await _context.LoyaltyRewards.FindAsync(id);
        if (reward == null) throw new KeyNotFoundException("Reward not found");
        if (reward.Status == "Inactive") throw new InvalidOperationException("Reward is already inactive");

        reward.Status = "Inactive";
        reward.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "Reward", reward.RewardId.ToString(), "Deactivated", $"Deactivated Reward {reward.RewardCode}");
        await _auditService.LogAuditAsync(userId, "Deactivate", "Loyalty", "Reward", reward.RewardId.ToString(), new { Status = "Active/Draft" }, new { Status = "Inactive" }, null);
    }

    public async Task<object> GetRewardKpisAsync()
    {
        var total = await _context.LoyaltyRewards.CountAsync();
        var active = await _context.LoyaltyRewards.CountAsync(r => r.Status == "Active");
        var inactive = await _context.LoyaltyRewards.CountAsync(r => r.Status == "Inactive");
        var programsWithRewards = await _context.LoyaltyRewards.Select(r => r.LoyaltyProgramId).Distinct().CountAsync();

        return new
        {
            totalRewards = total,
            activeRewards = active,
            inactiveRewards = inactive,
            programsWithRewards = programsWithRewards
        };
    }

    // ==========================================
    // PROMOTIONS
    // ==========================================

    public async Task<PaginatedResult<LoyaltyPromotion>> GetPromotionsAsync(PromotionFilterDto filter)
    {
        var query = _context.LoyaltyPromotions
            .Include(p => p.LoyaltyProgram)
            .Include(p => p.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.ToLower();
            query = query.Where(p => p.PromotionName.ToLower().Contains(term) || p.PromotionCode.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(filter.Status) && filter.Status != "All")
        {
            query = query.Where(p => p.Status == filter.Status);
        }

        if (filter.LoyaltyProgramId.HasValue)
        {
            query = query.Where(p => p.LoyaltyProgramId == filter.LoyaltyProgramId.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PaginatedResult<LoyaltyPromotion>
        {
            Items = items,
            TotalCount = total,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<LoyaltyPromotion> GetPromotionByIdAsync(int id)
    {
        var promo = await _context.LoyaltyPromotions
            .Include(p => p.LoyaltyProgram)
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.PromotionId == id);
            
        if (promo == null) throw new KeyNotFoundException("Promotion not found");
        return promo;
    }

    public async Task<LoyaltyPromotion> CreatePromotionAsync(CreateLoyaltyPromotionDto dto, int userId)
    {
        var program = await _context.LoyaltyPrograms.FindAsync(dto.LoyaltyProgramId);
        if (program == null) throw new InvalidOperationException("Invalid Loyalty Program");
        if (program.Status != "Active" && program.Status != "Draft")
            throw new InvalidOperationException("Cannot add promotion to inactive program");

        if (dto.EndDate < dto.StartDate)
            throw new InvalidOperationException("End date cannot be before start date");

        var promo = new LoyaltyPromotion
        {
            LoyaltyProgramId = dto.LoyaltyProgramId,
            PromotionCode = await GeneratePromotionCodeAsync(),
            PromotionName = dto.PromotionName,
            Description = dto.Description,
            PromotionType = dto.PromotionType,
            BonusPoints = dto.BonusPoints,
            PointsMultiplier = dto.PointsMultiplier,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Status = "Draft",
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LoyaltyPromotions.Add(promo);
        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "Promotion", promo.PromotionId.ToString(), "Created", $"Created Promotion {promo.PromotionCode}");
        await _auditService.LogAuditAsync(userId, "Create", "Loyalty", "Promotion", promo.PromotionId.ToString(), null, promo, null);

        return await GetPromotionByIdAsync(promo.PromotionId);
    }

    public async Task<LoyaltyPromotion> UpdatePromotionAsync(int id, UpdateLoyaltyPromotionDto dto, int userId)
    {
        var promo = await _context.LoyaltyPromotions.FindAsync(id);
        if (promo == null) throw new KeyNotFoundException("Promotion not found");

        if (dto.EndDate < dto.StartDate)
            throw new InvalidOperationException("End date cannot be before start date");

        var oldValues = new
        {
            promo.PromotionName,
            promo.Description,
            promo.PromotionType,
            promo.BonusPoints,
            promo.PointsMultiplier,
            promo.StartDate,
            promo.EndDate
        };

        promo.PromotionName = dto.PromotionName;
        promo.Description = dto.Description;
        promo.PromotionType = dto.PromotionType;
        promo.BonusPoints = dto.BonusPoints;
        promo.PointsMultiplier = dto.PointsMultiplier;
        promo.StartDate = dto.StartDate;
        promo.EndDate = dto.EndDate;
        promo.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "Promotion", promo.PromotionId.ToString(), "Updated", $"Updated Promotion {promo.PromotionCode}");
        await _auditService.LogAuditAsync(userId, "Update", "Loyalty", "Promotion", promo.PromotionId.ToString(), oldValues, promo, null);

        return await GetPromotionByIdAsync(id);
    }

    public async Task ActivatePromotionAsync(int id, int userId)
    {
        var promo = await _context.LoyaltyPromotions.FindAsync(id);
        if (promo == null) throw new KeyNotFoundException("Promotion not found");
        if (promo.Status == "Active") throw new InvalidOperationException("Promotion is already active");

        promo.Status = "Active";
        promo.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "Promotion", promo.PromotionId.ToString(), "Activated", $"Activated Promotion {promo.PromotionCode}");
        await _auditService.LogAuditAsync(userId, "Activate", "Loyalty", "Promotion", promo.PromotionId.ToString(), new { Status = "Draft/Inactive" }, new { Status = "Active" }, null);
    }

    public async Task DeactivatePromotionAsync(int id, int userId)
    {
        var promo = await _context.LoyaltyPromotions.FindAsync(id);
        if (promo == null) throw new KeyNotFoundException("Promotion not found");
        if (promo.Status == "Inactive") throw new InvalidOperationException("Promotion is already inactive");

        promo.Status = "Inactive";
        promo.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(userId, "Loyalty", "Promotion", promo.PromotionId.ToString(), "Deactivated", $"Deactivated Promotion {promo.PromotionCode}");
        await _auditService.LogAuditAsync(userId, "Deactivate", "Loyalty", "Promotion", promo.PromotionId.ToString(), new { Status = "Active/Draft" }, new { Status = "Inactive" }, null);
    }

    public async Task<object> GetPromotionKpisAsync()
    {
        var now = DateTime.UtcNow;
        var total = await _context.LoyaltyPromotions.CountAsync();
        var active = await _context.LoyaltyPromotions.CountAsync(p => p.Status == "Active" && p.StartDate <= now && p.EndDate >= now);
        var upcoming = await _context.LoyaltyPromotions.CountAsync(p => p.Status == "Active" && p.StartDate > now);
        var expired = await _context.LoyaltyPromotions.CountAsync(p => p.Status == "Active" && p.EndDate < now);

        return new
        {
            totalPromotions = total,
            activePromotions = active,
            upcomingPromotions = upcoming,
            expiredPromotions = expired
        };
    }
}
