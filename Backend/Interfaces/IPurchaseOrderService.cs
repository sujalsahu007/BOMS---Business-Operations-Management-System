using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Interfaces;

public interface IPurchaseOrderService
{
    Task<(IEnumerable<PurchaseOrderListDto> Items, int TotalCount)> GetAllAsync(
        string? search, 
        string? status, 
        int? supplierId, 
        int? warehouseId, 
        int page, 
        int pageSize);
        
    Task<PurchaseOrderDto?> GetByIdAsync(int id);
    
    Task<PurchaseOrderDto> CreateDraftAsync(CreatePurchaseOrderDto dto, int currentUserId);
    
    Task<PurchaseOrderDto> UpdateDraftAsync(int id, UpdatePurchaseOrderDto dto, int currentUserId);
    
    Task<bool> SubmitForApprovalAsync(int id, int currentUserId);
    
    Task<bool> ApprovePOAsync(int id, POApprovalRequestDto dto, int currentUserId);
    
    Task<bool> RejectPOAsync(int id, POApprovalRequestDto dto, int currentUserId);
    
    Task<bool> CancelPOAsync(int id, int currentUserId);
}
