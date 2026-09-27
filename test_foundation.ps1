$ErrorActionPreference = "Stop"
$apiUrl = "http://localhost:5280/api"

function Invoke-Api {
    param($Uri, $Method, $Body, $Token)
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    $jsonBody = if ($Body) { $Body | ConvertTo-Json -Depth 10 } else { $null }
    
    try {
        $response = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $headers -Body $jsonBody -ContentType "application/json" -ErrorAction Stop
        return @{ Success = $true; Data = $response }
    } catch {
        return @{ Success = $false; Error = $_.Exception.Response.StatusCode; Message = $_.ErrorDetails.Message }
    }
}

Write-Host "1. Logging in as Admin..."
$adminLogin = Invoke-Api "$apiUrl/auth/login" "Post" @{ usernameOrEmail = "admin"; password = "Admin@123!" }
$adminToken = $adminLogin.Data.token
Write-Host "Admin Token Received."

Write-Host "2. Getting roles..."
$roles = Invoke-Api "$apiUrl/roles" "Get" $null $adminToken
$execRole = $roles.Data | Where-Object { $_.roleName -eq "Executive" }
if (-not $execRole) { Write-Host "Executive role not found!"; exit }

Write-Host "3. Creating a new user..."
$newUser = @{
    firstName = "John"
    lastName = "Smith"
    username = "jsmith$(Get-Random)"
    email = "jsmith$(Get-Random)@test.com"
    password = "Password@123!"
    status = "Active"
    roleIds = @($execRole.roleId)
}
$createRes = Invoke-Api "$apiUrl/users" "Post" $newUser $adminToken
if ($createRes.Success) { Write-Host "User created: $($createRes.Data.userId)" } else { Write-Host "Failed to create user: $($createRes.Message)" }

$userId = $createRes.Data.userId

Write-Host "4. Checking Audit Logs for creation..."
Start-Sleep -Seconds 1
$auditRes = Invoke-Api "$apiUrl/audit-logs?module=Users&pageSize=5" "Get" $null $adminToken
$lastAudit = $auditRes.Data.items | Select-Object -First 1
Write-Host "Last Audit: $($lastAudit.action) on $($lastAudit.entityType) ID $($lastAudit.entityId)"

Write-Host "5. Checking Activity Timeline..."
$actRes = Invoke-Api "$apiUrl/activities?module=Users&pageSize=5" "Get" $null $adminToken
$lastAct = $actRes.Data.items | Select-Object -First 1
Write-Host "Last Activity: $($lastAct.description)"

Write-Host "6. Logging in as new user (jsmith)..."
$userLogin = Invoke-Api "$apiUrl/auth/login" "Post" @{ usernameOrEmail = $newUser.username; password = "Password@123!" }
if ($userLogin.Success) { Write-Host "User Login Successful." } else { Write-Host "User Login Failed!" }
$userToken = $userLogin.Data.token

Write-Host "7. Trying unauthorized action as jsmith (Get Users)..."
$unauthGet = Invoke-Api "$apiUrl/users" "Get" $null $userToken
if (-not $unauthGet.Success -and $unauthGet.Error -eq "Forbidden") {
    Write-Host "SUCCESS: 403 Forbidden returned for Get Users!"
} else {
    Write-Host "FAILED: Did not return 403 Forbidden! Status: $($unauthGet.Error)"
}

Write-Host "8. Trying authorized action as jsmith (Get Dashboard)..."
$dashRes = Invoke-Api "$apiUrl/dashboard" "Get" $null $userToken
if ($dashRes.Success) {
    Write-Host "SUCCESS: Dashboard loaded."
} else {
    Write-Host "FAILED: Dashboard returned error $($dashRes.Error)"
}

Write-Host "End of validation."
