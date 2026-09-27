using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Data;
using System.Data.Common;

namespace Backend.Services;

public class SupplierService : ISupplierService
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;

    public SupplierService(ApplicationDbContext context, IAuditService auditService, IActivityService activityService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
    }

    public async Task<(IEnumerable<SupplierResponseDto> Items, int TotalCount)> GetAllSuppliersAsync(int page, int pageSize, string? search, string? status)
    {
        var query = _context.Suppliers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(s => s.SupplierName.ToLower().Contains(search) || 
                                     s.SupplierCode.ToLower().Contains(search) ||
                                     (s.ContactPerson != null && s.ContactPerson.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(s => s.Status == status);
        }

        var totalCount = await query.CountAsync();
        
        var suppliers = await query
            .OrderBy(s => s.SupplierName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SupplierResponseDto
            {
                SupplierId = s.SupplierId,
                SupplierCode = s.SupplierCode,
                SupplierName = s.SupplierName,
                ContactPerson = s.ContactPerson,
                Email = s.Email,
                Phone = s.Phone,
                Address = s.Address,
                City = s.City,
                State = s.State,
                Country = s.Country,
                TaxNumber = s.TaxNumber,
                Status = s.Status,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync();

        return (suppliers, totalCount);
    }

    public async Task<SupplierResponseDto> GetSupplierByIdAsync(int id)
    {
        var s = await _context.Suppliers.FirstOrDefaultAsync(x => x.SupplierId == id);
        if (s == null)
            throw new KeyNotFoundException($"Supplier with ID {id} not found.");

        return new SupplierResponseDto
        {
            SupplierId = s.SupplierId,
            SupplierCode = s.SupplierCode,
            SupplierName = s.SupplierName,
            ContactPerson = s.ContactPerson,
            Email = s.Email,
            Phone = s.Phone,
            Address = s.Address,
            City = s.City,
            State = s.State,
            Country = s.Country,
            TaxNumber = s.TaxNumber,
            Status = s.Status,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt
        };
    }

    public async Task<SupplierResponseDto> CreateSupplierAsync(CreateSupplierDto dto, int userId, string? userIp)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            string generatedCode = "";
            var conn = _context.Database.GetDbConnection();
            if (conn.State != ConnectionState.Open) await conn.OpenAsync();
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "SELECT NEXT VALUE FOR SupplierCodeSeq;";
                cmd.Transaction = _context.Database.CurrentTransaction?.GetDbTransaction();
                var result = await cmd.ExecuteScalarAsync();
                int nextVal = Convert.ToInt32(result);
                generatedCode = $"SUPP-{nextVal:D4}";
            }

            var supplier = new Supplier
            {
                SupplierCode = generatedCode,
                SupplierName = dto.SupplierName,
                ContactPerson = dto.ContactPerson,
                Email = dto.Email,
                Phone = dto.Phone,
                Address = dto.Address,
                City = dto.City,
                State = dto.State,
                Country = dto.Country,
                TaxNumber = dto.TaxNumber,
                Status = dto.Status,
                CreatedAt = DateTime.UtcNow
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            await _auditService.LogAuditAsync(
                userId,
                "Supplier Created",
                "Inventory",
                "Supplier",
                supplier.SupplierCode,
                null,
                new { supplier.SupplierName, supplier.Status },
                userIp
            );

            await _activityService.LogActivityAsync(
                userId,
                "Inventory",
                "Supplier",
                supplier.SupplierId.ToString(),
                "Create",
                $"created supplier {supplier.SupplierCode}."
            );

            await transaction.CommitAsync();

            return await GetSupplierByIdAsync(supplier.SupplierId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<SupplierResponseDto> UpdateSupplierAsync(int id, UpdateSupplierDto dto, int userId, string? userIp)
    {
        using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.SupplierId == id);
            if (supplier == null)
                throw new KeyNotFoundException($"Supplier with ID {id} not found.");

            var oldValues = new { supplier.SupplierName, supplier.ContactPerson, supplier.Email, supplier.Status };

            supplier.SupplierName = dto.SupplierName;
            supplier.ContactPerson = dto.ContactPerson;
            supplier.Email = dto.Email;
            supplier.Phone = dto.Phone;
            supplier.Address = dto.Address;
            supplier.City = dto.City;
            supplier.State = dto.State;
            supplier.Country = dto.Country;
            supplier.TaxNumber = dto.TaxNumber;
            
            string action = "Supplier Updated";
            if (supplier.Status != dto.Status)
            {
                action = dto.Status == "Active" ? "Supplier Activated" : "Supplier Deactivated";
            }
            supplier.Status = dto.Status;
            supplier.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _auditService.LogAuditAsync(
                userId,
                action,
                "Inventory",
                "Supplier",
                supplier.SupplierCode,
                oldValues,
                new { supplier.SupplierName, supplier.ContactPerson, supplier.Email, supplier.Status },
                userIp
            );

            await _activityService.LogActivityAsync(
                userId,
                "Inventory",
                "Supplier",
                supplier.SupplierId.ToString(),
                "Update",
                $"updated supplier {supplier.SupplierCode}."
            );

            await transaction.CommitAsync();

            return await GetSupplierByIdAsync(supplier.SupplierId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
