using Backend.DTOs;
using System.Threading.Tasks;

namespace Backend.Interfaces;

public interface IGoodsReceiptService
{
    Task<PaginatedResult<GoodsReceiptListDto>> GetGoodsReceiptsAsync(int page, int pageSize, string? search, string? status, int? warehouseId, DateTime? date);
    Task<GoodsReceiptDetailDto?> GetGoodsReceiptByIdAsync(int id);
    Task<PaginatedResult<EligiblePurchaseOrderDto>> GetEligiblePurchaseOrdersAsync(int page, int pageSize, string? search);
    Task<GoodsReceiptDetailDto> CreateGoodsReceiptAsync(CreateGoodsReceiptDto request, int currentUserId);
}
