# Requires PowerShell 7+, Node.js 22.12+, npm, and the .NET 10 SDK.
# Works locally on Windows and in a GitHub Actions PowerShell step on Linux.
[CmdletBinding()]
param(
    [ValidatePattern('^v?[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?$')]
    [string]$Version = 'v0.1.0',

    [ValidateSet('linux-x64', 'linux-arm64', 'win-x64')]
    [string]$Runtime = 'linux-x64'
)

#Requires -Version 7.0
$ErrorActionPreference = 'Stop'

function Invoke-Checked {
    param([string]$Command, [string[]]$CommandArguments)
    & $Command @CommandArguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command failed with exit code $LASTEXITCODE."
    }
}

foreach ($command in @('node', 'npm', 'dotnet')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $command"
    }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$clientDir = Join-Path $repoRoot 'client'
$apiProject = Join-Path $repoRoot 'server/TimeLedger.Api/TimeLedger.Api/TimeLedger.Api.csproj'
$artifactsDir = Join-Path $repoRoot 'artifacts'
$stagingDir = Join-Path $artifactsDir ('.build-' + [guid]::NewGuid().ToString('N'))
$publishDir = Join-Path $stagingDir 'app'
$buildClientDir = Join-Path $stagingDir 'client'
$archiveName = "timeledger-$Version-$Runtime.zip"
$archivePath = Join-Path $artifactsDir $archiveName
$savedMockSetting = $env:VITE_USE_MOCKS
$savedApiUrl = $env:VITE_API_BASE_URL

New-Item -ItemType Directory -Force -Path $publishDir | Out-Null
Push-Location $repoRoot
try {
    # Build in isolation so npm ci cannot disturb a running development server.
    New-Item -ItemType Directory -Path $buildClientDir | Out-Null
    Get-ChildItem -LiteralPath $clientDir -Force |
        Where-Object { $_.Name -notin @('node_modules', 'dist', '.git') -and $_.Name -notlike '.env*' } |
        Copy-Item -Destination $buildClientDir -Recurse -Force

    Push-Location $buildClientDir
    try {
        Write-Host 'Installing frontend dependencies and running lint...'
        Invoke-Checked 'npm' @('ci')
        Invoke-Checked 'npm' @('run', 'lint')

        # Environment variables override Vite .env files without modifying them.
        $env:VITE_USE_MOCKS = 'false'
        $env:VITE_API_BASE_URL = '/api'
        Write-Host 'Building the frontend for the bundled API...'
        Invoke-Checked 'npm' @('run', 'build')
    }
    finally {
        Pop-Location
    }

    Write-Host "Publishing a self-contained $Runtime API..."
    Invoke-Checked 'dotnet' @(
        'publish', $apiProject,
        '-c', 'Release', '-r', $Runtime,
        '--self-contained', 'true', '-o', $publishDir
    )

    $webRoot = Join-Path $publishDir 'wwwroot'
    New-Item -ItemType Directory -Force -Path $webRoot | Out-Null
    Copy-Item -Path (Join-Path $buildClientDir 'dist/*') -Destination $webRoot -Recurse -Force

    $executable = if ($Runtime -eq 'win-x64') { 'TimeLedger.Api.exe' } else { 'TimeLedger.Api' }
    foreach ($requiredFile in @($executable, 'TimeLedger.Api.dll', 'wwwroot/index.html')) {
        if (-not (Test-Path -LiteralPath (Join-Path $publishDir $requiredFile))) {
            throw "Release is missing $requiredFile."
        }
    }

    $databaseFiles = Get-ChildItem -LiteralPath $publishDir -Recurse -File |
        Where-Object { $_.Name -match '\.(db|sqlite|sqlite3)(-|$)' }
    if ($databaseFiles) {
        throw 'Release contains local database files. Packaging stopped.'
    }

    # Build in staging first; a failed build leaves any previous ZIP intact.
    $stagedArchive = Join-Path $stagingDir $archiveName
    Compress-Archive -Path (Join-Path $publishDir '*') -DestinationPath $stagedArchive
    Move-Item -LiteralPath $stagedArchive -Destination $archivePath -Force
    Write-Host "Release created: $archivePath"
}
finally {
    $env:VITE_USE_MOCKS = $savedMockSetting
    $env:VITE_API_BASE_URL = $savedApiUrl
    Pop-Location

    # Only remove the unique staging directory created by this invocation.
    $resolvedArtifacts = [IO.Path]::GetFullPath($artifactsDir)
    $resolvedStaging = [IO.Path]::GetFullPath($stagingDir)
    if ([IO.Path]::GetDirectoryName($resolvedStaging) -ne $resolvedArtifacts -or
        [IO.Path]::GetFileName($resolvedStaging) -notmatch '^\.build-[a-f0-9]{32}$') {
        throw "Unexpected staging path: $resolvedStaging"
    }
    if (Test-Path -LiteralPath $resolvedStaging) {
        Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
    }
}
