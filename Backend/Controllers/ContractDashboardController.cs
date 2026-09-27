using System.Threading.Tasks;
using Backend.Authorization;
using Backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/contracts/dashboard")]
[Authorize]
public class ContractDashboardController : ControllerBase
{
    private readonly IContractService _contractService;

    public ContractDashboardController(IContractService contractService)
    {
        _contractService = contractService;
    }

    [HttpGet]
    [RequirePermission("Contracts.View")]
    public async Task<IActionResult> GetDashboard()
    {
        return Ok(await _contractService.GetDashboardAsync());
    }
}
