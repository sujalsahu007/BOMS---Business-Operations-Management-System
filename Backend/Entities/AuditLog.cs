namespace Backend.Entities;

public class AuditLog
{
    public int AuditLogId { get; set; }
    
    // The user who performed the action (can be null if system action)
    public int? UserId { get; set; }
    public User? User { get; set; }

    public string Action { get; set; } = string.Empty; // e.g. "User Created", "Role Assigned"
    public string Module { get; set; } = string.Empty; // e.g. "Users", "Roles"
    public string EntityType { get; set; } = string.Empty; // e.g. "User", "Role"
    public string EntityId { get; set; } = string.Empty; // Store as string for flexibility

    public string? OldValues { get; set; } // JSON or simple string
    public string? NewValues { get; set; } // JSON or simple string
    public string? IpAddress { get; set; } // IpAddress

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
