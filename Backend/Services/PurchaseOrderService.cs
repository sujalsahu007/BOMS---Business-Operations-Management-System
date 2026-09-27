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

public class PurchaseOrderService : IPurchaseOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;
    private readonly INotificationService _notificationService;

    public PurchaseOrderService(
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

    public async Task<(IEnumerable<PurchaseOrderListDto> Items, int TotalCount)> GetAllAsync(
        string? search, string? status, int? supplierId, int? warehouseId, int page, int pageSize)
    {
        var query = _context.PurchaseOrders
            .Include(po => po.Supplier)
            .Include(po => po.Warehouse)
            .Include(po => po.Creator)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(po => 
                po.PONumber.ToLower().Contains(search) || 
                po.Supplier.SupplierName.ToLower().Contains(search) ||
                po.Supplier.SupplierCode.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(po => po.Status == status);
        }

        if (supplierId.HasValue)
        {
            query = query.Where(po => po.SupplierId == supplierId.Value);
        }

        if (warehouseId.HasValue)
        {
            query = query.Where(po => po.WarehouseId == warehouseId.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(po => po.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(po => new PurchaseOrderListDto
            {
                PurchaseOrderId = po.PurchaseOrderId,
                PONumber = po.PONumber,
                SupplierName = po.Supplier.SupplierName,
                WarehouseCode = po.Warehouse.WarehouseCode,
                OrderDate = po.OrderDate,
                ExpectedDeliveryDate = po.ExpectedDeliveryDate,
                GrandTotal = po.GrandTotal,
                Status = po.Status,
                ApprovalStatus = po.ApprovalStatus,
                CreatorName = po.Creator.FirstName + " " + po.Creator.LastName,
                CreatedAt = po.CreatedAt
            })
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<PurchaseOrderDto?> GetByIdAsync(int id)
    {
        var po = await _context.PurchaseOrders
            .Include(p => p.Supplier)
            .Include(p => p.Warehouse)
            .Include(p => p.Creator)
            .Include(p => p.Items)
                .ThenInclude(i => i.Product)
            .Include(p => p.Approvals)
                .ThenInclude(a => a.Approver)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PurchaseOrderId == id);

        if (po == null) return null;

        return new PurchaseOrderDto
        {
            PurchaseOrderId = po.PurchaseOrderId,
            PONumber = po.PONumber,
            SupplierId = po.SupplierId,
            SupplierName = po.Supplier.SupplierName,
            SupplierCode = po.Supplier.SupplierCode,
            WarehouseId = po.WarehouseId,
            WarehouseCode = po.Warehouse.WarehouseCode,
            OrderDate = po.OrderDate,
            ExpectedDeliveryDate = po.ExpectedDeliveryDate,
            Remarks = po.Remarks,
            Subtotal = po.Subtotal,
            Tax = po.Tax,
            Discount = po.Discount,
            GrandTotal = po.GrandTotal,
            Status = po.Status,
            ApprovalStatus = po.ApprovalStatus,
            CreatedBy = po.CreatedBy,
            CreatorName = po.Creator.FirstName + " " + po.Creator.LastName,
            CreatedAt = po.CreatedAt,
            UpdatedAt = po.UpdatedAt,
            Items = po.Items.Select(i => new PurchaseOrderItemDto
            {
                POItemId = i.POItemId,
                ProductId = i.ProductId,
                ProductName = i.Product.ProductName,
                SKU = i.Product.SKU,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                Tax = i.Tax,
                Discount = i.Discount,
                LineTotal = i.LineTotal,
                ReceivedQuantity = i.ReceivedQuantity
            }).ToList(),
            Approvals = po.Approvals.OrderByDescending(a => a.Timestamp).Select(a => new POApprovalDto
            {
                ApprovalId = a.ApprovalId,
                ApproverId = a.ApproverId,
                ApproverName = a.Approver.FirstName + " " + a.Approver.LastName,
                Action = a.Action,
                Comment = a.Comment,
                Timestamp = a.Timestamp
            }).ToList()
        };
    }

    public async Task<PurchaseOrderDto> CreateDraftAsync(CreatePurchaseOrderDto dto, int currentUserId)
    {
        var supplier = await _context.Suppliers.FindAsync(dto.SupplierId) 
            ?? throw new InvalidOperationException("Supplier not found.");
            
        if (supplier.Status != "Active")
            throw new InvalidOperationException("Cannot create PO for an inactive supplier.");

        var warehouse = await _context.Warehouses.FindAsync(dto.WarehouseId)
            ?? throw new InvalidOperationException("Warehouse not found.");

        if (warehouse.Status != WarehouseStatus.Active)
            throw new InvalidOperationException("Cannot create PO for an inactive warehouse.");

        var po = new PurchaseOrder
        {
            SupplierId = dto.SupplierId,
            WarehouseId = dto.WarehouseId,
            OrderDate = DateTime.UtcNow,
            ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
            Remarks = dto.Remarks,
            Status = "Draft",
            ApprovalStatus = "Pending",
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        decimal subtotal = 0;
        decimal totalTax = 0;
        decimal totalDiscount = 0;

        foreach (var itemDto in dto.Items)
        {
            var product = await _context.Products.FindAsync(itemDto.ProductId)
                ?? throw new InvalidOperationException($"Product ID {itemDto.ProductId} not found.");
            
            // Recompute values securely
            decimal lineSub = itemDto.Quantity * itemDto.UnitPrice;
            decimal lineTotal = lineSub + itemDto.Tax - itemDto.Discount;

            if (lineTotal < 0) lineTotal = 0;

            po.Items.Add(new PurchaseOrderItem
            {
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                Tax = itemDto.Tax,
                Discount = itemDto.Discount,
                LineTotal = lineTotal
            });

            subtotal += lineSub;
            totalTax += itemDto.Tax;
            totalDiscount += itemDto.Discount;
        }

        po.Subtotal = subtotal;
        po.Tax = totalTax;
        po.Discount = totalDiscount;
        po.GrandTotal = Math.Max(0, subtotal + totalTax - totalDiscount);

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.PurchaseOrders.Add(po);
            await _context.SaveChangesAsync(); // To generate PONumber via DB sequence

            await _activityService.LogActivityAsync(
                currentUserId, "Inventory", "PurchaseOrder", po.PONumber, 
                "Created", $"Created Purchase Order {po.PONumber} as Draft");
                
            await transaction.CommitAsync();
            
            var createdPo = await GetByIdAsync(po.PurchaseOrderId);
            return createdPo!;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<PurchaseOrderDto> UpdateDraftAsync(int id, UpdatePurchaseOrderDto dto, int currentUserId)
    {
        var po = await _context.PurchaseOrders
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.PurchaseOrderId == id);

        if (po == null) throw new InvalidOperationException("Purchase Order not found.");
        if (po.Status != "Draft") throw new InvalidOperationException("Only Draft purchase orders can be edited.");

        // Clear existing items
        _context.PurchaseOrderItems.RemoveRange(po.Items);
        po.Items.Clear();

        po.SupplierId = dto.SupplierId;
        po.WarehouseId = dto.WarehouseId;
        po.ExpectedDeliveryDate = dto.ExpectedDeliveryDate;
        po.Remarks = dto.Remarks;
        po.UpdatedAt = DateTime.UtcNow;

        decimal subtotal = 0;
        decimal totalTax = 0;
        decimal totalDiscount = 0;

        foreach (var itemDto in dto.Items)
        {
            var product = await _context.Products.FindAsync(itemDto.ProductId)
                ?? throw new InvalidOperationException($"Product ID {itemDto.ProductId} not found.");
            
            decimal lineSub = itemDto.Quantity * itemDto.UnitPrice;
            decimal lineTotal = lineSub + itemDto.Tax - itemDto.Discount;
            if (lineTotal < 0) lineTotal = 0;

            po.Items.Add(new PurchaseOrderItem
            {
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                Tax = itemDto.Tax,
                Discount = itemDto.Discount,
                LineTotal = lineTotal
            });

            subtotal += lineSub;
            totalTax += itemDto.Tax;
            totalDiscount += itemDto.Discount;
        }

        po.Subtotal = subtotal;
        po.Tax = totalTax;
        po.Discount = totalDiscount;
        po.GrandTotal = Math.Max(0, subtotal + totalTax - totalDiscount);

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.SaveChangesAsync();

            await _activityService.LogActivityAsync(
                currentUserId, "Inventory", "PurchaseOrder", po.PONumber, 
                "Updated", $"Updated Purchase Order {po.PONumber}");
                
            await transaction.CommitAsync();
            
            return (await GetByIdAsync(po.PurchaseOrderId))!;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> SubmitForApprovalAsync(int id, int currentUserId)
    {
        var po = await _context.PurchaseOrders
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.PurchaseOrderId == id);
        if (po == null) return false;

        if (po.Status != "Draft") 
            throw new InvalidOperationException("Only Draft purchase orders can be submitted.");

        if (!po.Items.Any())
            throw new InvalidOperationException("Purchase order must have at least one item.");

        po.Status = "Pending Approval";
        po.UpdatedAt = DateTime.UtcNow;

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.SaveChangesAsync();

            await _activityService.LogActivityAsync(
                currentUserId, "Inventory", "PurchaseOrder", po.PONumber, 
                "Submitted", $"Submitted Purchase Order {po.PONumber} for finance approval.");

            // Find users who can approve (have Inventory.Approve permission)
            var approvers = await _context.Users
                .Where(u => u.Status == UserStatus.Active && u.UserRoles.Any(ur => ur.Role.RolePermissions.Any(rp => rp.Permission.PermissionCode == "Inventory.Approve")))
                .ToListAsync();

            foreach (var approver in approvers)
            {
                // Don't notify the creator that they need to approve their own PO, since they can't.
                if (approver.UserId == currentUserId) continue;

                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    RecipientUserId = approver.UserId,
                    Type = "Approval",
                    Priority = "High",
                    Title = "PO Approval Required",
                    Message = $"Purchase Order {po.PONumber} requires your approval.",
                    ReferenceType = "PurchaseOrder",
                    ReferenceId = po.PONumber
                });
            }

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> ApprovePOAsync(int id, POApprovalRequestDto dto, int currentUserId)
    {
        var po = await _context.PurchaseOrders.FindAsync(id);
        if (po == null) return false;

        if (po.Status != "Pending Approval") 
            throw new InvalidOperationException("Purchase order is not pending approval.");


        po.Status = "Approved";
        po.ApprovalStatus = "Approved";
        po.UpdatedAt = DateTime.UtcNow;

        var approval = new POApproval
        {
            PurchaseOrderId = id,
            ApproverId = currentUserId,
            Action = "Approve",
            Comment = dto.Comment,
            Timestamp = DateTime.UtcNow
        };

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.POApprovals.Add(approval);
            await _context.SaveChangesAsync();

            await _activityService.LogActivityAsync(
                currentUserId, "Inventory", "PurchaseOrder", po.PONumber, 
                "Approved", $"Approved Purchase Order {po.PONumber}.");

            // Notify creator
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto
            {
                RecipientUserId = po.CreatedBy,
                Type = "Inventory",
                Priority = "Normal",
                Title = "PO Approved",
                Message = $"Purchase Order {po.PONumber} has been approved.",
                ReferenceType = "PurchaseOrder",
                ReferenceId = po.PONumber
            });

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> RejectPOAsync(int id, POApprovalRequestDto dto, int currentUserId)
    {
        var po = await _context.PurchaseOrders.FindAsync(id);
        if (po == null) return false;

        if (po.Status != "Pending Approval") 
            throw new InvalidOperationException("Purchase order is not pending approval.");

        if (string.IsNullOrWhiteSpace(dto.Comment))
            throw new InvalidOperationException("A reason is required when rejecting a purchase order.");

        po.Status = "Rejected";
        po.ApprovalStatus = "Rejected";
        po.UpdatedAt = DateTime.UtcNow;

        var approval = new POApproval
        {
            PurchaseOrderId = id,
            ApproverId = currentUserId,
            Action = "Reject",
            Comment = dto.Comment,
            Timestamp = DateTime.UtcNow
        };

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.POApprovals.Add(approval);
            await _context.SaveChangesAsync();

            await _activityService.LogActivityAsync(
                currentUserId, "Inventory", "PurchaseOrder", po.PONumber, 
                "Rejected", $"Rejected Purchase Order {po.PONumber}. Reason: {dto.Comment}");

            // Notify creator
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto
            {
                RecipientUserId = po.CreatedBy,
                Type = "Inventory",
                Priority = "High",
                Title = "PO Rejected",
                Message = $"Purchase Order {po.PONumber} was rejected. Reason: {dto.Comment}",
                ReferenceType = "PurchaseOrder",
                ReferenceId = po.PONumber
            });

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> CancelPOAsync(int id, int currentUserId)
    {
        var po = await _context.PurchaseOrders.FindAsync(id);
        if (po == null) return false;

        if (po.Status == "Cancelled" || po.Status == "FullyReceived") 
            throw new InvalidOperationException($"Purchase order cannot be cancelled from status: {po.Status}");

        po.Status = "Cancelled";
        po.UpdatedAt = DateTime.UtcNow;

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.SaveChangesAsync();

            await _activityService.LogActivityAsync(
                currentUserId, "Inventory", "PurchaseOrder", po.PONumber, 
                "Cancelled", $"Cancelled Purchase Order {po.PONumber}.");

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
