$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
}
$targetDir = Join-Path -Path $scriptDir -ChildPath ".jdk"
$zipFile = Join-Path -Path $scriptDir -ChildPath "jdk17.zip"
$tempDir = Join-Path -Path $scriptDir -ChildPath "jdk17_temp"

if (Test-Path -Path (Join-Path -Path $targetDir -ChildPath "bin\javac.exe") -PathType Leaf) {
    Write-Host "Local JDK 17 already exists at $targetDir. Skipping download."
    exit 0
}

Write-Host "Downloading Eclipse Temurin JDK 17..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$downloadUrl = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"

Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile

Write-Host "Extracting JDK 17..."
if (Test-Path -Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force | Out-Null
}
New-Item -ItemType Directory -Path $tempDir | Out-Null
Expand-Archive -Path $zipFile -DestinationPath $tempDir

# Find the nested directory inside the extracted zip
$extractedFolder = Get-ChildItem -Path $tempDir -Directory | Select-Object -First 1
if (-not $extractedFolder) {
    throw "Failed to locate extracted JDK directory."
}

Write-Host "Moving JDK to $targetDir..."
if (Test-Path -Path $targetDir) {
    Remove-Item -Path $targetDir -Recurse -Force | Out-Null
}
Move-Item -Path $extractedFolder.FullName -Destination $targetDir

Write-Host "Cleaning up temporary files..."
Remove-Item -Path $zipFile -Force -ErrorAction SilentlyContinue
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Local JDK 17 set up successfully at $targetDir!"
