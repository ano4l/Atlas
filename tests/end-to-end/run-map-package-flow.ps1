param(
    [string]$AdminApiKey = "local-atlas-development-key",
    [switch]$KeepApiRunning
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$composeFile = Join-Path $repoRoot "infrastructure\local\docker-compose.yml"
$serviceDirectory = Join-Path $repoRoot "services\platform-api"
$runDirectory = Join-Path $env:TEMP ("atlas-e2e-" + [guid]::NewGuid().ToString())
$fixturePath = Join-Path $runDirectory "synthetic-venue.json"
$apiLog = Join-Path $runDirectory "platform-api.log"
$apiErrorLog = Join-Path $runDirectory "platform-api-error.log"
$apiProcess = $null
$previousAdminKeys = $env:ADMIN_API_KEYS
$previousDatabaseUrl = $env:DATABASE_URL
$previousPort = $env:PORT
$previousCi = $env:CI
$apiBaseUrl = "http://localhost:18080"

New-Item -ItemType Directory -Path $runDirectory | Out-Null

try {
    docker compose -f $composeFile up -d --wait

    Push-Location $repoRoot
    try {
        $env:CI = "true"
        pnpm --filter @atlas/fixture-generator build
        if ($LASTEXITCODE -ne 0) { throw "Fixture generator build failed" }
        node tooling/fixture-generator/dist/cli.js --output $fixturePath
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $fixturePath)) { throw "Fixture generation failed" }
    } finally {
        Pop-Location
    }

    Push-Location $serviceDirectory
    try {
        .\gradlew.bat bootJar --console=plain
    } finally {
        Pop-Location
    }

    $apiJar = Get-ChildItem (Join-Path $serviceDirectory "build\libs\*.jar") |
        Where-Object { $_.Name -notlike "*-plain.jar" } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $apiJar) { throw "platform-api boot JAR was not produced" }

    $env:ADMIN_API_KEYS = "$AdminApiKey`:PLATFORM_ADMIN,MAPPING_OPERATOR"
    $env:DATABASE_URL = "jdbc:postgresql://localhost:55432/indoor_navigation"
    $env:PORT = "18080"
    $apiProcess = Start-Process `
        -FilePath "java" `
        -ArgumentList "-jar", $apiJar.FullName `
        -WorkingDirectory $serviceDirectory `
        -WindowStyle Hidden `
        -RedirectStandardOutput $apiLog `
        -RedirectStandardError $apiErrorLog `
        -PassThru

    $healthy = $false
    for ($attempt = 1; $attempt -le 45; $attempt++) {
        try {
            $health = Invoke-RestMethod -Uri "$apiBaseUrl/v1/health" -TimeoutSec 2
            if ($health.status -eq "ok") {
                $healthy = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    if (-not $healthy) {
        throw "Platform API did not become healthy. Logs: $apiLog and $apiErrorLog"
    }

    $headers = @{ "X-API-Key" = $AdminApiKey }
    $packageJson = Get-Content $fixturePath -Raw
    $import = Invoke-RestMethod `
        -Method Post `
        -Uri "$apiBaseUrl/v1/admin/map-packages/import" `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $packageJson

    $publishUri = "$apiBaseUrl/v1/admin/venues/$($import.venueId)/map-versions/$($import.mapVersionId)/publish"
    try {
        Invoke-RestMethod -Method Post -Uri $publishUri -Headers $headers | Out-Null
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 409) { throw }
    }

    $search = Invoke-RestMethod -Uri "$apiBaseUrl/v1/venues/$($import.venueId)/search?q=Zara"
    $zara = $search.results | Where-Object { $_.name -eq "Zara" } | Select-Object -First 1
    if (-not $zara) { throw "Zara was not returned by backend search" }

    $startFloorId = $import.mappings.floors."20000000-0000-4000-8000-000000000001"
    if (-not $startFloorId) {
        $floors = Invoke-RestMethod -Uri "$apiBaseUrl/v1/venues/$($import.venueId)/floors?mapVersionId=$($import.mapVersionId)"
        $startFloorId = ($floors | Sort-Object ordinal | Select-Object -First 1).id
    }

    $routeBody = @{
        mapVersionId = $import.mapVersionId
        start = @{
            floorId = $startFloorId
            x = 8
            y = 30
        }
        destinationPoiId = $zara.poiId
    } | ConvertTo-Json -Depth 5
    $route = Invoke-RestMethod `
        -Method Post `
        -Uri "$apiBaseUrl/v1/venues/$($import.venueId)/routes" `
        -ContentType "application/json" `
        -Body $routeBody

    if ($route.floors.Count -ne 2 -or $route.transitions.Count -lt 1) {
        throw "Expected a two-floor route with a floor transition"
    }

    [pscustomobject]@{
        VenueId = $import.venueId
        MapVersionId = $import.mapVersionId
        Imported = $import.created
        Destination = $zara.name
        Floors = $route.floors.Count
        Transitions = $route.transitions.Count
        DistanceM = $route.distanceM
    }
} finally {
    $env:ADMIN_API_KEYS = $previousAdminKeys
    $env:DATABASE_URL = $previousDatabaseUrl
    $env:PORT = $previousPort
    $env:CI = $previousCi
    if ($apiProcess -and -not $KeepApiRunning -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id
    }
}
