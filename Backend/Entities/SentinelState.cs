using System;

namespace Backend.Entities;

public class SentinelState
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FindingId { get; set; } = string.Empty;
    public string Status { get; set; } = "Open"; // Open, Acknowledged, Resolved
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
