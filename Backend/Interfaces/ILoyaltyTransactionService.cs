using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Interfaces;

public interface ILoyaltyTransactionService
{
    Task<PaginatedResult<LoyaltyTransactionDto>> GetTransactionsAsync(int page, int pageSize, string search, int? programId, string transactionType, string dateFilter);
    Task<LoyaltyTransactionDto> GetTransactionByIdAsync(int id);
    Task<LoyaltyTransactionDto> CreateTransactionAsync(CreateLoyaltyTransactionDto dto, int userId);
    Task<LoyaltyTransactionKpiDto> GetTransactionKpisAsync();
}
