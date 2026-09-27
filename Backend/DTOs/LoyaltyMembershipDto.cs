using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.DTOs;

public class LoyaltyMembershipDto
{
    public int MembershipId { get; set; }
    
    // Customer/Party info
    public int PartyId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerCode { get; set; } = string.Empty;
    
    // Program info
    public int LoyaltyProgramId { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    
    // Tier info
    public int? TierId { get; set; }
    public string? TierName { get; set; }
    
    // Balances
    public decimal PointsBalance { get; set; }
    public decimal LifetimePoints { get; set; }
    
    // Metadata
    public string Status { get; set; } = string.Empty;
    public DateTime EnrolledAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateLoyaltyMembershipDto
{
    [Required]
    public int PartyId { get; set; }
    
    [Required]
    public int LoyaltyProgramId { get; set; }
}

// Simplified DTO for ContractParty when fetching valid customers for dropdowns
public class CustomerDropdownDto
{
    public int PartyId { get; set; }
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public string PartyType { get; set; } = string.Empty;
}
