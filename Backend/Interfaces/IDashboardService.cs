using Backend.DTOs;

namespace Backend.Interfaces;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardDataAsync(int currentUserId);
}
