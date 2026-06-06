#!/usr/bin/env pwsh
# maestro-run.ps1 - Wrapper script to run Maestro tests with correct environment
# Usage: .\scripts\maestro-run.ps1 [flow-file-or-directory]

$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

$target = if ($args.Count -gt 0) { $args[0] } else { ".maestro/flows/" }

Write-Host "Running Maestro tests for: $target"
Write-Host "JAVA_HOME: $env:JAVA_HOME"

& ".\.maestro_bin\maestro\bin\maestro.bat" test $target
