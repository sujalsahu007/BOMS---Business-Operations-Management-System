using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class SigningRequest
{
    [Key]
    public int SigningRequestId { get; set; }
    
    [Required]
    public int ContractId { get; set; }
    
    public Contract Contract { get; set; } = null!;
    
    [Required]
    [MaxLength(200)]
    public string RecipientName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    [EmailAddress]
    public string RecipientEmail { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string SecureToken { get; set; } = string.Empty; // Unique secure token
    
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Sent"; // Sent, Viewed, Signed, Declined, Expired
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? ViewedAt { get; set; }
    public DateTime? SignedAt { get; set; }
    public DateTime? DeclinedAt { get; set; }
    
    [MaxLength(1000)]
    public string? DeclineReason { get; set; }
}
