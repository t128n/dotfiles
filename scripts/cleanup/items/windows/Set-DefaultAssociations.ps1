# Cleanup item: default applications
#
# Windows protects per-user defaults: the UserChoice keys are hash-stamped and
# cannot be written or deleted by a script. The supported way to enforce them is
# the machine policy Windows reapplies at every sign-in, which is what this item
# maintains. Changes take effect at the next sign-in.
#
# Helium owns the web protocols and markup documents; NanaZip owns archives;
# Zed owns text and code.

$AssociationsPath = Join-Path $env:ProgramData 't128n\DefaultAssociations.xml'
$PolicyKey = 'HKLM:\Software\Policies\Microsoft\Windows\System'

# Text and code extensions open in Zed. Only extensions Zed registers a ProgId
# for may be listed; Set-CleanupItem fails on the ones it does not know.
$TextExtensions = @(
    '.bash', '.bashrc', '.c', '.cc', '.cfg', '.cjs', '.cpp', '.cs', '.csv', '.cxx',
    '.diff', '.editorconfig', '.gitattributes', '.gitconfig', '.gitignore', '.go',
    '.h', '.hpp', '.hxx', '.ini', '.ipynb', '.java', '.js', '.json', '.jsx', '.log',
    '.lua', '.m', '.makefile', '.markdown', '.md', '.mjs', '.mk', '.php', '.plist',
    '.profile', '.properties', '.ps1', '.psd1', '.psgi', '.psm1', '.py', '.rb',
    '.rs', '.rst', '.sh', '.sql', '.tex', '.toml', '.ts', '.tsx', '.txt', '.xml',
    '.yaml', '.yml', '.zsh'
)

# The browser owns the web protocols and the documents it renders.
$BrowserIdentifiers = @('http', 'https', '.htm', '.html')

# NanaZip opens every archive format it registers. Disk images (.iso, .vhd,
# .wim, ...) stay with Windows so mounting and attaching keep working.
$ArchiveExtensions = @(
    '.001', '.7z', '.arj', '.b64', '.br', '.bz2', '.bzip2', '.cab', '.cb7',
    '.cbr', '.cbz', '.cpio', '.deb', '.gz', '.gzip', '.lha', '.lz', '.lz4',
    '.lz5', '.lzh', '.lzma', '.lzma2', '.nupkg', '.rar', '.rpm', '.tar',
    '.taz', '.tbz', '.tbz2', '.tgz', '.tlz', '.tlz4', '.tlz5', '.tpz', '.txz',
    '.tz', '.tzst', '.tzstd', '.xar', '.xz', '.zip', '.zipx', '.z', '.zst',
    '.zstd'
)

# Helium registers its ProgId with an install-specific suffix, so read it from
# the browser registration instead of hard-coding it.
function Get-HeliumProgId {
    $clients = 'HKCU:\Software\Clients\StartMenuInternet'
    foreach ($client in Get-ChildItem -LiteralPath $clients -ErrorAction SilentlyContinue |
            Where-Object { $_.PSChildName -like 'Helium*' }) {
        $capabilities = Join-Path $client.PSPath 'Capabilities\URLAssociations'
        $progid = (Get-ItemProperty -Path $capabilities -Name http -ErrorAction SilentlyContinue).http
        if ($progid) { return $progid }
    }
    throw 'Helium is not registered; install it with mise run apps'
}

# NanaZip is a packaged app, so Windows generates its ProgId from the package
# identity instead of letting the vendor name it. Resolve the AppX ProgId that
# belongs to the NanaZip package rather than hard-coding the generated value.
function Get-NanaZipProgId {
    foreach ($class in Get-ChildItem -LiteralPath 'HKCU:\Software\Classes' -ErrorAction SilentlyContinue |
            Where-Object { $_.PSChildName -like 'AppX*' }) {
        $application = Join-Path $class.PSPath 'Application'
        $model = (Get-ItemProperty -Path $application -Name AppUserModelID -ErrorAction SilentlyContinue).AppUserModelID
        if ($model -like '40174MouriNaruto.NanaZip_*') { return $class.PSChildName }
    }
    throw 'NanaZip is not registered; install it with mise run apps'
}

function New-AssociationsXml {
    $helium = Get-HeliumProgId
    $nanazip = Get-NanaZipProgId
    $lines = @(
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<DefaultAssociations>'
    )

    foreach ($identifier in $BrowserIdentifiers) {
        $lines += "  <Association Identifier=`"$identifier`" ProgId=`"$helium`" ApplicationName=`"Helium`" />"
    }

    foreach ($extension in $ArchiveExtensions) {
        $lines += "  <Association Identifier=`"$extension`" ProgId=`"$nanazip`" ApplicationName=`"NanaZip`" />"
    }

    $missing = @()
    foreach ($extension in $TextExtensions) {
        $progid = "Zed$extension"
        if (-not (Test-Path -LiteralPath "HKCU:\Software\Classes\$progid")) {
            $missing += $progid
            continue
        }
        $lines += "  <Association Identifier=`"$extension`" ProgId=`"$progid`" ApplicationName=`"Zed`" />"
    }
    if ($missing.Count -gt 0) {
        throw "Zed does not register $($missing -join ', ')"
    }

    $lines += '</DefaultAssociations>'
    return ($lines -join "`n") + "`n"
}

function Get-DeployedXml {
    if (-not (Test-Path -LiteralPath $AssociationsPath)) { return '' }
    return (Get-Content -LiteralPath $AssociationsPath -Raw) -replace "`r`n", "`n"
}

function Get-PolicyPath {
    $value = (Get-ItemProperty -Path $PolicyKey -Name DefaultAssociationsConfiguration -ErrorAction SilentlyContinue).DefaultAssociationsConfiguration
    if ($null -eq $value) { return '' }
    return $value
}

function Test-CleanupItem {
    # Resolve both ProgIds first so a missing install fails loudly instead of
    # looking like drift.
    $xml = New-AssociationsXml
    return ((Get-PolicyPath) -eq $AssociationsPath) -and ((Get-DeployedXml) -eq $xml)
}

function Set-CleanupItem {
    # The XML is too long to inline in the elevated command line, so stage it and
    # pass only paths.
    $staging = Join-Path ([IO.Path]::GetTempPath()) 't128n-DefaultAssociations.xml'
    [IO.File]::WriteAllText($staging, (New-AssociationsXml), (New-Object Text.UTF8Encoding($false)))

    try {
        $command = @'
$ErrorActionPreference = 'Stop'
$path = '__PATH__'
$directory = Split-Path -Path $path -Parent
if (-not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
}
Copy-Item -LiteralPath '__STAGING__' -Destination $path -Force
New-Item -Path '__KEY__' -Force | Out-Null
Set-ItemProperty -Path '__KEY__' -Name DefaultAssociationsConfiguration -Value $path -Type String
'@
        $command = $command.Replace('__PATH__', $AssociationsPath).
            Replace('__STAGING__', $staging).
            Replace('__KEY__', $PolicyKey)
        Invoke-ElevatedCommand $command
    } finally {
        Remove-Item -LiteralPath $staging -Force -ErrorAction SilentlyContinue
    }
}

function Unset-CleanupItem {
    # Cleanup items do not restore; kept for interface symmetry.
}
