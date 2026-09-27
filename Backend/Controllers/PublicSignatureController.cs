using Backend.Data;
using Backend.DTOs;
using Backend.Entities;
using Backend.Interfaces;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/public/signature")]
public class PublicSignatureController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IActivityService _activityService;
    private readonly INotificationService _notificationService;

    public PublicSignatureController(ApplicationDbContext context, IAuditService auditService, IActivityService activityService, INotificationService notificationService)
    {
        _context = context;
        _auditService = auditService;
        _activityService = activityService;
        _notificationService = notificationService;
    }

    [HttpGet("{token}")]
    public async Task<IActionResult> GetSignaturePage(string token)
    {
        var request = await _context.SigningRequests
            .Include(r => r.Contract)
            .ThenInclude(c => c.Party)
            .FirstOrDefaultAsync(r => r.SecureToken == token);

        if (request == null)
            return NotFound("Invalid signing token.");

        if (request.Status == "Expired")
            return BadRequest("This signing link has expired.");

        if (request.Status == "Signed" || request.Status == "Declined")
            return BadRequest("This document has already been processed.");

        if (request.ExpiresAt < DateTime.UtcNow)
        {
            request.Status = "Expired";
            await _context.SaveChangesAsync();
            return BadRequest("This signing link has expired.");
        }

        // Removed automatic Sent -> Viewed transition from GET to maintain REST purity and avoid false reads.
        
        // Return safe DTO for public view
        return Ok(new
        {
            ContractNumber = request.Contract.ContractNumber,
            Title = request.Contract.Title,
            PartyName = request.Contract.Party.PartyName,
            StartDate = request.Contract.StartDate,
            EndDate = request.Contract.EndDate,
            ContractValue = request.Contract.ContractValue,
            Currency = request.Contract.Currency,
            Description = request.Contract.Description,
            RecipientName = request.RecipientName,
            RecipientEmail = request.RecipientEmail,
            Status = request.Status
        });
    }

    [HttpPost("{token}/view")]
    public async Task<IActionResult> MarkSignatureViewed(string token)
    {
        var request = await _context.SigningRequests
            .Include(r => r.Contract)
            .FirstOrDefaultAsync(r => r.SecureToken == token);

        if (request == null || request.Status == "Expired" || request.Status == "Signed" || request.Status == "Declined")
            return Ok(); // Do nothing if invalid or already processed, keep it silent for the frontend.

        if (request.Status == "Sent")
        {
            request.Status = "Viewed";
            request.ViewedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            // Log as System user (userId = 0) since this is public
            await _auditService.LogAuditAsync(0, "Signing Page Viewed", "Contracts", "SigningRequest", request.SigningRequestId.ToString(), null, null, null);
            await _activityService.LogActivityAsync(request.Contract.OwnerId, "Contracts", "Contract", request.ContractId.ToString(), "Viewed", $"The signing page was viewed by {request.RecipientName}.");
        }

        return Ok();
    }

    [HttpPost("{token}/sign")]
    public async Task<IActionResult> SignContract(string token, [FromBody] SignContractDto dto)
    {
        var request = await _context.SigningRequests
            .Include(r => r.Contract)
            .ThenInclude(c => c.OriginalContract)
            .FirstOrDefaultAsync(r => r.SecureToken == token);

        if (request == null || (request.Status != "Sent" && request.Status != "Viewed"))
            return BadRequest("Invalid or expired signing token.");

        if (request.ExpiresAt < DateTime.UtcNow)
        {
            request.Status = "Expired";
            await _context.SaveChangesAsync();
            return BadRequest("This signing link has expired.");
        }

        if (dto.SignerEmail.Trim().ToLower() != request.RecipientEmail.Trim().ToLower())
        {
            return BadRequest("Signer email does not match the intended recipient.");
        }

        if (!dto.ConfirmAcceptance)
        {
            return BadRequest("You must explicitly confirm acceptance to sign.");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            request.Status = "Signed";
            request.SignedAt = DateTime.UtcNow;
            
            var renewal = request.Contract;
            renewal.Status = "Active";

            if (renewal.OriginalContract != null)
            {
                renewal.OriginalContract.Status = "Superseded";
            }

            await _context.SaveChangesAsync();

            await _auditService.LogAuditAsync(0, "Renewal Signed", "Contracts", "Contract", renewal.ContractId.ToString(), null, null, null);
            await _activityService.LogActivityAsync(renewal.OwnerId, "Contracts", "Contract", renewal.ContractId.ToString(), "Signed", $"Renewal contract was electronically signed by {dto.SignerName}.");
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto 
            {
                RecipientUserId = renewal.OwnerId,
                Type = "Contract",
                Priority = "High",
                Title = "Renewal Signed",
                Message = $"Contract {renewal.ContractNumber} has been signed and is now active.",
                ReferenceType = "Contract",
                ReferenceId = renewal.ContractId.ToString()
            });

            await transaction.CommitAsync();
            return Ok(new { message = "Successfully signed." });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    [HttpPost("{token}/decline")]
    public async Task<IActionResult> DeclineSignature(string token, [FromBody] DeclineSignatureDto dto)
    {
        var request = await _context.SigningRequests
            .Include(r => r.Contract)
            .FirstOrDefaultAsync(r => r.SecureToken == token);

        if (request == null || (request.Status != "Sent" && request.Status != "Viewed"))
            return BadRequest("Invalid or expired signing token.");

        if (string.IsNullOrWhiteSpace(dto.Reason))
            return BadRequest("Decline reason is required.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            request.Status = "Declined";
            request.DeclinedAt = DateTime.UtcNow;
            request.DeclineReason = dto.Reason;
            
            var renewal = request.Contract;
            renewal.Status = "Declined"; // Signature Declined

            await _context.SaveChangesAsync();

            await _auditService.LogAuditAsync(0, "Renewal Declined", "Contracts", "Contract", renewal.ContractId.ToString(), null, null, null);
            await _activityService.LogActivityAsync(renewal.OwnerId, "Contracts", "Contract", renewal.ContractId.ToString(), "Declined", $"Signature was declined. Reason: {dto.Reason}");
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto 
            {
                RecipientUserId = renewal.OwnerId,
                Type = "Contract",
                Priority = "High",
                Title = "Renewal Signature Declined",
                Message = $"Contract {renewal.ContractNumber} signature was declined.",
                ReferenceType = "Contract",
                ReferenceId = renewal.ContractId.ToString()
            });

            await transaction.CommitAsync();
            return Ok(new { message = "Successfully declined." });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
