using System.Security.Claims;
using Backend.DTOs;

namespace Backend.Interfaces;

public interface ISentinelService
{
    Task<SentinelDashboardDto> GetSentinelDashboardAsync(int userId, ClaimsPrincipal user);
    Task AcknowledgeFindingAsync(string findingId, int userId);
    Task ResolveFindingAsync(string findingId, int userId);
}
