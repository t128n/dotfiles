# Cleanup item: OpenCode Desktop
#
# Removes the WinGet package, its per-user app data, and updater caches. The
# OpenCode CLI installed by mise and the shared %APPDATA%\opencode skills are
# intentionally left alone.

function Test-CleanupItem {
    if (Test-WingetPackage 'Anomaly.OpenCode.Desktop') { return $false }

    foreach ($path in @(
            "$env:APPDATA\ai.opencode.desktop",
            "$env:LOCALAPPDATA\@opencode-aidesktop-updater",
            "$env:LOCALAPPDATA\@opencodedesktop-updater",
            "$env:LOCALAPPDATA\Programs\@opencode-aidesktop"
        )) {
        if (Test-Path -LiteralPath $path) { return $false }
    }

    return $true
}

function Set-CleanupItem {
    # Stop the bundled CLI/service so the uninstaller and path removal can
    # release their files.
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.ExecutablePath -and (
                $_.ExecutablePath -like "$env:APPDATA\ai.opencode.desktop\*" -or
                $_.ExecutablePath -like "$env:LOCALAPPDATA\Programs\@opencode-aidesktop\*"
            )
        } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

    Remove-WingetPackage 'Anomaly.OpenCode.Desktop'

    foreach ($path in @(
            "$env:APPDATA\ai.opencode.desktop",
            "$env:LOCALAPPDATA\@opencode-aidesktop-updater",
            "$env:LOCALAPPDATA\@opencodedesktop-updater",
            "$env:LOCALAPPDATA\Programs\@opencode-aidesktop"
        )) {
        Remove-CleanupPath $path
    }
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
