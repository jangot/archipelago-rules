# PowerShell script to build all NestJS applications
# Equivalent to build-all.sh

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Function to get current timestamp in milliseconds
function Get-Timestamp {
    return [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
}

# Get all app directories
$appDirs = Get-ChildItem -Path "apps" -Directory | Select-Object -ExpandProperty Name

Write-Host "Building all apps ..."

Write-Host "Cleaning build directory ..."
$startTime = Get-Timestamp
npm run build clean *> $null
$endTime = Get-Timestamp
$elapsed = $endTime - $startTime
Write-Host "Cleaned build directory in $elapsed ms"
Write-Host ""

# Build each app
foreach ($app in $appDirs) {
    Write-Host "Building $app ..."
    $startTime = Get-Timestamp
    npm run build $app *> $null
    $endTime = Get-Timestamp
    $elapsed = $endTime - $startTime
    Write-Host "$app App Built in $elapsed ms"
    Write-Host ""
}

Write-Host "Build all completed"
