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

public class LoyaltyProgramService : ILoyaltyProgramService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;

    public LoyaltyProgramService(ApplicationDbContext context, IAuditService auditService, IActivityService activityService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
    }

    public async Task<PaginatedResult<LoyaltyProgramDto>> GetProgramsAsync(string? search, string? status, int page, int pageSize)
    {
        var query = _context.LoyaltyPrograms.Include(p => p.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p => p.ProgramName.ToLower().Contains(searchLower) || p.ProgramCode.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            query = query.Where(p => p.Status == status);
        }

        var totalCount = await query.CountAsync();

        var programs = await query
            .OrderByDescending(p => p.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new LoyaltyProgramDto
            {
                LoyaltyProgramId = p.LoyaltyProgramId,
                ProgramCode = p.ProgramCode,
                ProgramName = p.ProgramName,
                Description = p.Description,
                Status = p.Status,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                PointsName = p.PointsName,
                EarningAmount = p.EarningAmount,
                EarningPoints = p.EarningPoints,
                MinimumRedemptionPoints = p.MinimumRedemptionPoints,
                CreatedById = p.CreatedById,
                CreatedByName = p.User.FirstName + " " + p.User.LastName,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return new PaginatedResult<LoyaltyProgramDto>
        {
            Items = programs,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<LoyaltyProgramDto> GetProgramByIdAsync(int id)
    {
        var program = await _context.LoyaltyPrograms
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.LoyaltyProgramId == id);

        if (program == null) throw new KeyNotFoundException("Loyalty Program not found");

        return new LoyaltyProgramDto
        {
            LoyaltyProgramId = program.LoyaltyProgramId,
            ProgramCode = program.ProgramCode,
            ProgramName = program.ProgramName,
            Description = program.Description,
            Status = program.Status,
            StartDate = program.StartDate,
            EndDate = program.EndDate,
            PointsName = program.PointsName,
            EarningAmount = program.EarningAmount,
            EarningPoints = program.EarningPoints,
            MinimumRedemptionPoints = program.MinimumRedemptionPoints,
            CreatedById = program.CreatedById,
            CreatedByName = program.User.FirstName + " " + program.User.LastName,
            CreatedAt = program.CreatedAt,
            UpdatedAt = program.UpdatedAt
        };
    }

    public async Task<LoyaltyProgramDto> CreateProgramAsync(CreateLoyaltyProgramDto dto, int currentUserId)
    {
        if (dto.EndDate.HasValue && dto.EndDate.Value <= dto.StartDate)
        {
            throw new InvalidOperationException("End Date must be greater than Start Date.");
        }

        var programCode = await GenerateProgramCodeAsync();

        var program = new LoyaltyProgram
        {
            ProgramCode = programCode,
            ProgramName = dto.ProgramName,
            Description = dto.Description,
            Status = "Draft",
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            PointsName = dto.PointsName,
            EarningAmount = dto.EarningAmount,
            EarningPoints = dto.EarningPoints,
            MinimumRedemptionPoints = dto.MinimumRedemptionPoints,
            CreatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LoyaltyPrograms.Add(program);
        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Created Loyalty Program", "Loyalty", "LoyaltyProgram", program.LoyaltyProgramId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Loyalty", "LoyaltyProgram", program.LoyaltyProgramId.ToString(), "Created", $"Loyalty program {program.ProgramName} was created.");

        return await GetProgramByIdAsync(program.LoyaltyProgramId);
    }

    public async Task<LoyaltyProgramDto> UpdateProgramAsync(int id, UpdateLoyaltyProgramDto dto, int currentUserId)
    {
        var program = await _context.LoyaltyPrograms.FindAsync(id);
        if (program == null) throw new KeyNotFoundException("Loyalty Program not found");

        if (program.Status != "Draft" && program.Status != "Inactive")
        {
            throw new InvalidOperationException("Only Draft or Inactive programs can be edited. Deactivate an Active program before editing.");
        }

        if (dto.EndDate.HasValue && dto.EndDate.Value <= dto.StartDate)
        {
            throw new InvalidOperationException("End Date must be greater than Start Date.");
        }

        program.ProgramName = dto.ProgramName;
        program.Description = dto.Description;
        program.StartDate = dto.StartDate;
        program.EndDate = dto.EndDate;
        program.PointsName = dto.PointsName;
        program.EarningAmount = dto.EarningAmount;
        program.EarningPoints = dto.EarningPoints;
        program.MinimumRedemptionPoints = dto.MinimumRedemptionPoints;
        program.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Updated Loyalty Program", "Loyalty", "LoyaltyProgram", program.LoyaltyProgramId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Loyalty", "LoyaltyProgram", program.LoyaltyProgramId.ToString(), "Updated", $"Loyalty program {program.ProgramName} was updated.");

        return await GetProgramByIdAsync(program.LoyaltyProgramId);
    }

    public async Task ActivateProgramAsync(int id, int currentUserId)
    {
        var program = await _context.LoyaltyPrograms.FindAsync(id);
        if (program == null) throw new KeyNotFoundException("Loyalty Program not found");

        if (program.Status == "Active") throw new InvalidOperationException("Program is already active.");

        program.Status = "Active";
        program.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Activated Loyalty Program", "Loyalty", "LoyaltyProgram", program.LoyaltyProgramId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Loyalty", "LoyaltyProgram", program.LoyaltyProgramId.ToString(), "Activated", $"Loyalty program {program.ProgramName} was activated.");
    }

    public async Task DeactivateProgramAsync(int id, int currentUserId)
    {
        var program = await _context.LoyaltyPrograms.FindAsync(id);
        if (program == null) throw new KeyNotFoundException("Loyalty Program not found");

        if (program.Status == "Inactive") throw new InvalidOperationException("Program is already inactive.");
        if (program.Status == "Draft") throw new InvalidOperationException("Draft programs cannot be deactivated.");

        program.Status = "Inactive";
        program.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Deactivated Loyalty Program", "Loyalty", "LoyaltyProgram", program.LoyaltyProgramId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Loyalty", "LoyaltyProgram", program.LoyaltyProgramId.ToString(), "Deactivated", $"Loyalty program {program.ProgramName} was deactivated.");
    }

    public async Task<LoyaltyProgramKpiDto> GetProgramKpisAsync()
    {
        var allPrograms = await _context.LoyaltyPrograms.ToListAsync();

        return new LoyaltyProgramKpiDto
        {
            Total = allPrograms.Count,
            Active = allPrograms.Count(p => p.Status == "Active"),
            Draft = allPrograms.Count(p => p.Status == "Draft"),
            Inactive = allPrograms.Count(p => p.Status == "Inactive")
        };
    }

    private async Task<string> GenerateProgramCodeAsync()
    {
        var lastProgram = await _context.LoyaltyPrograms
            .OrderByDescending(p => p.LoyaltyProgramId)
            .FirstOrDefaultAsync();

        int nextId = (lastProgram?.LoyaltyProgramId ?? 0) + 1;
        return $"LP-{nextId:D6}";
    }
}
