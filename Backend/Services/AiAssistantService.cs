using System.Security.Claims;
using System.Text.RegularExpressions;
using Backend.Authorization;
using Backend.Data;
using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class AiAssistantService : IAiAssistantService
{
    private readonly IPermissionService _permissionService;
    private readonly IDashboardService _dashboardService;
    private readonly IContractService _contractService;
    private readonly ILoyaltyDashboardService _loyaltyDashboardService;
    private readonly ISentinelService _sentinelService;
    private readonly ApplicationDbContext _db;

    public AiAssistantService(
        IPermissionService permissionService,
        IDashboardService dashboardService,
        IContractService contractService,
        ILoyaltyDashboardService loyaltyDashboardService,
        ISentinelService sentinelService,
        ApplicationDbContext db)
    {
        _permissionService = permissionService;
        _dashboardService = dashboardService;
        _contractService = contractService;
        _loyaltyDashboardService = loyaltyDashboardService;
        _sentinelService = sentinelService;
        _db = db;
    }

    public async Task<AiResponseDto> ProcessQueryAsync(string query, int userId, ClaimsPrincipal user)
    {
        var q = query.ToLowerInvariant();

        if (MatchesAny(q, "purchase order", " po ", "pos", "procurement"))
            return await HandlePurchaseOrdersAsync(q, userId);

        if (MatchesAny(q, "supplier", "vendor"))
            return await HandleSuppliersAsync(q, userId);

        if (MatchesAny(q, "security", "sentinel", "alert", "finding", "attention"))
            return await HandleSentinelAsync(q, userId, user);

        if (MatchesAny(q, "audit", "happened", "recent activity", "recently"))
            return await HandleAuditAsync(q, userId);

        if (MatchesAny(q, "inventory", "stock", "product", "item"))
            return await HandleInventoryAsync(q, userId);

        if (MatchesAny(q, "contract", "expir", "approv", "review", "pending"))
            return await HandleContractsAsync(q, userId);

        if (MatchesAny(q, "loyalty", "member", "point", "program"))
            return await HandleLoyaltyAsync(q, userId);

        if (MatchesAny(q, "overview", "summary", "status", "business"))
            return await HandleOverviewAsync(q, userId);

        // Fallback
        return new AiResponseDto
        {
            Text = "Hi! I am your BOMS AI Assistant. How may I assist you today?"
        };
    }

    private bool MatchesAny(string input, params string[] keywords)
    {
        return keywords.Any(k => input.Contains(k));
    }

    private AiResponseDto PermissionDenied()
    {
        return new AiResponseDto { Text = "You don't have permission to view this information." };
    }

    // --- DOMAIN HANDLERS ---

    private async Task<AiResponseDto> HandlePurchaseOrdersAsync(string q, int userId)
    {
        if (!await _permissionService.HasPermissionAsync(userId, "PurchaseOrders.View"))
            return PermissionDenied();

        var total = await _db.PurchaseOrders.CountAsync();
        var pending = await _db.PurchaseOrders.CountAsync(po => po.ApprovalStatus == "Pending");
        var approved = await _db.PurchaseOrders.CountAsync(po => po.ApprovalStatus == "Approved");
        var completed = await _db.PurchaseOrders.CountAsync(po => po.Status == "FullyReceived");

        var visuals = new List<AiVisualDto>();

        if (q.Contains("which") || q.Contains("show") || q.Contains("what") || q.Contains("list"))
        {
            if (q.Contains("pending"))
            {
                var pendingList = await _db.PurchaseOrders.Where(po => po.ApprovalStatus == "Pending").Select(po => po.PONumber).Take(5).ToListAsync();
                visuals.Add(new AiVisualDto { Type = "list", Title = "Pending Purchase Orders", Items = pendingList.Any() ? pendingList : new List<string> { "None" } });
                return new AiResponseDto
                {
                    Text = $"There are {pending} pending purchase orders. Here are the top ones:",
                    Visuals = visuals,
                    Action = new AiActionDto { Label = "View Purchase Orders", Url = "/app/procurement" }
                };
            }
        }

        visuals.Add(new AiVisualDto
        {
            Type = "list",
            Title = "Purchase Order Summary",
            Items = new List<string> { $"Total: {total}", $"Pending: {pending}", $"Approved: {approved}", $"Completed: {completed}" }
        });

        return new AiResponseDto
        {
            Text = $"You have {total} total purchase orders. {pending} are currently pending approval, and {approved} are approved.",
            Visuals = visuals,
            Action = new AiActionDto { Label = "View Purchase Orders", Url = "/app/procurement" }
        };
    }

    private async Task<AiResponseDto> HandleSuppliersAsync(string q, int userId)
    {
        if (!await _permissionService.HasPermissionAsync(userId, "Suppliers.View"))
            return PermissionDenied();

        var total = await _db.Suppliers.CountAsync();
        var active = await _db.Suppliers.CountAsync(s => s.Status == "Active");

        var visuals = new List<AiVisualDto>();

        if (q.Contains("which") || q.Contains("show") || q.Contains("what") || q.Contains("list"))
        {
            var activeList = await _db.Suppliers.Where(s => s.Status == "Active").Select(s => s.SupplierName).Take(5).ToListAsync();
            visuals.Add(new AiVisualDto { Type = "list", Title = "Active Suppliers", Items = activeList.Any() ? activeList : new List<string> { "None" } });
            return new AiResponseDto
            {
                Text = $"Here are some of your {active} active suppliers:",
                Visuals = visuals,
                Action = new AiActionDto { Label = "View Suppliers", Url = "/app/procurement/suppliers" }
            };
        }

        visuals.Add(new AiVisualDto { Type = "kpi", Title = "Supplier Metrics", Items = new List<string> { $"Total: {total}", $"Active: {active}" } });

        return new AiResponseDto
        {
            Text = $"You have {active} active suppliers out of {total} total suppliers registered in the system.",
            Visuals = visuals,
            Action = new AiActionDto { Label = "View Suppliers", Url = "/app/procurement/suppliers" }
        };
    }

    private async Task<AiResponseDto> HandleAuditAsync(string q, int userId)
    {
        // Require Dashboard or admin perms. Dashboard is generic enough.
        if (!await _permissionService.HasPermissionAsync(userId, "Dashboard.View"))
            return PermissionDenied();

        var recentLogs = await _db.AuditLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.Timestamp)
            .Take(5)
            .ToListAsync();

        var visuals = new List<AiVisualDto>();
        var items = recentLogs.Select(a => $"{(a.User != null ? a.User.Username : "System")}: {a.Action} ({a.Module})").ToList();
        
        visuals.Add(new AiVisualDto { Type = "list", Title = "Recent Audit Activity", Items = items.Any() ? items : new List<string> { "No recent activity." } });

        return new AiResponseDto
        {
            Text = "Here are the most recent activities recorded in the system audit logs.",
            Visuals = visuals
        };
    }

    private async Task<AiResponseDto> HandleSentinelAsync(string q, int userId, ClaimsPrincipal user)
    {
        var dashboard = await _sentinelService.GetSentinelDashboardAsync(userId, user);

        var critical = dashboard.SeverityCounts.GetValueOrDefault("Critical", 0);
        var high = dashboard.SeverityCounts.GetValueOrDefault("High", 0);

        var visuals = new List<AiVisualDto>();

        if (q.Contains("critical") || q.Contains("high") || q.Contains("show") || q.Contains("attention"))
        {
            var items = dashboard.ImmediateAttention.Take(5).Select(f => $"{f.Severity}: {f.Title}").ToList();
            visuals.Add(new AiVisualDto { Type = "list", Title = "Attention Items", Items = items.Any() ? items : new List<string> { "No critical items." } });
        }
        else
        {
            visuals.Add(new AiVisualDto { Type = "list", Title = "Sentinel Overview", Items = new List<string> { $"Critical: {critical}", $"High: {high}" } });
        }

        return new AiResponseDto
        {
            Text = $"Sentinel is actively monitoring your ERP. You currently have {critical} critical and {high} high-severity findings that require attention.",
            Visuals = visuals,
            Action = new AiActionDto { Label = "Go to Sentinel", Url = "/app/sentinel" }
        };
    }

    private async Task<AiResponseDto> HandleInventoryAsync(string q, int userId)
    {
        if (!await _permissionService.HasPermissionAsync(userId, "Inventory.View"))
            return PermissionDenied();

        var outOfStock = await _db.WarehouseStocks.CountAsync(x => x.AvailableQuantity == 0);
        var lowStock = await _db.WarehouseStocks.CountAsync(x => x.AvailableQuantity > 0 && x.ReorderLevel > 0 && x.AvailableQuantity <= x.ReorderLevel);
        var totalProducts = await _db.Products.CountAsync();

        var visuals = new List<AiVisualDto>();
        
        if (q.Contains("out of stock") || q.Contains("low"))
        {
            var outOfStockList = await _db.WarehouseStocks.Include(x => x.Product)
                .Where(x => x.AvailableQuantity == 0).Select(x => x.Product.ProductName).Take(5).ToListAsync();
            var lowStockList = await _db.WarehouseStocks.Include(x => x.Product)
                .Where(x => x.AvailableQuantity > 0 && x.ReorderLevel > 0 && x.AvailableQuantity <= x.ReorderLevel).Select(x => x.Product.ProductName).Take(5).ToListAsync();

            if (q.Contains("which") || q.Contains("show") || q.Contains("what"))
            {
                if (q.Contains("out of stock"))
                    visuals.Add(new AiVisualDto { Type = "list", Title = "Out of Stock Items", Items = outOfStockList.Any() ? outOfStockList : new List<string> { "None" } });
                else
                    visuals.Add(new AiVisualDto { Type = "list", Title = "Low Stock Items", Items = lowStockList.Any() ? lowStockList : new List<string> { "None" } });
            }
            else
            {
                visuals.Add(new AiVisualDto { Type = "kpi", Title = "Stock Alerts", Items = new List<string> { $"Out of Stock: {outOfStock}", $"Low Stock: {lowStock}" } });
            }

            return new AiResponseDto
            {
                Text = $"You have {outOfStock} items out of stock and {lowStock} items running low.",
                Visuals = visuals,
                Action = new AiActionDto { Label = "View Inventory", Url = "/app/inventory" }
            };
        }
        
        return new AiResponseDto
        {
            Text = $"Your inventory currently tracks {totalProducts} total products. {outOfStock} items are out of stock, and {lowStock} are low on stock.",
            Visuals = new List<AiVisualDto>
            {
                new AiVisualDto { Type = "list", Title = "Inventory Summary", Items = new List<string> { $"Total Products: {totalProducts}", $"Out of Stock: {outOfStock}", $"Low Stock: {lowStock}" } }
            },
            Action = new AiActionDto { Label = "View Inventory", Url = "/app/inventory" }
        };
    }

    private async Task<AiResponseDto> HandleContractsAsync(string q, int userId)
    {
        if (!await _permissionService.HasPermissionAsync(userId, "Contracts.View"))
            return PermissionDenied();

        var data = await _contractService.GetDashboardAsync();
        var active = data.Kpis.ActiveContracts;
        var expiringDate = DateTime.UtcNow.AddDays(30);
        var expiringReal = await _db.Contracts.CountAsync(c => c.Status == "Active" && c.EndDate <= expiringDate);
        var pending = await _db.Contracts.CountAsync(c => c.Status == "Under Review");
        
        if (q.Contains("expir"))
        {
            var visuals = new List<AiVisualDto>();
            if (q.Contains("which") || q.Contains("show") || q.Contains("what"))
            {
                var expiringList = await _db.Contracts.Where(c => c.Status == "Active" && c.EndDate <= expiringDate).Select(c => c.Title).Take(5).ToListAsync();
                visuals.Add(new AiVisualDto { Type = "list", Title = "Expiring Contracts", Items = expiringList.Any() ? expiringList : new List<string> { "None" } });
            }
            else
            {
                visuals.Add(new AiVisualDto { Type = "kpi", Title = "Expiring Contracts", Items = new List<string> { expiringReal.ToString() } });
            }

            return new AiResponseDto
            {
                Text = $"{expiringReal} contract{(expiringReal == 1 ? " is" : "s are")} expiring soon (within 30 days).",
                Visuals = visuals,
                Action = new AiActionDto { Label = "View Contracts", Url = "/app/contracts" }
            };
        }

        if (q.Contains("review") || q.Contains("pending") || q.Contains("approv"))
        {
            var visuals = new List<AiVisualDto>();
            if (q.Contains("which") || q.Contains("show") || q.Contains("what"))
            {
                var pendingList = await _db.Contracts.Where(c => c.Status == "Under Review").Select(c => c.Title).Take(5).ToListAsync();
                visuals.Add(new AiVisualDto { Type = "list", Title = "Pending Contracts", Items = pendingList.Any() ? pendingList : new List<string> { "None" } });
            }

            return new AiResponseDto
            {
                Text = $"You have {pending} contract{(pending == 1 ? "" : "s")} pending approval or under review.",
                Visuals = visuals,
                Action = new AiActionDto { Label = "Review Contracts", Url = "/app/contracts" }
            };
        }

        return new AiResponseDto
        {
            Text = $"You currently have {active} active contracts. {expiringReal} will expire within the next 30 days, and {pending} are under review.",
            Visuals = new List<AiVisualDto>
            {
                new AiVisualDto { Type = "list", Title = "Contract Overview", Items = new List<string> { $"Active: {active}", $"Expiring Soon: {expiringReal}", $"Under Review: {pending}" } }
            },
            Action = new AiActionDto { Label = "View Contracts", Url = "/app/contracts" }
        };
    }

    private async Task<AiResponseDto> HandleLoyaltyAsync(string q, int userId)
    {
        if (!await _permissionService.HasPermissionAsync(userId, "Loyalty.View"))
            return PermissionDenied();

        var data = await _loyaltyDashboardService.GetDashboardSummaryAsync();
        var members = data.Kpis.ActiveMembers;
        var activePrograms = data.Kpis.ActivePrograms;
        var pointsEarned = data.Kpis.PointsEarnedAllTime;

        var visuals = new List<AiVisualDto>();
        if (q.Contains("which") || q.Contains("show") || q.Contains("what"))
        {
            var programList = data.ProgramPerformance.Select(p => p.ProgramName).Take(5).ToList();
            visuals.Add(new AiVisualDto { Type = "list", Title = "Active Programs", Items = programList.Any() ? programList : new List<string> { "None" } });
        }
        else
        {
            visuals.Add(new AiVisualDto { Type = "list", Title = "Loyalty Metrics", Items = new List<string> { $"Active Members: {members}", $"Active Programs: {activePrograms}", $"Points Earned: {pointsEarned}" } });
        }

        return new AiResponseDto
        {
            Text = $"You have {members} active loyalty members across {activePrograms} active programs. A total of {pointsEarned} points have been earned all-time.",
            Visuals = visuals,
            Action = new AiActionDto { Label = "View Loyalty", Url = "/app/loyalty" }
        };
    }

    private async Task<AiResponseDto> HandleOverviewAsync(string q, int userId)
    {
        if (!await _permissionService.HasPermissionAsync(userId, "Dashboard.View"))
            return PermissionDenied();

        var data = await _dashboardService.GetDashboardDataAsync(userId);
        return new AiResponseDto
        {
            Text = $"BOMS is fully operational. You have {data.ActiveUsers} active users, {data.TotalRoles} configured roles, and {data.UnreadNotifications} unread notifications.",
            Visuals = new List<AiVisualDto>
            {
                new AiVisualDto { Type = "list", Title = "System Overview", Items = new List<string> { $"Active Users: {data.ActiveUsers}", $"Unread Notifications: {data.UnreadNotifications}", $"System API: {data.SystemStatus.API}" } }
            },
            Action = new AiActionDto { Label = "View Dashboard", Url = "/app/dashboard" }
        };
    }
}
