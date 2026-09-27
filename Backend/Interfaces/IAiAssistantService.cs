using System.Security.Claims;
using Backend.DTOs;

namespace Backend.Interfaces;

public interface IAiAssistantService
{
    Task<AiResponseDto> ProcessQueryAsync(string query, int userId, ClaimsPrincipal user);
}
