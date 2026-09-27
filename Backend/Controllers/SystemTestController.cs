using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/system-test")]
public class SystemTestController : ControllerBase
{
    private readonly ISystemTestService _systemTestService;

    public SystemTestController(ISystemTestService systemTestService)
    {
        _systemTestService = systemTestService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSystemTestRecordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required.");
        }

        var record = await _systemTestService.CreateTestRecordAsync(request.Name);
        return Ok(record);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var records = await _systemTestService.GetAllTestRecordsAsync();
        return Ok(records);
    }
}
