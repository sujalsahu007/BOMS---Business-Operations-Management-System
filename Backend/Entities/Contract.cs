using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class Contract
{
    [Key]
    public int ContractId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string ContractNumber { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string ContractType { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Description { get; set; }
    
    [Required]
    public int PartyId { get; set; }
    public ContractParty Party { get; set; } = null!;
    
    [Required]
    public DateTime StartDate { get; set; }
    
    [Required]
    public DateTime EndDate { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal ContractValue { get; set; }
    
    [MaxLength(10)]
    public string Currency { get; set; } = "USD";
    
    [Required]
    public int OwnerId { get; set; }
    public User Owner { get; set; } = null!;
    
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft"; // Draft, Under Review, Pending Approval, Approved, Active, Expiring Soon, Expired, Terminated, Rejected
    
    [Timestamp]
    public byte[]? RowVersion { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<ContractObligation> Obligations { get; set; } = new List<ContractObligation>();
    public ICollection<ContractApproval> Approvals { get; set; } = new List<ContractApproval>();
    public ICollection<ContractDocument> Documents { get; set; } = new List<ContractDocument>();
    
    public int? OriginalContractId { get; set; }
    
    [ForeignKey("OriginalContractId")]
    public Contract? OriginalContract { get; set; }
    
    [InverseProperty("OriginalContract")]
    public ICollection<Contract> RenewalContracts { get; set; } = new List<Contract>();
}
