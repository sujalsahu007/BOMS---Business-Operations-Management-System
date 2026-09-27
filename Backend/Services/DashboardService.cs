using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto> GetDashboardDataAsync(int currentUserId)
    {
        var dto = new DashboardDto();

        // System Status (DB Check)
        try
        {
            await _context.Database.CanConnectAsync();
            dto.SystemStatus.Database = "Operational";
        }
        catch
        {
            dto.SystemStatus.Database = "Unavailable";
        }

        // KPIs
        dto.TotalUsers = await _context.Users.CountAsync();
        dto.ActiveUsers = await _context.Users.CountAsync(u => u.Status == UserStatus.Active);
        dto.TotalRoles = await _context.Roles.CountAsync(r => r.Status == RoleStatus.Active);
        dto.UnreadNotifications = await _context.Notifications.CountAsync(n => n.RecipientUserId == currentUserId && !n.IsRead);

        // User Overview
        dto.UserOverview = new UserOverviewDto
        {
            Active = dto.ActiveUsers,
            Inactive = await _context.Users.CountAsync(u => u.Status == UserStatus.Inactive),
            Suspended = await _context.Users.CountAsync(u => u.Status == UserStatus.Suspended)
        };

        // Notification Summary (for current user)
        var totalNotifications = await _context.Notifications.CountAsync(n => n.RecipientUserId == currentUserId);
        var unreadNotifications = dto.UnreadNotifications;
        dto.NotificationSummary = new NotificationSummaryDto
        {
            Unread = unreadNotifications,
            Read = totalNotifications - unreadNotifications,
            Total = totalNotifications
        };

        // Recent Activity
        var activities = await _context.Activities
            .Include(a => a.User)
            .OrderByDescending(a => a.Timestamp)
            .Take(10)
            .ToListAsync();

        dto.RecentActivities = activities.Select(a => new SystemActivityDto
        {
            User = $"{a.User.FirstName} {a.User.LastName}",
            Action = a.Description, // Using Description for dashboard as it's human-readable
            Module = a.Module,
            Time = GetTimeAgo(a.Timestamp)
        }).ToList();

        return dto;
    }

    private string GetTimeAgo(DateTime dateTime)
    {
        var timeSpan = DateTime.UtcNow - dateTime;

        if (timeSpan <= TimeSpan.FromSeconds(60))
            return "Just now";
        if (timeSpan <= TimeSpan.FromMinutes(60))
            return timeSpan.Minutes > 1 ? $"{timeSpan.Minutes} minutes ago" : "1 minute ago";
        if (timeSpan <= TimeSpan.FromHours(24))
            return timeSpan.Hours > 1 ? $"{timeSpan.Hours} hours ago" : "1 hour ago";
        if (timeSpan <= TimeSpan.FromDays(30))
            return timeSpan.Days > 1 ? $"{timeSpan.Days} days ago" : "1 day ago";
        if (timeSpan <= TimeSpan.FromDays(365))
            return timeSpan.Days > 30 ? $"{timeSpan.Days / 30} months ago" : "1 month ago";
        
        return timeSpan.Days > 365 ? $"{timeSpan.Days / 365} years ago" : "1 year ago";
    }
}
