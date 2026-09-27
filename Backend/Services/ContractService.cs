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

public class ContractService : IContractService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;
    private readonly INotificationService _notificationService;

    public ContractService(
        ApplicationDbContext context,
        IAuditService auditService,
        IActivityService activityService,
        INotificationService notificationService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
        _notificationService = notificationService;
    }

    public async Task<ContractDashboardDto> GetDashboardAsync()
    {
        var now = DateTime.UtcNow;

        // Group by statuses for Contracts
        var contractStatusCounts = await _context.Contracts
            .GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(k => k.Status, v => v.Count);
            
        var totalContracts = contractStatusCounts.Values.Sum();
        
        var kpis = new DashboardKpisDto
        {
            TotalContracts = totalContracts,
            DraftContracts = contractStatusCounts.GetValueOrDefault("Draft", 0),
            PendingApproval = contractStatusCounts.GetValueOrDefault("Pending Approval", 0),
            ActiveContracts = contractStatusCounts.GetValueOrDefault("Active", 0),
            ExpiringSoon = contractStatusCounts.GetValueOrDefault("Expiring Soon", 0),
            Expired = contractStatusCounts.GetValueOrDefault("Expired", 0)
        };
        
        var statusDistribution = contractStatusCounts;
        
        // Expiry Overview
        var expiringBaseQuery = _context.Contracts.Where(c => c.Status == "Active" || c.Status == "Expiring Soon" || c.Status == "Expired");
        var expiryOverview = new ExpiryOverviewDto
        {
            ExpiringIn7Days = await expiringBaseQuery.CountAsync(c => c.Status != "Expired" && c.EndDate <= now.AddDays(7) && c.EndDate >= now),
            ExpiringIn30Days = await expiringBaseQuery.CountAsync(c => c.Status != "Expired" && c.EndDate <= now.AddDays(30) && c.EndDate >= now),
            ExpiringIn60Days = await expiringBaseQuery.CountAsync(c => c.Status != "Expired" && c.EndDate <= now.AddDays(60) && c.EndDate >= now),
            Expired = await expiringBaseQuery.CountAsync(c => c.Status == "Expired" || c.EndDate < now)
        };
        
        // Approval Overview
        var approvalStatusCounts = await _context.ContractApprovals
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(k => k.Status, v => v.Count);
            
        var approvalOverview = new ApprovalOverviewDto
        {
            PendingApprovals = approvalStatusCounts.GetValueOrDefault("Pending", 0),
            Approved = approvalStatusCounts.GetValueOrDefault("Approved", 0),
            Rejected = approvalStatusCounts.GetValueOrDefault("Rejected", 0)
        };
        
        // Obligation Overview
        var obligationStatusCounts = await _context.ContractObligations
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(k => k.Status, v => v.Count);
            
        var pendingOrInProg = obligationStatusCounts.GetValueOrDefault("Pending", 0) + obligationStatusCounts.GetValueOrDefault("In Progress", 0);
        
        var dueSoonQuery = await _context.ContractObligations.CountAsync(o => (o.Status == "Pending" || o.Status == "In Progress") && o.DueDate <= now.AddDays(7) && o.DueDate >= now);
        var overdueImplicit = await _context.ContractObligations.CountAsync(o => (o.Status == "Pending" || o.Status == "In Progress") && o.DueDate < now);
        
        var obligationOverview = new ObligationOverviewDto
        {
            OpenObligations = pendingOrInProg,
            DueSoon = dueSoonQuery,
            Overdue = obligationStatusCounts.GetValueOrDefault("Overdue", 0) + overdueImplicit,
            Completed = obligationStatusCounts.GetValueOrDefault("Completed", 0)
        };
        
        // Recent Contracts
        var recentContracts = await _context.Contracts
            .Include(c => c.Party)
            .Include(c => c.Owner)
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .Select(c => new ContractDto
            {
                ContractId = c.ContractId,
                ContractNumber = c.ContractNumber,
                Title = c.Title,
                ContractType = c.ContractType,
                Description = c.Description,
                PartyId = c.PartyId,
                PartyName = c.Party.PartyName,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                ContractValue = c.ContractValue,
                Currency = c.Currency,
                OwnerId = c.OwnerId,
                OwnerName = c.Owner.FirstName + " " + c.Owner.LastName,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();
            
        // Expiring Contracts
        var expiringContracts = await _context.Contracts
            .Include(c => c.Party)
            .Include(c => c.Owner)
            .Where(c => c.Status == "Expiring Soon" || (c.Status == "Active" && c.EndDate <= now.AddDays(30)))
            .OrderBy(c => c.EndDate)
            .Take(5)
            .Select(c => new ContractDto
            {
                ContractId = c.ContractId,
                ContractNumber = c.ContractNumber,
                Title = c.Title,
                ContractType = c.ContractType,
                Description = c.Description,
                PartyId = c.PartyId,
                PartyName = c.Party.PartyName,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                ContractValue = c.ContractValue,
                Currency = c.Currency,
                OwnerId = c.OwnerId,
                OwnerName = c.Owner.FirstName + " " + c.Owner.LastName,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return new ContractDashboardDto
        {
            Kpis = kpis,
            StatusDistribution = statusDistribution,
            ExpiryOverview = expiryOverview,
            ApprovalOverview = approvalOverview,
            ObligationOverview = obligationOverview,
            RecentContracts = recentContracts,
            ExpiringContracts = expiringContracts
        };
    }



    // ==== PARTIES ====

    public async Task<PaginatedResult<ContractPartyDto>> GetPartiesAsync(int page, int pageSize, string? search, string? type)
    {
        var query = _context.ContractParties.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(p => 
                p.PartyCode.ToLower().Contains(search) || 
                p.PartyName.ToLower().Contains(search) ||
                (p.ContactPerson != null && p.ContactPerson.ToLower().Contains(search)) ||
                (p.Email != null && p.Email.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(type) && type != "All")
        {
            query = query.Where(p => p.PartyType == type);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ContractPartyDto
            {
                PartyId = p.PartyId,
                PartyCode = p.PartyCode,
                PartyName = p.PartyName,
                PartyType = p.PartyType,
                ContactPerson = p.ContactPerson,
                Email = p.Email,
                Phone = p.Phone,
                Address = p.Address,
                TaxNumber = p.TaxNumber,
                Status = p.Status,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                ActiveContractsCount = _context.Contracts.Count(c => c.PartyId == p.PartyId && c.Status == "Active"),
                TotalContractsCount = _context.Contracts.Count(c => c.PartyId == p.PartyId)
            })
            .ToListAsync();

        return new PaginatedResult<ContractPartyDto> { TotalCount = totalCount, Items = items };
    }

    public async Task<ContractPartyDto> GetPartyByIdAsync(int id)
    {
        return await GetPartyDtoAsync(id);
    }

    public async Task<ContractPartyDto> CreatePartyAsync(CreateContractPartyDto dto, int currentUserId)
    {
        var lastParty = await _context.ContractParties
            .OrderByDescending(p => p.PartyId)
            .FirstOrDefaultAsync();
            
        int nextId = (lastParty?.PartyId ?? 0) + 1;
        string partyCode = $"PARTY-{nextId:D4}";

        var party = new ContractParty
        {
            PartyCode = partyCode,
            PartyName = dto.PartyName,
            PartyType = dto.PartyType,
            ContactPerson = dto.ContactPerson,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
            TaxNumber = dto.TaxNumber,
            Status = dto.Status,
            CreatedAt = DateTime.UtcNow
        };

        _context.ContractParties.Add(party);
        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Created", "Contracts", "ContractParty", party.PartyId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Contracts", "ContractParty", party.PartyId.ToString(), "Created", $"Created party {party.PartyName}");

        return await GetPartyDtoAsync(party.PartyId);
    }

    public async Task<ContractPartyDto> UpdatePartyAsync(int id, UpdateContractPartyDto dto, int currentUserId)
    {
        var party = await _context.ContractParties.FindAsync(id);
        if (party == null) throw new KeyNotFoundException("Party not found");

        party.PartyName = dto.PartyName;
        party.PartyType = dto.PartyType;
        party.ContactPerson = dto.ContactPerson;
        party.Email = dto.Email;
        party.Phone = dto.Phone;
        party.Address = dto.Address;
        party.TaxNumber = dto.TaxNumber;
        party.Status = dto.Status;
        party.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditService.LogAuditAsync(currentUserId, "Updated", "Contracts", "ContractParty", party.PartyId.ToString(), null, null, null);

        return await GetPartyDtoAsync(party.PartyId);
    }

    private async Task<ContractPartyDto> GetPartyDtoAsync(int id)
    {
        var p = await _context.ContractParties.FindAsync(id);
        if (p == null) throw new KeyNotFoundException();
        return new ContractPartyDto
        {
            PartyId = p.PartyId,
            PartyCode = p.PartyCode,
            PartyName = p.PartyName,
            PartyType = p.PartyType,
            ContactPerson = p.ContactPerson,
            Email = p.Email,
            Phone = p.Phone,
            Address = p.Address,
            TaxNumber = p.TaxNumber,
            Status = p.Status,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            ActiveContractsCount = await _context.Contracts.CountAsync(c => c.PartyId == p.PartyId && c.Status == "Active"),
            TotalContractsCount = await _context.Contracts.CountAsync(c => c.PartyId == p.PartyId)
        };
    }

    public async Task<bool> DeactivatePartyAsync(int id, int currentUserId)
    {
        var party = await _context.ContractParties.FindAsync(id);
        if (party == null) throw new KeyNotFoundException("Party not found");

        party.Status = "Inactive";
        party.UpdatedAt = DateTime.UtcNow;

        _context.ContractParties.Update(party);
        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Deactivate", "Contracts", "ContractParty", party.PartyId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Contracts", "ContractParty", party.PartyId.ToString(), "Deactivated", $"Deactivated party {party.PartyName}");

        return true;
    }

    // ==== CONTRACTS ====

    public async Task<PaginatedResult<ContractDto>> GetContractsAsync(int page, int pageSize, string? search, string? status, string? type, int? partyId, int? ownerId)
    {
        var query = _context.Contracts
            .Include(c => c.Party)
            .Include(c => c.Owner)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(c => 
                c.ContractNumber.ToLower().Contains(search) || 
                c.Title.ToLower().Contains(search) ||
                c.Party.PartyName.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(c => c.Status == status);
        if (!string.IsNullOrWhiteSpace(type)) query = query.Where(c => c.ContractType == type);
        if (partyId.HasValue) query = query.Where(c => c.PartyId == partyId.Value);
        if (ownerId.HasValue) query = query.Where(c => c.OwnerId == ownerId.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ContractDto
            {
                ContractId = c.ContractId,
                ContractNumber = c.ContractNumber,
                Title = c.Title,
                ContractType = c.ContractType,
                Description = c.Description,
                PartyId = c.PartyId,
                PartyName = c.Party.PartyName,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                ContractValue = c.ContractValue,
                Currency = c.Currency,
                OwnerId = c.OwnerId,
                OwnerName = c.Owner.FirstName + " " + c.Owner.LastName,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return new PaginatedResult<ContractDto> { TotalCount = totalCount, Items = items };
    }

    public async Task<RenewalsExpiryResponseDto> GetRenewalsExpiryAsync(int page, int pageSize, string? search, string? status, int? expiryWindowDays, int? partyId, int? ownerId, string? sortBy)
    {
        var now = DateTime.UtcNow;

        // Base query for summaries (only relevant contracts that could expire or have expired)
        var baseQuery = _context.Contracts
            .Include(c => c.Party)
            .Include(c => c.Owner)
            .Where(c => c.Status == "Active" || c.Status == "Expiring Soon" || c.Status == "Expired");

        var summary = new RenewalsExpirySummaryDto
        {
            Expired = await baseQuery.CountAsync(c => c.EndDate < now || c.Status == "Expired"),
            ExpiringIn7Days = await baseQuery.CountAsync(c => c.EndDate >= now && c.EndDate <= now.AddDays(7) && c.Status != "Expired"),
            ExpiringIn30Days = await baseQuery.CountAsync(c => c.EndDate > now.AddDays(7) && c.EndDate <= now.AddDays(30) && c.Status != "Expired"),
            ExpiringIn60Days = await baseQuery.CountAsync(c => c.EndDate > now.AddDays(30) && c.EndDate <= now.AddDays(60) && c.Status != "Expired")
        };

        var query = baseQuery;

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(c => 
                c.ContractNumber.ToLower().Contains(search) || 
                c.Title.ToLower().Contains(search) ||
                c.Party.PartyName.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(c => c.Status == status);
        if (partyId.HasValue) query = query.Where(c => c.PartyId == partyId.Value);
        if (ownerId.HasValue) query = query.Where(c => c.OwnerId == ownerId.Value);
        
        if (expiryWindowDays.HasValue)
        {
            if (expiryWindowDays.Value == 0)
            {
                query = query.Where(c => c.EndDate < now || c.Status == "Expired");
            }
            else if (expiryWindowDays.Value == 7)
            {
                query = query.Where(c => c.EndDate >= now && c.EndDate <= now.AddDays(7) && c.Status != "Expired");
            }
            else if (expiryWindowDays.Value == 30)
            {
                query = query.Where(c => c.EndDate > now.AddDays(7) && c.EndDate <= now.AddDays(30) && c.Status != "Expired");
            }
            else if (expiryWindowDays.Value == 60)
            {
                query = query.Where(c => c.EndDate > now.AddDays(30) && c.EndDate <= now.AddDays(60) && c.Status != "Expired");
            }
        }

        var totalCount = await query.CountAsync();

        // Default sort: Earliest expiry first
        query = sortBy switch
        {
            "EndDateDesc" => query.OrderByDescending(c => c.EndDate),
            "ValueDesc" => query.OrderByDescending(c => c.ContractValue),
            "ValueAsc" => query.OrderBy(c => c.ContractValue),
            "NumberAsc" => query.OrderBy(c => c.ContractNumber),
            "NumberDesc" => query.OrderByDescending(c => c.ContractNumber),
            _ => query.OrderBy(c => c.EndDate)
        };

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ContractDto
            {
                ContractId = c.ContractId,
                ContractNumber = c.ContractNumber,
                Title = c.Title,
                ContractType = c.ContractType,
                Description = c.Description,
                PartyId = c.PartyId,
                PartyName = c.Party.PartyName,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                ContractValue = c.ContractValue,
                Currency = c.Currency,
                OwnerId = c.OwnerId,
                OwnerName = c.Owner.FirstName + " " + c.Owner.LastName,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                HasActiveRenewal = _context.Contracts.Any(r => r.OriginalContractId == c.ContractId && r.Status != "Active" && r.Status != "Terminated" && r.Status != "Rejected" && r.Status != "Expired"),
                RenewalStatus = _context.Contracts.Where(r => r.OriginalContractId == c.ContractId && r.Status != "Active" && r.Status != "Terminated" && r.Status != "Rejected" && r.Status != "Expired").Select(r => r.Status).FirstOrDefault()
            })
            .ToListAsync();

        return new RenewalsExpiryResponseDto
        {
            Summary = summary,
            Contracts = new PaginatedResult<ContractDto> { TotalCount = totalCount, Items = items }
        };
    }

    public async Task<ContractDto?> GetContractByIdAsync(int id)
    {
        var c = await _context.Contracts
            .Include(x => x.Party)
            .Include(x => x.Owner)
            .Include(x => x.OriginalContract)
            .Include(x => x.RenewalContracts)
            .FirstOrDefaultAsync(x => x.ContractId == id);
            
        if (c == null) return null;

        return new ContractDto
        {
            ContractId = c.ContractId,
            ContractNumber = c.ContractNumber,
            Title = c.Title,
            ContractType = c.ContractType,
            Description = c.Description,
            PartyId = c.PartyId,
            PartyName = c.Party.PartyName,
            PartyEmail = c.Party.Email,
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            ContractValue = c.ContractValue,
            Currency = c.Currency,
            OwnerId = c.OwnerId,
            OwnerName = c.Owner.FirstName + " " + c.Owner.LastName,
            Status = c.Status,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            OriginalContractId = c.OriginalContractId,
            OriginalContractNumber = c.OriginalContract?.ContractNumber,
            HasActiveRenewal = c.RenewalContracts.Any(r => r.Status != "Terminated" && r.Status != "Rejected")
        };
    }

    public async Task<ContractDto> CreateContractAsync(CreateContractDto dto, int currentUserId)
    {
        if (dto.EndDate <= dto.StartDate) throw new InvalidOperationException("End Date must be after Start Date.");
        if (dto.ContractValue < 0) throw new InvalidOperationException("Contract Value cannot be negative.");
        
        var party = await _context.ContractParties.FindAsync(dto.PartyId);
        if (party == null || party.Status != "Active") throw new InvalidOperationException("Party must be Active to create a contract.");

        var nextId = await _context.Contracts.MaxAsync(c => (int?)c.ContractId) ?? 0;
        var contractNumber = $"CTR-{DateTime.UtcNow:yyyyMMdd}-{(nextId + 1):D4}";

        var contract = new Contract
        {
            ContractNumber = contractNumber,
            Title = dto.Title,
            ContractType = dto.ContractType,
            Description = dto.Description,
            PartyId = dto.PartyId,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            ContractValue = dto.ContractValue,
            Currency = dto.Currency,
            OwnerId = dto.OwnerId,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };

        _context.Contracts.Add(contract);
        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Created", "Contracts", "Contract", contract.ContractId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", contract.ContractId.ToString(), "Contract Created", $"Draft contract created");

        return (await GetContractByIdAsync(contract.ContractId))!;
    }

    public async Task<ContractDto> UpdateContractAsync(int id, UpdateContractDto dto, int currentUserId)
    {
        var contract = await _context.Contracts.FindAsync(id);
        if (contract == null) throw new KeyNotFoundException("Contract not found");
        
        if (contract.Status != "Draft") throw new InvalidOperationException("Only Draft contracts can be freely edited.");
        if (dto.EndDate <= dto.StartDate) throw new InvalidOperationException("End Date must be after Start Date.");
        if (dto.ContractValue < 0) throw new InvalidOperationException("Contract Value cannot be negative.");

        contract.Title = dto.Title;
        contract.ContractType = dto.ContractType;
        contract.Description = dto.Description;
        contract.PartyId = dto.PartyId;
        contract.StartDate = dto.StartDate;
        contract.EndDate = dto.EndDate;
        contract.ContractValue = dto.ContractValue;
        contract.Currency = dto.Currency;
        contract.OwnerId = dto.OwnerId;
        contract.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditService.LogAuditAsync(currentUserId, "Updated", "Contracts", "Contract", contract.ContractId.ToString(), null, null, null);

        return (await GetContractByIdAsync(contract.ContractId))!;
    }

    public async Task<ContractDto> RenewContractAsync(int contractId, CreateRenewalDto dto, int currentUserId)
    {
        var originalContract = await _context.Contracts
            .Include(c => c.RenewalContracts)
            .FirstOrDefaultAsync(c => c.ContractId == contractId);

        if (originalContract == null) throw new KeyNotFoundException("Original contract not found.");
        
        // Ensure contract is eligible for renewal
        if (originalContract.Status == "Draft" || originalContract.Status == "Rejected" || originalContract.Status == "Terminated")
            throw new InvalidOperationException("Contract status is not eligible for renewal.");

        // Check for duplicate active renewal drafts
        if (originalContract.RenewalContracts.Any(r => r.Status != "Terminated" && r.Status != "Rejected"))
            throw new InvalidOperationException("An active renewal draft already exists for this contract.");

        if (dto.EndDate <= dto.StartDate) throw new InvalidOperationException("End Date must be after Start Date.");
        if (dto.ContractValue < 0) throw new InvalidOperationException("Contract Value cannot be negative.");

        var nextId = await _context.Contracts.MaxAsync(c => (int?)c.ContractId) ?? 0;
        var contractNumber = $"CTR-{DateTime.UtcNow:yyyyMMdd}-{(nextId + 1):D4}";

        var renewalContract = new Contract
        {
            ContractNumber = contractNumber,
            Title = originalContract.Title,
            ContractType = originalContract.ContractType,
            PartyId = originalContract.PartyId,
            OwnerId = originalContract.OwnerId,
            Status = "Draft",
            OriginalContractId = originalContract.ContractId,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            ContractValue = dto.ContractValue,
            Currency = dto.Currency,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };

        _context.Contracts.Add(renewalContract);
        await _context.SaveChangesAsync(); // Generates ContractId for sequence

        await _auditService.LogAuditAsync(currentUserId, "Renewal Started", "Contracts", "Contract", originalContract.ContractId.ToString(), null, null, null);
        await _auditService.LogAuditAsync(currentUserId, "Renewal Draft Created", "Contracts", "Contract", renewalContract.ContractId.ToString(), null, null, null);
        
        await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", originalContract.ContractId.ToString(), "Renewal Started", $"Renewal draft created: {renewalContract.ContractNumber}");
        await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", renewalContract.ContractId.ToString(), "Draft Created", $"Renewal draft created from original contract: {originalContract.ContractNumber}");

        return (await GetContractByIdAsync(renewalContract.ContractId))!;
    }

    public async Task SubmitForReviewAsync(int id, int currentUserId)
    {
        var contract = await _context.Contracts.FindAsync(id);
        if (contract == null) throw new KeyNotFoundException("Contract not found");
        if (contract.Status != "Draft") throw new InvalidOperationException("Only Draft contracts can be submitted for review.");

        contract.Status = "Under Review";
        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Submitted for Review", "Contracts", "Contract", contract.ContractId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", contract.ContractId.ToString(), "Submitted for Review", "Contract submitted for internal review");
    }

    public async Task SubmitForApprovalAsync(int id, int currentUserId)
    {
        var contract = await _context.Contracts.FindAsync(id);
        if (contract == null) throw new KeyNotFoundException("Contract not found");
        if (contract.Status != "Under Review") throw new InvalidOperationException("Only contracts Under Review can be submitted for approval.");

        contract.Status = "Pending Approval";
        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Approval Requested", "Contracts", "Contract", contract.ContractId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", contract.ContractId.ToString(), "Approval Requested", "Contract submitted for final approval");
        
        // Find managers who can approve (using RoleId = 4 or similar, for simplicity notifying Owner or hardcoded logic could be done, but let's notify a generic Approver or just the Owner for demo)
        await _notificationService.CreateNotificationAsync(new CreateNotificationDto { 
            RecipientUserId = contract.OwnerId, Type = "Approval", Priority = "High", Title = "Contract Approval Required", Message = $"Contract {contract.ContractNumber} is pending approval.", ReferenceType = "Contract", ReferenceId = contract.ContractId.ToString() 
        });
    }

    public async Task<PaginatedResult<ContractDto>> GetPendingApprovalsAsync(int currentUserId, int page, int pageSize, string? search, string? type, string? dateRange)
    {
        var query = _context.Contracts
            .Include(c => c.Party)
            .Include(c => c.Owner)
            .Where(c => c.Status == "Pending Approval")
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c => c.ContractNumber.Contains(search) || 
                                     c.Title.Contains(search) || 
                                     c.Party.PartyName.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(type) && type != "All")
        {
            query = query.Where(c => c.ContractType == type);
        }

        // Extremely simple date range filtering for demonstration. 
        // Example "Last 30 Days", etc.
        if (!string.IsNullOrWhiteSpace(dateRange) && dateRange != "All")
        {
            var now = DateTime.UtcNow;
            if (dateRange == "Next 30 Days") query = query.Where(c => c.StartDate <= now.AddDays(30) && c.StartDate >= now);
            if (dateRange == "Next 7 Days") query = query.Where(c => c.StartDate <= now.AddDays(7) && c.StartDate >= now);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.UpdatedAt ?? c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(c => new ContractDto
        {
            ContractId = c.ContractId,
            ContractNumber = c.ContractNumber,
            Title = c.Title,
            ContractType = c.ContractType,
            PartyId = c.PartyId,
            PartyName = c.Party?.PartyName ?? "",
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            ContractValue = c.ContractValue,
            Currency = c.Currency,
            OwnerId = c.OwnerId,
            OwnerName = c.Owner != null ? c.Owner.FirstName + " " + c.Owner.LastName : "",
            Status = c.Status,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        }).ToList();

        return new PaginatedResult<ContractDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task ApproveContractAsync(int id, ContractApprovalSubmitDto dto, int currentUserId)
    {
        var contract = await _context.Contracts.FindAsync(id);
        if (contract == null) throw new KeyNotFoundException("Contract not found");
        if (contract.Status != "Pending Approval") throw new InvalidOperationException("Contract is not pending approval.");
        if (contract.OwnerId == currentUserId) throw new InvalidOperationException("You cannot approve your own contract.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var approval = new ContractApproval
            {
                ContractId = contract.ContractId,
                ApproverId = currentUserId,
                Action = "Approve",
                Comment = dto.Comment,
                Date = DateTime.UtcNow,
                Status = "Completed"
            };
            _context.ContractApprovals.Add(approval);

            contract.Status = "Approved";
            
            // Evaluate if it should instantly become Active (Only if it's NOT a renewal that requires signature)
            if (!contract.OriginalContractId.HasValue && contract.StartDate <= DateTime.UtcNow && contract.EndDate > DateTime.UtcNow)
            {
                contract.Status = "Active";
            }

            await _context.SaveChangesAsync();

            await _auditService.LogAuditAsync(currentUserId, "Approved", "Contracts", "Contract", contract.ContractId.ToString(), null, null, null);
            await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", contract.ContractId.ToString(), "Approved", $"Contract approved by user. New status: {contract.Status}");
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto { 
                RecipientUserId = contract.OwnerId, Type = "Contract", Priority = "Normal", Title = "Contract Approved", Message = $"Contract {contract.ContractNumber} was approved.", ReferenceType = "Contract", ReferenceId = contract.ContractId.ToString() 
            });

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task RejectContractAsync(int id, ContractApprovalSubmitDto dto, int currentUserId)
    {
        var contract = await _context.Contracts.FindAsync(id);
        if (contract == null) throw new KeyNotFoundException("Contract not found");
        if (contract.Status != "Pending Approval" && contract.Status != "Under Review") throw new InvalidOperationException("Contract cannot be rejected from its current status.");
        if (contract.OwnerId == currentUserId) throw new InvalidOperationException("You cannot reject your own contract.");
        if (string.IsNullOrWhiteSpace(dto.Comment)) throw new InvalidOperationException("A rejection reason is required.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var approval = new ContractApproval
            {
                ContractId = contract.ContractId,
                ApproverId = currentUserId,
                Action = "Reject",
                Comment = dto.Comment,
                Date = DateTime.UtcNow,
                Status = "Completed"
            };
            _context.ContractApprovals.Add(approval);

            contract.Status = "Rejected";
            await _context.SaveChangesAsync();

            await _auditService.LogAuditAsync(currentUserId, "Rejected", "Contracts", "Contract", contract.ContractId.ToString(), null, null, null);
            await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", contract.ContractId.ToString(), "Rejected", $"Contract rejected: {dto.Comment}");
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto { 
                RecipientUserId = contract.OwnerId, Type = "Contract", Priority = "High", Title = "Contract Rejected", Message = $"Contract {contract.ContractNumber} was rejected.", ReferenceType = "Contract", ReferenceId = contract.ContractId.ToString() 
            });

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task TerminateContractAsync(int id, int currentUserId)
    {
        var contract = await _context.Contracts.FindAsync(id);
        if (contract == null) throw new KeyNotFoundException("Contract not found");
        if (contract.Status == "Draft" || contract.Status == "Under Review" || contract.Status == "Pending Approval") 
            throw new InvalidOperationException("Cannot terminate a contract that hasn't been active.");
        if (contract.Status == "Terminated") throw new InvalidOperationException("Contract is already terminated.");

        contract.Status = "Terminated";
        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Terminated", "Contracts", "Contract", contract.ContractId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", contract.ContractId.ToString(), "Terminated", "Contract was terminated.");
    }

    // ==== SIGNATURES ====

    public async Task<SigningRequestDto> SendForSignatureAsync(int id, SendForSignatureDto dto, int currentUserId)
    {
        var contract = await _context.Contracts
            .Include(c => c.OriginalContract)
            .Include(c => c.Party)
            .FirstOrDefaultAsync(c => c.ContractId == id);

        if (contract == null) throw new KeyNotFoundException("Contract not found");
        if (contract.Status != "Approved") throw new InvalidOperationException("Only Approved contracts can be sent for signature.");
        if (!contract.OriginalContractId.HasValue) throw new InvalidOperationException("Currently, only Renewal drafts support external signature.");
        if (string.IsNullOrWhiteSpace(contract.Party?.Email)) throw new InvalidOperationException("The associated Party does not have a registered email address.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Invalidate any existing pending requests for this contract
            var existingRequests = await _context.SigningRequests
                .Where(r => r.ContractId == id && r.Status == "Sent" || r.Status == "Viewed")
                .ToListAsync();

            foreach (var req in existingRequests)
            {
                req.Status = "Expired";
            }

            // Generate secure token (URL-safe, unguessable)
            var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");

            var signingRequest = new SigningRequest
            {
                ContractId = contract.ContractId,
                RecipientName = dto.RecipientName,
                RecipientEmail = dto.RecipientEmail,
                SecureToken = token,
                Status = "Sent",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.SigningRequests.Add(signingRequest);
            await _context.SaveChangesAsync();

            await _auditService.LogAuditAsync(currentUserId, "Signature Requested", "Contracts", "Contract", contract.ContractId.ToString(), null, null, null);
            await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", contract.ContractId.ToString(), "Signature Requested", $"Sent signing request to {dto.RecipientEmail}");
            
            await transaction.CommitAsync();

            return new SigningRequestDto
            {
                SigningRequestId = signingRequest.SigningRequestId,
                ContractId = signingRequest.ContractId,
                RecipientName = signingRequest.RecipientName,
                RecipientEmail = signingRequest.RecipientEmail,
                SecureToken = signingRequest.SecureToken,
                Status = signingRequest.Status,
                CreatedAt = signingRequest.CreatedAt,
                ExpiresAt = signingRequest.ExpiresAt
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<SigningRequestDto?> GetSigningRequestAsync(int contractId)
    {
        var req = await _context.SigningRequests
            .Where(r => r.ContractId == contractId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (req == null) return null;

        return new SigningRequestDto
        {
            SigningRequestId = req.SigningRequestId,
            ContractId = req.ContractId,
            RecipientName = req.RecipientName,
            RecipientEmail = req.RecipientEmail,
            SecureToken = req.SecureToken,
            Status = req.Status,
            CreatedAt = req.CreatedAt,
            ExpiresAt = req.ExpiresAt,
            ViewedAt = req.ViewedAt,
            SignedAt = req.SignedAt,
            DeclinedAt = req.DeclinedAt,
            DeclineReason = req.DeclineReason
        };
    }

    public async Task<SigningRequestDto?> GetActiveSigningRequestAsync(int contractId)
    {
        var req = await _context.SigningRequests
            .Where(r => r.ContractId == contractId && (r.Status == "Sent" || r.Status == "Viewed"))
            .FirstOrDefaultAsync();

        if (req == null) return null;

        return new SigningRequestDto
        {
            SigningRequestId = req.SigningRequestId,
            ContractId = req.ContractId,
            RecipientName = req.RecipientName,
            RecipientEmail = req.RecipientEmail,
            SecureToken = req.SecureToken,
            Status = req.Status,
            CreatedAt = req.CreatedAt,
            ExpiresAt = req.ExpiresAt,
            ViewedAt = req.ViewedAt
        };
    }

    // ==== OBLIGATIONS ====

    public async Task<List<ContractObligationDto>> GetObligationsAsync(int contractId)
    {
        var obs = await _context.ContractObligations
            .Include(o => o.Contract)
                .ThenInclude(c => c.Party)
            .Include(o => o.Owner)
            .Where(o => o.ContractId == contractId)
            .ToListAsync();

        return obs.Select(o => new ContractObligationDto
        {
            ObligationId = o.ObligationId,
            ContractId = o.ContractId,
            ContractNumber = o.Contract.ContractNumber,
            PartyName = o.Contract.Party != null ? o.Contract.Party.PartyName : "",
            Title = o.Title,
            Description = o.Description,
            DueDate = o.DueDate,
            OwnerId = o.OwnerId,
            OwnerName = o.Owner.FirstName + " " + o.Owner.LastName,
            Status = o.Status,
            Priority = o.Priority,
            CreatedAt = o.CreatedAt
        }).ToList();
    }

    public async Task<PaginatedResult<ContractObligationDto>> GetAllObligationsAsync(int page, int pageSize, string? search, string? status, string? priority, string? dateRange, int? contractId)
    {
        var today = DateTime.UtcNow.Date;

        var query = _context.ContractObligations
            .Include(o => o.Contract)
                .ThenInclude(c => c.Party)
            .Include(o => o.Owner)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(o => o.Title.Contains(search) || 
                                     o.Contract.ContractNumber.Contains(search) || 
                                     (o.Contract.Party != null && o.Contract.Party.PartyName.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "All Statuses")
        {
            if (status == "Overdue")
                query = query.Where(o => o.Status != "Completed" && o.DueDate.Date < today);
            else
                query = query.Where(o => o.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(priority) && priority != "All Priorities")
            query = query.Where(o => o.Priority == priority);

        if (contractId.HasValue && contractId.Value > 0)
            query = query.Where(o => o.ContractId == contractId.Value);

        if (!string.IsNullOrWhiteSpace(dateRange) && dateRange != "All Due Dates")
        {
            if (dateRange == "Overdue") query = query.Where(o => o.DueDate.Date < today && o.Status != "Completed");
            if (dateRange == "Due Today") query = query.Where(o => o.DueDate.Date == today);
            if (dateRange == "Due in 7 Days") query = query.Where(o => o.DueDate.Date >= today && o.DueDate.Date <= today.AddDays(7));
            if (dateRange == "Due in 30 Days") query = query.Where(o => o.DueDate.Date >= today && o.DueDate.Date <= today.AddDays(30));
            if (dateRange == "Future") query = query.Where(o => o.DueDate.Date > today);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(o => o.DueDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new ContractObligationDto
            {
                ObligationId = o.ObligationId,
                ContractId = o.ContractId,
                ContractNumber = o.Contract.ContractNumber,
                PartyName = o.Contract.Party != null ? o.Contract.Party.PartyName : "",
                Title = o.Title,
                Description = o.Description,
                DueDate = o.DueDate,
                OwnerId = o.OwnerId,
                OwnerName = o.Owner.FirstName + " " + o.Owner.LastName,
                Status = o.Status,
                EffectiveStatus = (o.Status != "Completed" && o.DueDate.Date < today) ? "Overdue" : o.Status,
                Priority = o.Priority,
                CreatedAt = o.CreatedAt
            })
            .ToListAsync();

        return new PaginatedResult<ContractObligationDto> { Items = items, TotalCount = totalCount };
    }

    public async Task<ObligationKpiDto> GetObligationKpisAsync()
    {
        var today = DateTime.UtcNow.Date;
        var query = _context.ContractObligations.AsQueryable();

        var total = await query.CountAsync();
        var pending = await query.CountAsync(o => o.Status == "Pending");
        
        var dueSoon = await query.CountAsync(o => 
            o.DueDate.Date >= today && 
            o.DueDate.Date <= today.AddDays(7) && 
            o.Status != "Completed");

        var overdue = await query.CountAsync(o => 
            o.DueDate.Date < today && 
            o.Status != "Completed");

        return new ObligationKpiDto
        {
            Total = total,
            Pending = pending,
            DueSoon = dueSoon,
            Overdue = overdue
        };
    }

    public async Task<ContractObligationDto> CreateObligationAsync(int contractId, CreateObligationDto dto, int currentUserId)
    {
        var contract = await _context.Contracts.FindAsync(contractId);
        if (contract == null) throw new KeyNotFoundException("Contract not found");

        var obligation = new ContractObligation
        {
            ContractId = contractId,
            Title = dto.Title,
            Description = dto.Description,
            DueDate = dto.DueDate,
            OwnerId = dto.OwnerId,
            Status = "Pending",
            Priority = dto.Priority,
            CreatedAt = DateTime.UtcNow
        };

        _context.ContractObligations.Add(obligation);
        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Created", "Contracts", "Obligation", obligation.ObligationId.ToString(), null, null, null);
        
        var newObs = await _context.ContractObligations
            .AsNoTracking()
            .Include(o => o.Contract)
                .ThenInclude(c => c.Party)
            .Include(o => o.Owner)
            .FirstOrDefaultAsync(o => o.ObligationId == obligation.ObligationId);
            
        return new ContractObligationDto
        {
            ObligationId = newObs.ObligationId,
            ContractId = newObs.ContractId,
            ContractNumber = newObs.Contract.ContractNumber,
            PartyName = newObs.Contract.Party != null ? newObs.Contract.Party.PartyName : "",
            Title = newObs.Title,
            Description = newObs.Description,
            DueDate = newObs.DueDate,
            OwnerId = newObs.OwnerId,
            OwnerName = newObs.Owner != null ? newObs.Owner.FirstName + " " + newObs.Owner.LastName : "",
            Status = newObs.Status,
            Priority = newObs.Priority,
            CreatedAt = newObs.CreatedAt
        };
    }

    public async Task<ContractObligationDto> UpdateObligationAsync(int obligationId, UpdateObligationDto dto, int currentUserId)
    {
        var obligation = await _context.ContractObligations.Include(o => o.Contract).FirstOrDefaultAsync(o => o.ObligationId == obligationId);
        if (obligation == null) throw new KeyNotFoundException("Obligation not found");

        obligation.Title = dto.Title;
        obligation.Description = dto.Description;
        obligation.DueDate = dto.DueDate;
        obligation.OwnerId = dto.OwnerId;
        obligation.Status = dto.Status;
        obligation.Priority = dto.Priority;
        obligation.UpdatedAt = DateTime.UtcNow;

        if (obligation.Status == "Completed")
        {
            await _auditService.LogAuditAsync(currentUserId, "Completed", "Contracts", "Obligation", obligation.ObligationId.ToString(), null, null, null);
            await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", obligation.ContractId.ToString(), "Obligation Completed", $"Obligation {obligation.Title} marked as completed.");
        }
        else if (obligation.Status == "Cancelled")
        {
            await _auditService.LogAuditAsync(currentUserId, "Cancelled", "Contracts", "Obligation", obligation.ObligationId.ToString(), null, null, null);
        }
        else
        {
            await _auditService.LogAuditAsync(currentUserId, "Updated", "Contracts", "Obligation", obligation.ObligationId.ToString(), null, null, null);
        }

        await _context.SaveChangesAsync();

        var updatedObs = await _context.ContractObligations
            .AsNoTracking()
            .Include(o => o.Contract)
                .ThenInclude(c => c.Party)
            .Include(o => o.Owner)
            .FirstOrDefaultAsync(o => o.ObligationId == obligation.ObligationId);

        return new ContractObligationDto
        {
            ObligationId = updatedObs.ObligationId,
            ContractId = updatedObs.ContractId,
            ContractNumber = updatedObs.Contract.ContractNumber,
            PartyName = updatedObs.Contract.Party != null ? updatedObs.Contract.Party.PartyName : "",
            Title = updatedObs.Title,
            Description = updatedObs.Description,
            DueDate = updatedObs.DueDate,
            OwnerId = updatedObs.OwnerId,
            OwnerName = updatedObs.Owner != null ? updatedObs.Owner.FirstName + " " + updatedObs.Owner.LastName : "",
            Status = updatedObs.Status,
            Priority = updatedObs.Priority,
            CreatedAt = updatedObs.CreatedAt
        };
    }

    public async Task CompleteObligationAsync(int id, int currentUserId)
    {
        var obligation = await _context.ContractObligations.FindAsync(id);
        if (obligation == null) throw new KeyNotFoundException("Obligation not found");
        if (obligation.Status == "Cancelled") throw new InvalidOperationException("Cannot complete a cancelled obligation.");

        obligation.Status = "Completed";
        obligation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Completed", "Contracts", "Obligation", obligation.ObligationId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", obligation.ContractId.ToString(), "Obligation Completed", $"Obligation {obligation.Title} marked as completed.");
    }

    public async Task CancelObligationAsync(int id, int currentUserId)
    {
        var obligation = await _context.ContractObligations.FindAsync(id);
        if (obligation == null) throw new KeyNotFoundException("Obligation not found");

        obligation.Status = "Cancelled";
        obligation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditService.LogAuditAsync(currentUserId, "Cancelled", "Contracts", "Obligation", obligation.ObligationId.ToString(), null, null, null);
        await _activityService.LogActivityAsync(currentUserId, "Contracts", "Contract", obligation.ContractId.ToString(), "Obligation Cancelled", $"Obligation {obligation.Title} cancelled.");
    }

    public async Task<List<ContractApprovalDto>> GetApprovalsAsync(int contractId)
    {
        var approvals = await _context.ContractApprovals
            .Include(a => a.Approver)
            .Where(a => a.ContractId == contractId)
            .OrderByDescending(a => a.Date)
            .ToListAsync();

        return approvals.Select(a => new ContractApprovalDto
        {
            ApprovalId = a.ApprovalId,
            ContractId = a.ContractId,
            ApproverId = a.ApproverId,
            ApproverName = a.Approver.FirstName + " " + a.Approver.LastName,
            Action = a.Action,
            Comment = a.Comment,
            Date = a.Date,
            Status = a.Status
        }).ToList();
    }
}
