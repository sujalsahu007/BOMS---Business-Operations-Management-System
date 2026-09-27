using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.DTOs;

namespace Backend.Interfaces;

public interface ILoyaltyMembershipService
{
    Task<(IEnumerable<LoyaltyMembershipDto> Items, int TotalCount)> GetMembershipsAsync(
        int page, int pageSize, string search, int? programId, int? tierId, string status);
        
    Task<LoyaltyMembershipDto?> GetMembershipByIdAsync(int id);
    
    Task<LoyaltyMembershipDto> EnrollCustomerAsync(CreateLoyaltyMembershipDto dto, int userId);
    
    Task<bool> ActivateMembershipAsync(int id, int userId);
    
    Task<bool> DeactivateMembershipAsync(int id, int userId);
    
    Task<object> GetMembershipKpisAsync();
    
    // Helper to get valid customers for the enrollment dropdown
    Task<IEnumerable<CustomerDropdownDto>> GetAvailableCustomersAsync(string search);
}
