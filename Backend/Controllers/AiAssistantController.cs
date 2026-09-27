using System.Security.Claims;
using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiAssistantController : ControllerBase
{
    private readonly IAiAssistantService _aiService;

    public AiAssistantController(IAiAssistantService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] AiRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest(new { message = "Query cannot be empty." });

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
            return Unauthorized();

        try
        {
            var response = await _aiService.ProcessQueryAsync(request.Query, userId, User);
            return Ok(response);
        }
        catch (Exception ex)
        {
            // Log exception here if logger exists
            return StatusCode(500, new { message = "I couldn't retrieve the latest BOMS data. Please try again." });
        }
    }
}
