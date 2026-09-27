using Backend.DTOs;

namespace Backend.Interfaces;

public interface IStockService
{
    Task<(IEnumerable<WarehouseStockDto> Items, int TotalCount)> GetStockOverviewAsync(StockOverviewQueryDto query);
    Task<(IEnumerable<InventoryTransactionDto> Items, int TotalCount)> GetTransactionsAsync(int? warehouseId, int? productId, int page = 1, int pageSize = 20);
    Task<WarehouseStockDto> InitializeStockAsync(InitializeStockDto request, int userId, string userIp);
    
    Task<StockTransferDto> CreateTransferAsync(TransferStockDto request, int userId, string userIp);
    Task<(IEnumerable<StockTransferDto> Items, int TotalCount)> GetTransfersAsync(int page = 1, int pageSize = 20);
    
    Task<StockAdjustmentDto> CreateAdjustmentAsync(AdjustStockDto request, int userId, string userIp);
    Task<(IEnumerable<StockAdjustmentDto> Items, int TotalCount)> GetAdjustmentsAsync(int page = 1, int pageSize = 20);
}
