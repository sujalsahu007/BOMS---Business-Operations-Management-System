$ErrorActionPreference = "Stop"

Write-Host "==========================="
Write-Host "TESTING AS MANAGER"
Write-Host "==========================="

$managerLoginBody = @{
    usernameOrEmail = "manager"
    password = "Manager@123!"
} | ConvertTo-Json

$managerResponse = Invoke-RestMethod -Uri "http://localhost:5280/api/auth/login" -Method Post -Body $managerLoginBody -ContentType "application/json"
$managerToken = $managerResponse.token

Write-Host "Manager Token received."

Write-Host "`nTest 1: GET /api/authorization-test (Requires Dashboard.View)"
try {
    $res = Invoke-RestMethod -Uri "http://localhost:5280/api/authorization-test" -Method Get -Headers @{ Authorization = "Bearer $managerToken" }
    Write-Host "SUCCESS: $($res.message)"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
}

Write-Host "`nTest 2: GET /api/roles (Requires Roles.View)"
try {
    $res = Invoke-RestMethod -Uri "http://localhost:5280/api/roles" -Method Get -Headers @{ Authorization = "Bearer $managerToken" }
    Write-Host "SUCCESS: Fetched roles"
} catch {
    Write-Host "FAILED: $($_.Exception.Message) (Expected because manager does not have Roles.View)"
}

Write-Host "`n==========================="
Write-Host "TESTING AS ADMINISTRATOR"
Write-Host "==========================="

$adminLoginBody = @{
    usernameOrEmail = "admin"
    password = "Admin@123!"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:5280/api/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminResponse.token

Write-Host "Admin Token received."

Write-Host "`nTest 3: GET /api/authorization-test (Requires Dashboard.View)"
try {
    $res = Invoke-RestMethod -Uri "http://localhost:5280/api/authorization-test" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
    Write-Host "SUCCESS: $($res.message)"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
}

Write-Host "`nTest 4: GET /api/roles (Requires Roles.View)"
try {
    $res = Invoke-RestMethod -Uri "http://localhost:5280/api/roles" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
    Write-Host "SUCCESS: Fetched $($res.Count) roles"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
}
