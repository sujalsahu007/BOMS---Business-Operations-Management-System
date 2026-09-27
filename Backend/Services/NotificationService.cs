using Backend.Data;
using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedNotificationResponse> GetUserNotificationsAsync(int userId, int page, int pageSize, string? status, string? type, string? priority)
    {
        var query = _context.Notifications.Where(n => n.RecipientUserId == userId);

        if (!string.IsNullOrEmpty(status))
        {
            if (status.Equals("Unread", StringComparison.OrdinalIgnoreCase))
                query = query.Where(n => !n.IsRead);
            else if (status.Equals("Read", StringComparison.OrdinalIgnoreCase))
                query = query.Where(n => n.IsRead);
        }

        if (!string.IsNullOrEmpty(type))
            query = query.Where(n => n.Type.ToLower() == type.ToLower());

        if (!string.IsNullOrEmpty(priority))
            query = query.Where(n => n.Priority.ToLower() == priority.ToLower());

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto
            {
                NotificationId = n.NotificationId,
                Type = n.Type,
                Priority = n.Priority,
                Title = n.Title,
                Message = n.Message,
                ReferenceType = n.ReferenceType,
                ReferenceId = n.ReferenceId,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return new PaginatedNotificationResponse
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages
        };
    }

    public async Task<NotificationDto?> GetNotificationAsync(int notificationId, int userId)
    {
        var n = await _context.Notifications.FirstOrDefaultAsync(x => x.NotificationId == notificationId && x.RecipientUserId == userId);
        if (n == null) return null;
        return new NotificationDto
        {
            NotificationId = n.NotificationId,
            Type = n.Type,
            Priority = n.Priority,
            Title = n.Title,
            Message = n.Message,
            ReferenceType = n.ReferenceType,
            ReferenceId = n.ReferenceId,
            IsRead = n.IsRead,
            ReadAt = n.ReadAt,
            CreatedAt = n.CreatedAt
        };
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.RecipientUserId == userId && !n.IsRead);
    }

    public async Task MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.RecipientUserId == userId);
            
        if (notification == null)
            throw new Exception("Notification not found or access denied.");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => n.RecipientUserId == userId && !n.IsRead)
            .ToListAsync();

        if (unreadNotifications.Any())
        {
            var now = DateTime.UtcNow;
            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = now;
            }
            await _context.SaveChangesAsync();
        }
    }

    public async Task CreateNotificationAsync(CreateNotificationDto dto)
    {
        var notification = new Backend.Entities.Notification
        {
            RecipientUserId = dto.RecipientUserId,
            Type = dto.Type,
            Priority = dto.Priority,
            Title = dto.Title,
            Message = dto.Message,
            ReferenceType = dto.ReferenceType,
            ReferenceId = dto.ReferenceId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }
}
