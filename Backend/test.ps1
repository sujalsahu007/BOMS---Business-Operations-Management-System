$ErrorActionPreference = 'Stop'

function Get-Token {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:5280/api/auth/login" -ContentType "application/json" -Body '{"usernameOrEmail":"admin","password":"Admin@123!"}'
    return $response.token
}

$token = Get-Token
$headers = @{ Authorization = "Bearer $token" }

$ticks = (Get-Date).Ticks
Write-Host "Creating Product..."
$productPayload = @{
    productName = "Test Product $ticks"
    sku = "TEST-SKU-$ticks"
    categoryId = 1
    unitOfMeasure = "PCS"
    barcode = "$ticks"
    reorderLevel = 10
    unitCost = 5.0
    status = "Active"
}
$product = Invoke-RestMethod -Method Post -Uri "http://localhost:5280/api/products" -Headers $headers -ContentType "application/json" -Body (ConvertTo-Json $productPayload)
Write-Host "Created Product ID: $($product.productId)"

Write-Host "Creating Warehouse..."
$warehousePayload = @{
    warehouseName = "Test Warehouse $ticks"
    location = "Test Location $ticks"
    capacity = 1000
    status = "Active"
}
$warehouse = Invoke-RestMethod -Method Post -Uri "http://localhost:5280/api/warehouses" -Headers $headers -ContentType "application/json" -Body (ConvertTo-Json $warehousePayload)
Write-Host "Created Warehouse ID: $($warehouse.warehouseId) Code: $($warehouse.warehouseCode)"

Write-Host "Initializing Stock..."
$stockPayload = @{
    warehouseId = $warehouse.warehouseId
    productId = $product.productId
    initialQuantity = 50
    reason = "Initial Inventory"
}
$stock = Invoke-RestMethod -Method Post -Uri "http://localhost:5280/api/stock/initialize" -Headers $headers -ContentType "application/json" -Body (ConvertTo-Json $stockPayload)
Write-Host "Stock Initialized. Available Quantity: $($stock.availableQuantity) Status: $($stock.stockStatus)"

Write-Host "Checking Stock Overview..."
$stockOverview = Invoke-RestMethod -Method Get -Uri "http://localhost:5280/api/stock?warehouseId=$($warehouse.warehouseId)&productId=$($product.productId)" -Headers $headers
Write-Host "Found $($stockOverview.items.Length) stock items."

Write-Host "Checking Transactions..."
$txns = Invoke-RestMethod -Method Get -Uri "http://localhost:5280/api/stock/transactions?warehouseId=$($warehouse.warehouseId)&productId=$($product.productId)" -Headers $headers
Write-Host "Found $($txns.items.Length) transactions."
if ($txns.items.Length -gt 0) {
    Write-Host "Latest Transaction Code: $($txns.items[0].transactionCode) Type: $($txns.items[0].transactionType) Quantity: $($txns.items[0].quantity) Prev: $($txns.items[0].previousQuantity) New: $($txns.items[0].newQuantity)"
}

Write-Host "ALL TESTS PASSED"
