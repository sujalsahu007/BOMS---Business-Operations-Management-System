using System.Threading.Tasks;
using Backend.DTOs;
using Backend.Entities;

namespace Backend.Interfaces;

public interface ILoyaltyRewardPromotionService
{
    // Rewards
    Task<PaginatedResult<LoyaltyReward>> GetRewardsAsync(RewardFilterDto filter);
    Task<LoyaltyReward> GetRewardByIdAsync(int id);
    Task<LoyaltyReward> CreateRewardAsync(CreateLoyaltyRewardDto dto, int userId);
    Task<LoyaltyReward> UpdateRewardAsync(int id, UpdateLoyaltyRewardDto dto, int userId);
    Task ActivateRewardAsync(int id, int userId);
    Task DeactivateRewardAsync(int id, int userId);
    Task<object> GetRewardKpisAsync();

    // Promotions
    Task<PaginatedResult<LoyaltyPromotion>> GetPromotionsAsync(PromotionFilterDto filter);
    Task<LoyaltyPromotion> GetPromotionByIdAsync(int id);
    Task<LoyaltyPromotion> CreatePromotionAsync(CreateLoyaltyPromotionDto dto, int userId);
    Task<LoyaltyPromotion> UpdatePromotionAsync(int id, UpdateLoyaltyPromotionDto dto, int userId);
    Task ActivatePromotionAsync(int id, int userId);
    Task DeactivatePromotionAsync(int id, int userId);
    Task<object> GetPromotionKpisAsync();
}
