using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

// ==== PARTIES ====

public class ContractPartyDto
{
    public int PartyId { get; set; }
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public string PartyType { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? TaxNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int ActiveContractsCount { get; set; }
    public int TotalContractsCount { get; set; }
}

public class CreateContractPartyDto
{
    [Required] [MaxLength(200)] public string PartyName { get; set; } = string.Empty;
    [MaxLength(100)] public string PartyType { get; set; } = string.Empty;
    [MaxLength(100)] public string? ContactPerson { get; set; }
    [MaxLength(255)] public string? Email { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [MaxLength(500)] public string? Address { get; set; }
    [MaxLength(100)] public string? TaxNumber { get; set; }
    [Required] [MaxLength(50)] public string Status { get; set; } = "Active";
}

public class UpdateContractPartyDto : CreateContractPartyDto { }

// ==== CONTRACTS ====

public class ContractDto
{
    public int ContractId { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ContractType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int PartyId { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public string? PartyEmail { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal ContractValue { get; set; }
    public string Currency { get; set; } = string.Empty;
    public int OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    public int? OriginalContractId { get; set; }
    public string? OriginalContractNumber { get; set; }
    public bool HasActiveRenewal { get; set; }
    public string? RenewalStatus { get; set; }
}

public class CreateContractDto
{
    [Required] [MaxLength(255)] public string Title { get; set; } = string.Empty;
    [Required] [MaxLength(100)] public string ContractType { get; set; } = string.Empty;
    [MaxLength(2000)] public string? Description { get; set; }
    [Required] public int PartyId { get; set; }
    [Required] public DateTime StartDate { get; set; }
    [Required] public DateTime EndDate { get; set; }
    public decimal ContractValue { get; set; }
    [MaxLength(10)] public string Currency { get; set; } = "USD";
    [Required] public int OwnerId { get; set; }
}

public class UpdateContractDto : CreateContractDto { }

public class CreateRenewalDto
{
    [Required] public DateTime StartDate { get; set; }
    [Required] public DateTime EndDate { get; set; }
    public decimal ContractValue { get; set; }
    [MaxLength(10)] public string Currency { get; set; } = "USD";
    [MaxLength(2000)] public string? Description { get; set; }
}

// ==== OBLIGATIONS ====

public class ContractObligationDto
{
    public int ObligationId { get; set; }
    public int ContractId { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public int OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string EffectiveStatus { get; set; } = string.Empty;
}

public class ObligationKpiDto
{
    public int Total { get; set; }
    public int Pending { get; set; }
    public int DueSoon { get; set; }
    public int Overdue { get; set; }
}

public class CreateObligationDto
{
    [Required] [MaxLength(255)] public string Title { get; set; } = string.Empty;
    [MaxLength(2000)] public string? Description { get; set; }
    [Required] public DateTime DueDate { get; set; }
    [Required] public int OwnerId { get; set; }
    [Required] [MaxLength(50)] public string Priority { get; set; } = "Medium";
}

// ==== SIGNATURE ====

public class SigningRequestDto
{
    public int SigningRequestId { get; set; }
    public int ContractId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public string SecureToken { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? ViewedAt { get; set; }
    public DateTime? SignedAt { get; set; }
    public DateTime? DeclinedAt { get; set; }
    public string? DeclineReason { get; set; }
}

public class SendForSignatureDto
{
    [Required] [MaxLength(200)] public string RecipientName { get; set; } = string.Empty;
    [Required] [MaxLength(255)] [EmailAddress] public string RecipientEmail { get; set; } = string.Empty;
}

public class SignContractDto
{
    [Required] [MaxLength(200)] public string SignerName { get; set; } = string.Empty;
    [Required] [MaxLength(255)] [EmailAddress] public string SignerEmail { get; set; } = string.Empty;
    [Required] public bool ConfirmAcceptance { get; set; }
}

public class DeclineSignatureDto
{
    [Required] [MaxLength(1000)] public string Reason { get; set; } = string.Empty;
}

public class UpdateObligationDto
{
    [Required] [MaxLength(255)] public string Title { get; set; } = string.Empty;
    [MaxLength(2000)] public string? Description { get; set; }
    [Required] public DateTime DueDate { get; set; }
    [Required] public int OwnerId { get; set; }
    [Required] [MaxLength(50)] public string Status { get; set; } = string.Empty;
    [Required] [MaxLength(50)] public string Priority { get; set; } = string.Empty;
}

// ==== APPROVALS ====

public class ContractApprovalDto
{
    public int ApprovalId { get; set; }
    public int ContractId { get; set; }
    public int ApproverId { get; set; }
    public string ApproverName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public DateTime Date { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class ContractApprovalSubmitDto
{
    [MaxLength(1000)] public string? Comment { get; set; }
}

// ==== DASHBOARD ====

public class ContractDashboardDto
{
    public DashboardKpisDto Kpis { get; set; } = new();
    public Dictionary<string, int> StatusDistribution { get; set; } = new();
    public ExpiryOverviewDto ExpiryOverview { get; set; } = new();
    public ApprovalOverviewDto ApprovalOverview { get; set; } = new();
    public ObligationOverviewDto ObligationOverview { get; set; } = new();
    public List<ContractDto> RecentContracts { get; set; } = new();
    public List<ContractDto> ExpiringContracts { get; set; } = new();
}

public class DashboardKpisDto
{
    public int TotalContracts { get; set; }
    public int ActiveContracts { get; set; }
    public int PendingApproval { get; set; }
    public int ExpiringSoon { get; set; }
    public int Expired { get; set; }
    public int DraftContracts { get; set; }
}

public class ExpiryOverviewDto
{
    public int ExpiringIn7Days { get; set; }
    public int ExpiringIn30Days { get; set; }
    public int ExpiringIn60Days { get; set; }
    public int Expired { get; set; }
}

public class ApprovalOverviewDto
{
    public int PendingApprovals { get; set; }
    public int Approved { get; set; }
    public int Rejected { get; set; }
}

public class ObligationOverviewDto
{
    public int OpenObligations { get; set; }
    public int DueSoon { get; set; }
    public int Overdue { get; set; }
    public int Completed { get; set; }
}

public class RenewalsExpirySummaryDto
{
    public int ExpiringIn7Days { get; set; }
    public int ExpiringIn30Days { get; set; }
    public int ExpiringIn60Days { get; set; }
    public int Expired { get; set; }
}

public class RenewalsExpiryResponseDto
{
    public RenewalsExpirySummaryDto Summary { get; set; } = new();
    public PaginatedResult<ContractDto> Contracts { get; set; } = new();
}
