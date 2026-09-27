using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Backend.Authorization;
using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/loyalty/transactions")]
[Authorize]
public class LoyaltyTransactionsController : ControllerBase
{
    private readonly ILoyaltyTransactionService _service;

    public LoyaltyTransactionsController(ILoyaltyTransactionService service)
    {
        _service = service;
    }

    private int GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (idClaim != null && int.TryParse(idClaim.Value, out int id))
            return id;
        return 1; // Fallback for dev
    }

    [HttpGet]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string search = "",
        [FromQuery] int? programId = null,
        [FromQuery] string transactionType = "All",
        [FromQuery] string dateFilter = "All")
    {
        var result = await _service.GetTransactionsAsync(page, pageSize, search, programId, transactionType, dateFilter);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetTransactionById(int id)
    {
        try
        {
            var transaction = await _service.GetTransactionByIdAsync(id);
            return Ok(transaction);
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [RequirePermission("Loyalty.Manage")]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateLoyaltyTransactionDto dto)
    {
        try
        {
            var result = await _service.CreateTransactionAsync(dto, GetCurrentUserId());
            return CreatedAtAction(nameof(GetTransactionById), new { id = result.TransactionId }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("kpis")]
    [RequirePermission("Loyalty.View")]
    public async Task<IActionResult> GetKpis()
    {
        var kpis = await _service.GetTransactionKpisAsync();
        return Ok(kpis);
    }
}
