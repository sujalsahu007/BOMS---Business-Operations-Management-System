namespace Backend.Entities;

public class Activity
{
    public int ActivityId { get; set; }
    
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string Module { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public string? Metadata { get; set; }
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
