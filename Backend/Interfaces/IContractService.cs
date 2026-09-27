using System.Collections.Generic;
using System.Threading.Tasks;
using Backend.DTOs;
using Backend.Entities;

namespace Backend.Interfaces;

public interface IContractService
{
    // Dashboard
    Task<ContractDashboardDto> GetDashboardAsync();

    // Parties
    Task<PaginatedResult<ContractPartyDto>> GetPartiesAsync(int page, int pageSize, string? search, string? type);
    Task<ContractPartyDto> GetPartyByIdAsync(int id);
    Task<ContractPartyDto> CreatePartyAsync(CreateContractPartyDto dto, int currentUserId);
    Task<ContractPartyDto> UpdatePartyAsync(int id, UpdateContractPartyDto dto, int currentUserId);
    Task<bool> DeactivatePartyAsync(int id, int currentUserId);

    // ==== CONTRACTS ====
    Task<PaginatedResult<ContractDto>> GetContractsAsync(int page, int pageSize, string? search, string? status, string? type, int? partyId, int? ownerId);
    Task<RenewalsExpiryResponseDto> GetRenewalsExpiryAsync(int page, int pageSize, string? search, string? status, int? expiryWindowDays, int? partyId, int? ownerId, string? sortBy);
    Task<ContractDto?> GetContractByIdAsync(int id);
    Task<ContractDto> CreateContractAsync(CreateContractDto dto, int currentUserId);
    Task<ContractDto> UpdateContractAsync(int id, UpdateContractDto dto, int currentUserId);
    Task<ContractDto> RenewContractAsync(int contractId, CreateRenewalDto dto, int currentUserId);
    
    // Status Transitions
    Task SubmitForReviewAsync(int id, int currentUserId);
    Task SubmitForApprovalAsync(int id, int currentUserId);
    Task ApproveContractAsync(int id, ContractApprovalSubmitDto dto, int currentUserId);
    Task RejectContractAsync(int id, ContractApprovalSubmitDto dto, int currentUserId);
    Task TerminateContractAsync(int id, int currentUserId);
    
    // Signatures
    Task<SigningRequestDto> SendForSignatureAsync(int id, SendForSignatureDto dto, int currentUserId);
    Task<SigningRequestDto?> GetSigningRequestAsync(int contractId);
    Task<SigningRequestDto?> GetActiveSigningRequestAsync(int contractId);
    
    // Obligations
    Task<List<ContractObligationDto>> GetObligationsAsync(int contractId);
    Task<PaginatedResult<ContractObligationDto>> GetAllObligationsAsync(int page, int pageSize, string? search, string? status, string? priority, string? dateRange, int? contractId);
    Task<ObligationKpiDto> GetObligationKpisAsync();
    Task<ContractObligationDto> CreateObligationAsync(int contractId, CreateObligationDto dto, int currentUserId);
    Task<ContractObligationDto> UpdateObligationAsync(int obligationId, UpdateObligationDto dto, int currentUserId);
    Task CompleteObligationAsync(int id, int currentUserId);
    Task CancelObligationAsync(int id, int currentUserId);
    
    // Approvals History & Pending
    Task<List<ContractApprovalDto>> GetApprovalsAsync(int contractId);
    Task<PaginatedResult<ContractDto>> GetPendingApprovalsAsync(int currentUserId, int page, int pageSize, string? search, string? type, string? dateRange);
}
