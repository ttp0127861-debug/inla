# Run once from anywhere inside the repo
$ErrorActionPreference = "Stop"

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
    Write-Error "Not inside a Git repository. Please run this from inside the INLA repo."
    exit 1
}

Set-Location $repoRoot
git config core.hooksPath "INLA-S/dev-setup/hooks"

Write-Host "Git root     : $repoRoot"
Write-Host "Hooks path set to: INLA-S/dev-setup/hooks"
Write-Host "Setup complete."