param(
    [string]$AdminApiKey = "local-atlas-development-key",
    [ValidateRange(1024, 65535)][int]$ApiPort = 18080,
    [switch]$UseExistingDatabase,
    [switch]$CheckRouteParity,
    [switch]$CheckScenarios,
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
$apiBaseUrl = "http://127.0.0.1:$ApiPort"

New-Item -ItemType Directory -Path $runDirectory | Out-Null

try {
    $probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $ApiPort)
    try {
        $probe.Start()
    } catch {
        throw "API port $ApiPort is already in use. Choose another port with -ApiPort."
    } finally {
        $probe.Stop()
    }

    if ($UseExistingDatabase) {
        if ($env:DATABASE_URL -notmatch '^jdbc:postgresql://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/[^/?]+$') {
            throw "Set DATABASE_URL to the JDBC URL of an isolated local PostgreSQL database"
        }
    } else {
        docker compose -f $composeFile up -d --wait --wait-timeout 90
        if ($LASTEXITCODE -ne 0) { throw "Local PostGIS did not start" }
        $env:DATABASE_URL = "jdbc:postgresql://localhost:55432/indoor_navigation"
    }

    Push-Location $repoRoot
    try {
        $env:CI = "true"
        corepack pnpm --filter @atlas/fixture-generator build
        if ($LASTEXITCODE -ne 0) { throw "Fixture generator build failed" }
        node tooling/fixture-generator/dist/cli.js --output $fixturePath
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $fixturePath)) { throw "Fixture generation failed" }
    } finally {
        Pop-Location
    }

    Push-Location $serviceDirectory
    try {
        if ($IsLinux -or $IsMacOS) {
            bash ./gradlew bootJar --console=plain
        } else {
            .\gradlew.bat bootJar --console=plain
        }
        if ($LASTEXITCODE -ne 0) { throw "Platform API build failed" }
    } finally {
        Pop-Location
    }

    $apiJar = Get-ChildItem (Join-Path $serviceDirectory "build\libs\*.jar") |
        Where-Object { $_.Name -notlike "*-plain.jar" } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $apiJar) { throw "platform-api boot JAR was not produced" }

    $env:ADMIN_API_KEYS = "$AdminApiKey`:PLATFORM_ADMIN,MAPPING_OPERATOR"
    $env:PORT = "$ApiPort"
    $apiProcess = Start-Process `
        -FilePath "java" `
        -ArgumentList "-jar", ('"' + $apiJar.FullName + '"') `
        -WorkingDirectory $serviceDirectory `
        -WindowStyle Hidden `
        -RedirectStandardOutput $apiLog `
        -RedirectStandardError $apiErrorLog `
        -PassThru

    $healthy = $false
    for ($attempt = 1; $attempt -le 45; $attempt++) {
        if ($apiProcess.HasExited) {
            throw "Platform API exited with code $($apiProcess.ExitCode). Logs: $apiLog and $apiErrorLog"
        }
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

    $package = Invoke-RestMethod -Uri "$apiBaseUrl/v1/venues/$($import.venueId)/map-package"
    if ($package.mapVersion.id -ne $import.mapVersionId -or $package.pois.Count -lt 20) {
        throw "Published venue package does not match the imported synthetic fixture"
    }
    $search = Invoke-RestMethod -Uri "$apiBaseUrl/v1/venues/$($import.venueId)/search?q=Zara&mapVersionId=$($package.mapVersion.id)"
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
    $destination = $package.pois | Where-Object { $_.id -eq $zara.poiId } | Select-Object -First 1
    $entrance = $package.graph.nodes | Where-Object { $_.id -eq $destination.entryPointNodeId } | Select-Object -First 1
    $lastFloor = $route.floors[-1]
    $lastPoint = $lastFloor.polyline[-1]
    if ($route.mapVersionId -ne $package.mapVersion.id -or -not $entrance -or
        $lastFloor.floorId -ne $entrance.floorId -or $lastPoint[0] -ne $entrance.x -or $lastPoint[1] -ne $entrance.y) {
        throw "Route does not end at the destination entrance in the published map"
    }

    if ($CheckRouteParity) {
        node (Join-Path $repoRoot "apps/mobile/scripts/check-route-parity.cjs") $apiBaseUrl $import.venueId
        if ($LASTEXITCODE -ne 0) { throw "Online and offline route parity check failed" }

        $lift = $package.graph.edges | Where-Object edgeType -eq "lift" | Select-Object -First 1
        if (-not $lift -or $lift.closureState -ne "open" -or $lift.validFrom -or $lift.validUntil) {
            throw "Expected an open lift with no validity window in the synthetic test package"
        }
        $closureUri = "$apiBaseUrl/v1/admin/closures/edges/$($lift.id)"
        try {
            Invoke-RestMethod -Method Post -Uri $closureUri -Headers $headers -ContentType "application/json" `
                -Body '{"closureState":"closed","reason":"Synthetic parity test"}' | Out-Null
            node (Join-Path $repoRoot "apps/mobile/scripts/check-route-parity.cjs") $apiBaseUrl $import.venueId --expect-unavailable
            if ($LASTEXITCODE -ne 0) { throw "Online and offline route parity check failed with the lift closed" }
        } finally {
            Invoke-RestMethod -Method Post -Uri $closureUri -Headers $headers -ContentType "application/json" `
                -Body '{"closureState":"open","reason":"Restore synthetic test lift"}' | Out-Null
        }
    }

    if ($CheckScenarios) {
        $scenarioChecks = [ordered]@{
            'closed-corridor' = '--expect-unavailable'
            'unavailable-lift' = '--expect-unavailable'
            'closed-destination' = '--expect-all-routable'
            'one-way-corridor' = '--expect-all-routable'
            'inaccessible-route' = '--expect-unavailable'
            'version-update' = '--expect-all-routable'
            'curved-corridor' = '--expect-all-routable'
            'scheduled-route' = '--expect-all-routable'
        }
        $versionRoot = "$apiBaseUrl/v1/admin/venues/$($import.venueId)/map-versions"
        try {
            foreach ($scenario in $scenarioChecks.Keys) {
                $variantPath = Join-Path $runDirectory "$scenario.json"
                node (Join-Path $repoRoot "tooling/fixture-generator/dist/cli.js") --scenario $scenario --output $variantPath
                if ($LASTEXITCODE -ne 0) { throw "Could not generate the $scenario scenario" }
                $variant = Invoke-RestMethod -Method Post -Uri "$apiBaseUrl/v1/admin/map-packages/import" `
                    -Headers $headers -ContentType "application/json" -Body (Get-Content -LiteralPath $variantPath -Raw)
                if ($variant.venueId -ne $import.venueId -or $variant.mapVersionId -eq $import.mapVersionId) {
                    throw "Scenario $scenario did not create a distinct version of the fictional venue"
                }
                Invoke-RestMethod -Method Post -Uri "$versionRoot/$($variant.mapVersionId)/publish" -Headers $headers | Out-Null
                $published = Invoke-RestMethod -Uri "$apiBaseUrl/v1/venues/$($import.venueId)/map-package"
                if ($published.mapVersion.id -ne $variant.mapVersionId) { throw "Scenario $scenario was not published" }

                if ($scenario -eq "closed-destination") {
                    $closed = $published.pois | Where-Object name -eq "Zara"
                    $hits = Invoke-RestMethod -Uri "$apiBaseUrl/v1/venues/$($import.venueId)/search?q=Zara"
                    if ($closed.status -ne "closed" -or $hits.results.Count -ne 0) { throw "Closed Zara still appears in search" }
                }
                if ($scenario -eq "version-update") {
                    $hits = Invoke-RestMethod -Uri "$apiBaseUrl/v1/venues/$($import.venueId)/search?q=New%20season"
                    if ($hits.results[0].name -ne "Zara") { throw "Updated Zara alias was not published" }
                }
                if ($scenario -eq "one-way-corridor") {
                    # An idempotent import can return an empty source-ID mapping.
                    $ground = $published.floors | Where-Object ordinal -eq 0
                    $atrium = $published.graph.nodes | Where-Object { $_.floorId -eq $ground.id -and $_.x -eq 35 -and $_.y -eq 30 }
                    $east = $published.graph.nodes | Where-Object { $_.floorId -eq $ground.id -and $_.x -eq 65 -and $_.y -eq 30 }
                    $oneWay = $published.graph.edges | Where-Object {
                        $_.fromNodeId -eq $east.id -and $_.toNodeId -eq $atrium.id -and $_.isOneWay
                    }
                    if (@($atrium).Count -ne 1 -or @($east).Count -ne 1 -or @($oneWay).Count -ne 1) {
                        throw "One-way corridor did not preserve the authored travel direction"
                    }
                }
                if ($scenario -eq "curved-corridor") {
                    $ground = $published.floors | Where-Object ordinal -eq 0
                    $desk = $published.pois | Where-Object name -eq "Information desk"
                    $curvedBody = @{
                        mapVersionId = $published.mapVersion.id
                        start = @{ floorId = $ground.id; x = 8; y = 30 }
                        destinationPoiId = $desk.id
                    } | ConvertTo-Json -Depth 5
                    $curvedRoute = Invoke-RestMethod -Method Post -Uri "$apiBaseUrl/v1/venues/$($import.venueId)/routes" `
                        -ContentType "application/json" -Body $curvedBody
                    $points = $curvedRoute.floors[0].polyline
                    if ($points.Count -ne 5 -or $points[2][0] -ne 18 -or $points[2][1] -ne 36 -or
                        $curvedRoute.distanceM -ne 35.8 -or $curvedRoute.estimatedTimeS -ne 29) {
                        throw "The route to the information desk did not follow the authored corridor geometry"
                    }
                }
                if ($scenario -eq "scheduled-route") {
                    $ground = $published.floors | Where-Object ordinal -eq 0
                    $store = $published.pois | Where-Object name -eq "Zara"
                    $scheduledBody = @{
                        mapVersionId = $published.mapVersion.id
                        start = @{ floorId = $ground.id; x = 8; y = 30 }
                        destinationPoiId = $store.id
                        mode = "step_free"
                    } | ConvertTo-Json -Depth 5
                    $scheduledRoute = Invoke-RestMethod -Method Post -Uri "$apiBaseUrl/v1/venues/$($import.venueId)/routes" `
                        -ContentType "application/json" -Body $scheduledBody
                    if ($scheduledRoute.validUntilMs -ne [DateTimeOffset]::Parse("2099-01-01T00:00:00Z").ToUnixTimeMilliseconds()) {
                        throw "The step-free route should expire when its lift closes"
                    }
                }
                Write-Output "Checking $scenario"
                node (Join-Path $repoRoot "apps/mobile/scripts/check-route-parity.cjs") $apiBaseUrl $import.venueId $scenarioChecks[$scenario]
                if ($LASTEXITCODE -ne 0) { throw "Online and offline routes disagree for $scenario" }
            }
        } finally {
            Invoke-RestMethod -Method Post -Uri "$versionRoot/$($import.mapVersionId)/rollback" -Headers $headers | Out-Null
        }
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
