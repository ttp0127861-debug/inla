# Append current Terraform outputs to both contract files
# Must be run from anywhere; script locates Git root itself
$ErrorActionPreference = "Stop"

# Find Git root (INLA)
$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
    Write-Error "Not inside a Git repository."
    exit 1
}

$tfDir = Join-Path $repoRoot "INLA-S/terraform"
if (-not (Test-Path $tfDir)) {
    Write-Error "Terraform directory not found: $tfDir"
    exit 1
}

Set-Location $tfDir

# Get outputs as JSON
$outputs = terraform output -json 2>$null
if (-not $outputs -or $outputs -eq "{}") {
    Write-Host "No Terraform outputs found or terraform output failed. Nothing to sync."
    exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"
$block = @"
// === SYNC START: $timestamp ===
// Source: terraform output
export const infraUpdate = $outputs as const;
// === SYNC END: $timestamp ===

"@

# Contracts directory
$contractsDir = Join-Path $repoRoot "INLA-S/contracts"
if (-not (Test-Path $contractsDir)) {
    New-Item -ItemType Directory -Path $contractsDir | Out-Null
}

$frontendContract = Join-Path $contractsDir "change-request-frontend.ts"
$backendContract  = Join-Path $contractsDir "change-request-backend.ts"

Add-Content -Path $frontendContract -Value $block -Encoding UTF8
Add-Content -Path $backendContract  -Value $block -Encoding UTF8

Write-Host "Contract appended to:"
Write-Host "  - $frontendContract"
Write-Host "  - $backendContract"