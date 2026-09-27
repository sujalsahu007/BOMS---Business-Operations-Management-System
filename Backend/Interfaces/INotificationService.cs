using Backend.DTOs;

namespace Backend.Interfaces;

public interface INotificationService
{
    Task<PaginatedNotificationResponse> GetUserNotificationsAsync(int userId, int page, int pageSize, string? status, string? type, string? priority);
    Task<NotificationDto?> GetNotificationAsync(int notificationId, int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAsReadAsync(int notificationId, int userId);
    Task MarkAllAsReadAsync(int userId);
    Task CreateNotificationAsync(CreateNotificationDto dto);
}
