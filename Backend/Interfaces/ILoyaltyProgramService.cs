using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Interfaces;

public interface ILoyaltyProgramService
{
    Task<PaginatedResult<LoyaltyProgramDto>> GetProgramsAsync(string? search, string? status, int page, int pageSize);
    Task<LoyaltyProgramDto> GetProgramByIdAsync(int id);
    Task<LoyaltyProgramDto> CreateProgramAsync(CreateLoyaltyProgramDto dto, int currentUserId);
    Task<LoyaltyProgramDto> UpdateProgramAsync(int id, UpdateLoyaltyProgramDto dto, int currentUserId);
    Task ActivateProgramAsync(int id, int currentUserId);
    Task DeactivateProgramAsync(int id, int currentUserId);
    Task<LoyaltyProgramKpiDto> GetProgramKpisAsync();
}
