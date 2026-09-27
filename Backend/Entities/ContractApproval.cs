using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Entities;

public class ContractApproval
{
    [Key]
    public int ApprovalId { get; set; }
    
    [Required]
    public int ContractId { get; set; }
    public Contract Contract { get; set; } = null!;
    
    [Required]
    public int ApproverId { get; set; }
    public User Approver { get; set; } = null!;
    
    [Required]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty; // Approve, Reject
    
    [MaxLength(1000)]
    public string? Comment { get; set; }
    
    public DateTime Date { get; set; } = DateTime.UtcNow;
    
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Completed";
}
