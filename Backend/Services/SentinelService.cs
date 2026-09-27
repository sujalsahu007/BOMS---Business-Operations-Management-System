using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Backend.Authorization;
using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class SentinelService : ISentinelService
{
    private readonly ApplicationDbContext _db;
    private readonly IPermissionService _permissionService;

    public SentinelService(ApplicationDbContext db, IPermissionService permissionService)
    {
        _db = db;
        _permissionService = permissionService;
    }

    public async Task<SentinelDashboardDto> GetSentinelDashboardAsync(int userId, ClaimsPrincipal user)
    {
        var findings = new List<SentinelFindingDto>();

        var hasInventoryPerm = await _permissionService.HasPermissionAsync(userId, "Inventory.View");
        var hasContractPerm = await _permissionService.HasPermissionAsync(userId, "Contracts.View");

        var states = await _db.SentinelStates
            .Where(s => s.UserId == userId)
            .ToDictionaryAsync(s => s.FindingId, s => s);

        if (hasInventoryPerm)
        {
            var inventoryFindings = await GetInventoryFindingsAsync();
            findings.AddRange(inventoryFindings);
        }

        if (hasContractPerm)
        {
            var contractFindings = await GetContractFindingsAsync();
            findings.AddRange(contractFindings);
        }

        // Apply state
        foreach (var finding in findings)
        {
            if (states.TryGetValue(finding.Id, out var state))
            {
                finding.Status = state.Status;
            }
        }

        // Filter out resolved
        findings = findings.Where(f => f.Status != "Resolved").ToList();

        var dashboard = new SentinelDashboardDto
        {
            LastScanned = DateTime.UtcNow,
            SeverityCounts = new Dictionary<string, int>
            {
                { "Critical", findings.Count(f => f.Severity == "Critical") },
                { "High", findings.Count(f => f.Severity == "High") },
                { "Medium", findings.Count(f => f.Severity == "Medium") },
                { "Low", findings.Count(f => f.Severity == "Low") }
            },
            ModuleCounts = findings.GroupBy(f => f.Module).ToDictionary(g => g.Key, g => g.Count()),
            ImmediateAttention = findings.Where(f => f.Severity == "Critical").OrderByDescending(f => f.DetectedAt).ToList(),
            OtherItems = findings.Where(f => f.Severity != "Critical")
                .OrderBy(f => f.Severity == "High" ? 0 : f.Severity == "Medium" ? 1 : 2)
                .ThenByDescending(f => f.DetectedAt)
                .ToList()
        };

        return dashboard;
    }

    public async Task AcknowledgeFindingAsync(string findingId, int userId)
    {
        await UpdateStateAsync(findingId, userId, "Acknowledged");
    }

    public async Task ResolveFindingAsync(string findingId, int userId)
    {
        await UpdateStateAsync(findingId, userId, "Resolved");
    }

    private async Task UpdateStateAsync(string findingId, int userId, string status)
    {
        var state = await _db.SentinelStates.FirstOrDefaultAsync(s => s.UserId == userId && s.FindingId == findingId);
        if (state == null)
        {
            state = new SentinelState
            {
                UserId = userId,
                FindingId = findingId,
                Status = status
            };
            _db.SentinelStates.Add(state);
        }
        else
        {
            state.Status = status;
            state.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
    }

    private async Task<List<SentinelFindingDto>> GetInventoryFindingsAsync()
    {
        var findings = new List<SentinelFindingDto>();

        // Out of Stock
        var outOfStock = await _db.WarehouseStocks
            .Include(ws => ws.Product)
            .Where(ws => ws.AvailableQuantity <= 0)
            .ToListAsync();

        foreach (var item in outOfStock)
        {
            findings.Add(new SentinelFindingDto
            {
                Id = $"INV_OOS_{item.ProductId}_{item.WarehouseId}",
                Severity = "Critical",
                Module = "Inventory",
                Title = $"{item.Product.ProductName} is out of stock",
                Description = "Stock has reached zero for this product.",
                Metric = $"Current Stock: 0\nReorder Level: {item.ReorderLevel}",
                DetectedAt = DateTime.UtcNow,
                PrimaryAction = new SentinelActionDto { Label = "View Inventory", Url = "/app/inventory" }
            });
        }

        // Low Stock
        var lowStock = await _db.WarehouseStocks
            .Include(ws => ws.Product)
            .Where(ws => ws.AvailableQuantity > 0 && ws.ReorderLevel > 0 && ws.AvailableQuantity <= ws.ReorderLevel)
            .ToListAsync();

        foreach (var item in lowStock)
        {
            findings.Add(new SentinelFindingDto
            {
                Id = $"INV_LOW_{item.ProductId}_{item.WarehouseId}",
                Severity = "High",
                Module = "Inventory",
                Title = $"{item.Product.ProductName} is below reorder level",
                Description = "Stock has fallen below the configured reorder threshold.",
                Metric = $"Current Stock: {item.AvailableQuantity}\nReorder Level: {item.ReorderLevel}",
                DetectedAt = DateTime.UtcNow,
                PrimaryAction = new SentinelActionDto { Label = "View Inventory", Url = "/app/inventory" }
            });
        }

        return findings;
    }

    private async Task<List<SentinelFindingDto>> GetContractFindingsAsync()
    {
        var findings = new List<SentinelFindingDto>();
        var now = DateTime.UtcNow;

        var contracts = await _db.Contracts
            .Include(c => c.Party)
            .Where(c => c.Status == "Active" || c.Status == "Expiring Soon" || c.Status == "Under Review" || c.Status == "Pending Approval")
            .ToListAsync();

        foreach (var contract in contracts)
        {
            if (contract.Status == "Under Review" || contract.Status == "Pending Approval")
            {
                findings.Add(new SentinelFindingDto
                {
                    Id = $"CON_PENDING_{contract.ContractId}",
                    Severity = "High",
                    Module = "Contracts",
                    Title = "Contract requires approval",
                    Description = $"{contract.Title} is waiting for review or approval.",
                    Metric = $"Status: {contract.Status}\nParty: {contract.Party?.PartyName}",
                    DetectedAt = DateTime.UtcNow,
                    PrimaryAction = new SentinelActionDto { Label = "Review Contracts", Url = "/app/contracts" }
                });
                continue;
            }

            var daysRemaining = (contract.EndDate - now).TotalDays;

            if (daysRemaining < 0)
            {
                findings.Add(new SentinelFindingDto
                {
                    Id = $"CON_EXPIRED_{contract.ContractId}",
                    Severity = "Critical",
                    Module = "Contracts",
                    Title = $"{contract.Title} has expired",
                    Description = "This active contract has passed its end date.",
                    Metric = $"Expiry: {contract.EndDate:dd MMM yyyy}\nParty: {contract.Party?.PartyName}",
                    DetectedAt = DateTime.UtcNow,
                    PrimaryAction = new SentinelActionDto { Label = "View Contract", Url = "/app/contracts" }
                });
            }
            else if (daysRemaining <= 7)
            {
                findings.Add(new SentinelFindingDto
                {
                    Id = $"CON_EXPIRING_{contract.ContractId}",
                    Severity = "Critical",
                    Module = "Contracts",
                    Title = $"{contract.Title} expires in {(int)daysRemaining} days",
                    Description = "Review this contract immediately before expiry.",
                    Metric = $"Expiry: {contract.EndDate:dd MMM yyyy}\nParty: {contract.Party?.PartyName}",
                    DetectedAt = DateTime.UtcNow,
                    PrimaryAction = new SentinelActionDto { Label = "View Contract", Url = "/app/contracts" }
                });
            }
            else if (daysRemaining <= 15)
            {
                findings.Add(new SentinelFindingDto
                {
                    Id = $"CON_EXPIRING_{contract.ContractId}",
                    Severity = "High",
                    Module = "Contracts",
                    Title = $"{contract.Title} expires in {(int)daysRemaining} days",
                    Description = "Review this contract soon.",
                    Metric = $"Expiry: {contract.EndDate:dd MMM yyyy}\nParty: {contract.Party?.PartyName}",
                    DetectedAt = DateTime.UtcNow,
                    PrimaryAction = new SentinelActionDto { Label = "View Contract", Url = "/app/contracts" }
                });
            }
            else if (daysRemaining <= 30)
            {
                findings.Add(new SentinelFindingDto
                {
                    Id = $"CON_EXPIRING_{contract.ContractId}",
                    Severity = "Medium",
                    Module = "Contracts",
                    Title = $"{contract.Title} expires within a month",
                    Description = "Prepare for upcoming contract expiry.",
                    Metric = $"Expiry: {contract.EndDate:dd MMM yyyy}\nParty: {contract.Party?.PartyName}",
                    DetectedAt = DateTime.UtcNow,
                    PrimaryAction = new SentinelActionDto { Label = "View Contract", Url = "/app/contracts" }
                });
            }
        }

        return findings;
    }
}
