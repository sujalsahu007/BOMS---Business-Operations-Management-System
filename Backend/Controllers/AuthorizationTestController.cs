using Backend.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/authorization-test")]
public class AuthorizationTestController : ControllerBase
{
    [HttpGet]
    [RequirePermission("Dashboard.View")]
    public IActionResult TestDashboardView()
    {
        return Ok(new { message = "You have Dashboard.View permission and are authorized!" });
    }
}
