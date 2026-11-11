Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$rootDir = (Get-Location).Path
$chromiumDir = Join-Path $rootDir "extension"
$firefoxDir = Join-Path $rootDir "extension-firefox"
$releaseDir = Join-Path $rootDir "release"

New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

# 1. Build Firefox extension directory from Chromium base
if (Test-Path $firefoxDir) {
    Remove-Item -Path $firefoxDir -Recurse -Force
}
Copy-Item -Path $chromiumDir -Destination $firefoxDir -Recurse -Force

# 2. Patch manifest.json for Mozilla Firefox Add-ons (AMO) MV3 compliance
$manifestPath = Join-Path $firefoxDir "manifest.json"
$manifest = Get-Content -Path $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json

# Replace service_worker with scripts for Firefox MV3
$manifest.background = [PSCustomObject]@{
    scripts = @("background.js")
}

# Add gecko settings + mandatory data_collection_permissions
$manifest | Add-Member -NotePropertyName "browser_specific_settings" -NotePropertyValue ([PSCustomObject]@{
    gecko = [PSCustomObject]@{
        id = "mysafe@hmo175.github.io"
        strict_min_version = "140.0"
        data_collection_permissions = [PSCustomObject]@{
            required = @("none")
        }
    }
}) -Force

$jsonOut = $manifest | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($manifestPath, $jsonOut, [System.Text.UTF8Encoding]::new($false))

# Helper to create store-compliant ZIP with POSIX forward slashes
function New-PosixZip {
    param([string]$SourceDir, [string]$DestZip)
    if (Test-Path $DestZip) {
        Remove-Item -Path $DestZip -Force
    }
    $zip = [System.IO.Compression.ZipFile]::Open($DestZip, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        $files = Get-ChildItem -Path $SourceDir -Recurse -File
        foreach ($f in $files) {
            $relPath = $f.FullName.Substring($SourceDir.Length + 1).Replace("\", "/")
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $relPath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    } finally {
        $zip.Dispose()
    }
}

$chromiumZip = Join-Path $releaseDir "MySafe-Extension-Chromium-v1.0.0.zip"
$firefoxZip = Join-Path $releaseDir "MySafe-Extension-Firefox-v1.0.0.zip"

New-PosixZip -SourceDir $chromiumDir -DestZip $chromiumZip
New-PosixZip -SourceDir $firefoxDir -DestZip $firefoxZip

Write-Output "Packaged Chromium (Chrome/Edge/Brave/Opera/Vivaldi): $chromiumZip"
Write-Output "Packaged Firefox (AMO): $firefoxZip"
