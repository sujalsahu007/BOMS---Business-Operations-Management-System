using Backend.DTOs;
using Backend.Entities;

namespace Backend.Interfaces;

public interface IUserService
{
    Task<PaginatedResult<UserListDto>> GetUsersAsync(int page, int pageSize, string? search, UserStatus? status, int? roleId);
    Task<UserDetailDto?> GetUserByIdAsync(int id);
    Task<UserListDto> CreateUserAsync(CreateUserDto request, int currentUserId);
    Task<UserListDto> UpdateUserAsync(int id, UpdateUserDto request, int currentUserId);
    Task ChangeStatusAsync(int id, UserStatus newStatus, int currentUserId);
    Task ChangePasswordAsync(int id, string newPassword, int currentUserId);
    Task DeleteUserAsync(int id, int currentUserId);
}
