using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Entities;

public class POApproval
{
    [Key]
    public int ApprovalId { get; set; }

    [Required]
    public int PurchaseOrderId { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;

    [Required]
    public int ApproverId { get; set; }
    public User Approver { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty; // Approve, Reject

    [MaxLength(1000)]
    public string? Comment { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
