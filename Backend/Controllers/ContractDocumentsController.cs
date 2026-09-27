using Backend.Data;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Backend.Authorization;

namespace Backend.Controllers;

[ApiController]
[Route("api/contracts/{contractId}/documents")]
[Authorize]
public class ContractDocumentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IActivityService _activityService;
    private readonly IWebHostEnvironment _env;

    public ContractDocumentsController(ApplicationDbContext context, IActivityService activityService, IWebHostEnvironment env)
    {
        _context = context;
        _activityService = activityService;
        _env = env;
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out var id) ? id : 0;
    }

    [HttpGet]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetDocuments([FromRoute] int contractId)
    {
        var documents = await _context.ContractDocuments
            .Include(d => d.UploadedBy)
            .Where(d => d.ContractId == contractId)
            .OrderByDescending(d => d.UploadedAt)
            .Select(d => new
            {
                d.DocumentId,
                d.ContractId,
                d.FileName,
                d.FileType,
                d.FileSize,
                d.Version,
                d.UploadedById,
                UploadedByName = d.UploadedBy.FirstName + " " + d.UploadedBy.LastName,
                d.UploadedAt
            })
            .ToListAsync();

        return Ok(documents);
    }

    [HttpPost]
    [RequirePermission("Contracts.Edit")]
    public async Task<IActionResult> UploadDocument([FromRoute] int contractId, [FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        var contract = await _context.Contracts.FindAsync(contractId);
        if (contract == null)
            return NotFound(new { message = "Contract not found." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".pdf" && extension != ".doc" && extension != ".docx")
            return BadRequest(new { message = "Invalid file type. Only PDF and Word documents are allowed." });

        var folderName = Path.Combine("uploads", "contracts", contractId.ToString());
        var pathToSave = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), folderName);

        if (!Directory.Exists(pathToSave))
            Directory.CreateDirectory(pathToSave);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(pathToSave, fileName);
        var dbPath = Path.Combine(folderName, fileName).Replace("\\", "/");

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var nextVersion = await _context.ContractDocuments
            .Where(d => d.ContractId == contractId)
            .MaxAsync(d => (int?)d.Version) ?? 0;
        nextVersion++;

        var document = new ContractDocument
        {
            ContractId = contractId,
            FileName = file.FileName,
            FilePath = dbPath,
            FileType = file.ContentType,
            FileSize = file.Length,
            Version = nextVersion,
            UploadedById = GetCurrentUserId(),
            UploadedAt = DateTime.UtcNow
        };

        _context.ContractDocuments.Add(document);
        await _context.SaveChangesAsync();

        await _activityService.LogActivityAsync(GetCurrentUserId(), "Contracts", "Contract", contractId.ToString(), "Document Uploaded", $"Version {nextVersion} of document {file.FileName} uploaded.");

        return Ok(new
        {
            document.DocumentId,
            document.ContractId,
            document.FileName,
            document.Version,
            document.UploadedAt
        });
    }

    [HttpGet("download/{documentId}")]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> DownloadDocument([FromRoute] int contractId, [FromRoute] int documentId)
    {
        var document = await _context.ContractDocuments.FirstOrDefaultAsync(d => d.ContractId == contractId && d.DocumentId == documentId);
        if (document == null) return NotFound();

        var fullPath = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), document.FilePath);
        if (!System.IO.File.Exists(fullPath)) return NotFound(new { message = "File not found on disk." });

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
        return File(stream, document.FileType, document.FileName);
    }
}
