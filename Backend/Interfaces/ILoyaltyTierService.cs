using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Interfaces;

public interface ILoyaltyTierService
{
    // Tiers
    Task<PaginatedResult<LoyaltyTierDto>> GetTiersAsync(TierFilterDto filter);
    Task<LoyaltyTierDto> GetTierByIdAsync(int id);
    Task<LoyaltyTierDto> CreateTierAsync(CreateLoyaltyTierDto createDto, int userId);
    Task<LoyaltyTierDto> UpdateTierAsync(int id, UpdateLoyaltyTierDto updateDto, int userId);
    Task ActivateTierAsync(int id, int userId);
    Task DeactivateTierAsync(int id, int userId);
    Task<LoyaltyTierKpiDto> GetTierKpisAsync();

    // Benefits
    Task<List<LoyaltyBenefitDto>> GetBenefitsByTierAsync(int tierId);
    Task<LoyaltyBenefitDto> CreateBenefitAsync(int tierId, CreateLoyaltyBenefitDto createDto, int userId);
    Task<LoyaltyBenefitDto> UpdateBenefitAsync(int id, UpdateLoyaltyBenefitDto updateDto, int userId);
    Task ActivateBenefitAsync(int id, int userId);
    Task DeactivateBenefitAsync(int id, int userId);
}
