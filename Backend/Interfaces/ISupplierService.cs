using Backend.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Interfaces;

public interface ISupplierService
{
    Task<(IEnumerable<SupplierResponseDto> Items, int TotalCount)> GetAllSuppliersAsync(int page, int pageSize, string? search, string? status);
    Task<SupplierResponseDto> GetSupplierByIdAsync(int id);
    Task<SupplierResponseDto> CreateSupplierAsync(CreateSupplierDto dto, int userId, string? userIp);
    Task<SupplierResponseDto> UpdateSupplierAsync(int id, UpdateSupplierDto dto, int userId, string? userIp);
}
