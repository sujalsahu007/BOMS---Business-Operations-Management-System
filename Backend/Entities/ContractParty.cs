using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Entities;

public class ContractParty
{
    [Key]
    public int PartyId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string PartyCode { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(200)]
    public string PartyName { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string PartyType { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string? ContactPerson { get; set; }
    
    [MaxLength(255)]
    public string? Email { get; set; }
    
    [MaxLength(50)]
    public string? Phone { get; set; }
    
    [MaxLength(500)]
    public string? Address { get; set; }
    
    [MaxLength(100)]
    public string? TaxNumber { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Active"; // Active, Inactive
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
}
