# PR1 smoke checklist — run against API base URL with valid JWTs per role.
# Requires: $env:API_BASE, $env:SALES_TOKEN, $env:QA_TOKEN, $env:DIRECTOR_TOKEN, customer/contact UUIDs.

param(
  [string]$ApiBase = $env:API_BASE,
  [string]$CustomerId = $env:SMOKE_CUSTOMER_ID,
  [string]$ContactId = $env:SMOKE_CONTACT_ID
)

if (-not $ApiBase) { Write-Error "Set API_BASE or -ApiBase"; exit 1 }
if (-not $env:SALES_TOKEN) { Write-Error "Set SALES_TOKEN (Bearer)"; exit 1 }

$headers = @{ Authorization = "Bearer $($env:SALES_TOKEN)"; "Content-Type" = "application/json" }

Write-Host "1. POST /quotations (draft + sales fields minimal)..."
$createBody = @{
  customerId = $CustomerId
  contactId  = $ContactId
  boxType = "Test box"
  lengthMm = 100
  widthMm = 80
  heightMm = 50
  dimensionType = "inner"
  material = "Kraft"
  layerCount = 5
  fluteType = "BC"
  productLoadKg = 10
  printingDescription = "Logo"
  printColorCount = 1
  printSideCount = 1
  quantityPieces = 1000
  deliveryLocation = "HCMC"
  desiredDeliveryTime = "2026-12"
} | ConvertTo-Json

# Invoke-RestMethod -Method POST -Uri "$ApiBase/quotations" -Headers $headers -Body $createBody
Write-Host "   -> Expect 201; note quotation code BG-######"

Write-Host "2. POST /quotations/{code}/submit — active customer/contact + full SAL fields"
Write-Host "3. POST .../tasks/qa_review/complete as QA without QA payload -> expect 400"
Write-Host "4. PUT .../qa with qualityAssessmentResult + qualityRequirements; complete -> 200"
Write-Host "5. Same pattern for rnd_review (costs + ISO dates)"
Write-Host "6. POST .../tasks/director_review/complete -> 409 (use director/decision)"
Write-Host "7. POST .../director/decision approve/reject as DIRECTOR"
Write-Host "8. PATCH .../business-outcome when approved (SALES owner)"

Write-Host "`nDone — fill Invoke-RestMethod calls above once API and tokens are configured."
