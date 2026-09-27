namespace Backend.DTOs;

public class DashboardDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int TotalRoles { get; set; }
    public int UnreadNotifications { get; set; }

    public List<SystemActivityDto> RecentActivities { get; set; } = new();
    public UserOverviewDto UserOverview { get; set; } = new();
    public NotificationSummaryDto NotificationSummary { get; set; } = new();
    public SystemStatusDto SystemStatus { get; set; } = new();
}

public class SystemActivityDto
{
    public string User { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
}

public class UserOverviewDto
{
    public int Active { get; set; }
    public int Inactive { get; set; }
    public int Suspended { get; set; }
}

public class NotificationSummaryDto
{
    public int Unread { get; set; }
    public int Read { get; set; }
    public int Total { get; set; }
}

public class SystemStatusDto
{
    public string API { get; set; } = "Operational";
    public string Database { get; set; } = "Checking...";
    public string Authentication { get; set; } = "Operational";
}
