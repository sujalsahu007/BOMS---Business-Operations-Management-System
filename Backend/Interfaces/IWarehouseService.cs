using Backend.DTOs;

namespace Backend.Interfaces;

public interface IWarehouseService
{
    Task<(IEnumerable<WarehouseDto> Items, int TotalCount)> GetWarehousesAsync(string? search, string? status, int page = 1, int pageSize = 20);
    Task<WarehouseDetailDto?> GetWarehouseByIdAsync(int warehouseId);
    Task<WarehouseDto> CreateWarehouseAsync(CreateWarehouseDto request, int userId, string userIp);
    Task<WarehouseDto> UpdateWarehouseAsync(int warehouseId, UpdateWarehouseDto request, int userId, string userIp);
}
