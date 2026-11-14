// Declarative Windows 11 taskbar pins via offline Taskband binary serialization.
// Stops explorer.exe before writing Favorites / FavoritesResolve / FavoritesChanges
// so Explorer does not overwrite the registry on exit, then restarts explorer.exe.
import { defineResource } from "../../lib/types.ts";
import { runPwsh } from "../../lib/windows.ts";

interface TaskbarPin {
  /** Display name (used for .lnk filename and SIGDN_NORMALDISPLAY matching). */
  name: string;
  /** For Win32 apps: executable path. Omit for MSIX/UWP apps. */
  target?: string;
  /** For MSIX/UWP apps: shell:AppsFolder\<AUMID>. */
  appId?: string;
}

const PINS: TaskbarPin[] = [
  {
    name: "File Explorer",
    appId: "Microsoft.Windows.Explorer",
  },
  {
    name: "Helium",
    target: "$env:LOCALAPPDATA\\imput\\Helium\\Application\\chrome.exe",
  },
  {
    name: "Terminal",
    appId: "Microsoft.WindowsTerminal_8wekyb3d8bbwe!App",
  },
  {
    name: "Obsidian",
    target: "$env:LOCALAPPDATA\\Programs\\Obsidian\\Obsidian.exe",
  },
  {
    name: "Zed",
    target: "$env:LOCALAPPDATA\\Programs\\Zed\\Zed.exe",
  },
];

const SHARED_CS = `
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

namespace Win32Taskbar {
    [ComImport, Guid("00021401-0000-0000-C000-000000000046")]
    public class ShellLink {}

    [ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid("000214F9-0000-0000-C000-000000000046")]
    public interface IShellLinkW {
        void GetPath([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszFile, int cchMaxPath, IntPtr pfd, int fFlags);
        void GetIDList(out IntPtr ppidl);
        void SetIDList(IntPtr pidl);
        void GetDescription([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszName, int cchMaxName);
        void SetDescription([MarshalAs(UnmanagedType.LPWStr)] string pszName);
        void GetWorkingDirectory([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszDir, int cchMaxPath);
        void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)] string pszDir);
        void GetArguments([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszArgs, int cchMaxPath);
        void SetArguments([MarshalAs(UnmanagedType.LPWStr)] string pszArgs);
        void GetHotkey(out short pwHotkey);
        void SetHotkey(short wHotkey);
        void GetShowCmd(out int piShowCmd);
        void SetShowCmd(int iShowCmd);
        void GetIconLocation([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszIconPath, int cchIconPath, out int piIcon);
        void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)] string pszIconPath, int iIcon);
        void SetRelativePath([MarshalAs(UnmanagedType.LPWStr)] string pszPathRel, int dwReserved);
        void Resolve(IntPtr hwnd, int fFlags);
        void SetPath([MarshalAs(UnmanagedType.LPWStr)] string pszFile);
    }

    [ComImport, InterfaceType(ComInterfaceType.InterfaceIsIUnknown), Guid("00000109-0000-0000-C000-000000000046")]
    public interface IPersistStream {
        void GetClassID(out Guid pClassID);
        [PreserveSig] int IsDirty();
        void Load(IStream pStm);
        void Save(IStream pStm, [MarshalAs(UnmanagedType.Bool)] bool fClearDirty);
        void GetSizeMax(out long pcbSize);
    }

    public static class Native {
        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
        public static extern int SHParseDisplayName(string pszName, IntPtr pbc, out IntPtr ppidl, uint sfgaoIn, out uint psfgaoOut);

        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
        public static extern int SHGetNameFromIDList(IntPtr pidl, int sigdnName, out IntPtr ppszName);

        [DllImport("shell32.dll")]
        public static extern uint ILGetSize(IntPtr pidl);

        [DllImport("ole32.dll")]
        public static extern int CreateStreamOnHGlobal(IntPtr hGlobal, [MarshalAs(UnmanagedType.Bool)] bool fDeleteOnRelease, out IStream ppstm);

        [DllImport("ole32.dll")]
        public static extern int GetHGlobalFromStream(IStream pstm, out IntPtr phglobal);

        [DllImport("kernel32.dll")]
        public static extern IntPtr GlobalLock(IntPtr hMem);

        [DllImport("kernel32.dll")]
        public static extern bool GlobalUnlock(IntPtr hMem);

        [DllImport("kernel32.dll")]
        public static extern UIntPtr GlobalSize(IntPtr hMem);

        public static string GetDisplayName(byte[] pidlBytes) {
            IntPtr pidl = Marshal.AllocHGlobal(pidlBytes.Length);
            try {
                Marshal.Copy(pidlBytes, 0, pidl, pidlBytes.Length);
                IntPtr pName;
                int hr = SHGetNameFromIDList(pidl, 0, out pName);
                if (hr != 0 || pName == IntPtr.Zero) return null;
                try { return Marshal.PtrToStringUni(pName); }
                finally { Marshal.FreeCoTaskMem(pName); }
            } finally {
                Marshal.FreeHGlobal(pidl);
            }
        }

        public static byte[] ParsePidl(string parsingName) {
            IntPtr pidl;
            uint sfgao;
            int hr = SHParseDisplayName(parsingName, IntPtr.Zero, out pidl, 0, out sfgao);
            if (hr != 0 || pidl == IntPtr.Zero) {
                throw new Exception("SHParseDisplayName failed for " + parsingName + " (hr=" + hr + ")");
            }
            try {
                int size = (int)ILGetSize(pidl);
                byte[] bytes = new byte[size];
                Marshal.Copy(pidl, bytes, 0, size);
                return bytes;
            } finally {
                Marshal.FreeCoTaskMem(pidl);
            }
        }

        public static byte[] BuildResolveStream(byte[] pidlBytes) {
            IntPtr pidl = Marshal.AllocHGlobal(pidlBytes.Length);
            IStream stm = null;
            try {
                Marshal.Copy(pidlBytes, 0, pidl, pidlBytes.Length);
                var link = (IShellLinkW)new ShellLink();
                link.SetIDList(pidl);
                int hr = CreateStreamOnHGlobal(IntPtr.Zero, true, out stm);
                if (hr != 0) throw new Exception("CreateStreamOnHGlobal failed");
                ((IPersistStream)link).Save(stm, true);
                IntPtr hMem;
                GetHGlobalFromStream(stm, out hMem);
                int len = (int)GlobalSize(hMem);
                IntPtr ptr = GlobalLock(hMem);
                try {
                    byte[] data = new byte[len];
                    Marshal.Copy(ptr, data, 0, len);
                    return data;
                } finally {
                    GlobalUnlock(hMem);
                }
            } finally {
                if (stm != null) Marshal.ReleaseComObject(stm);
                Marshal.FreeHGlobal(pidl);
            }
        }
    }
}
`;

export default defineResource({
  async test() {
    const expectedJson = JSON.stringify(PINS.map((p) => p.name)).replace(/'/g, "''");
    const out = await runPwsh(`
$ErrorActionPreference = 'Stop'
if (-not ('Win32Taskbar.Native' -as [type])) {
    Add-Type -TypeDefinition @'
${SHARED_CS}
'@
}
$expected = '${expectedJson}' | ConvertFrom-Json
$tb = Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Taskband' -ErrorAction SilentlyContinue
if (-not $tb -or -not $tb.Favorites) { 'false'; return }
$fav = [byte[]]$tb.Favorites
$names = New-Object System.Collections.Generic.List[string]
$i = 0
while ($i -lt $fav.Length -and $fav[$i] -ne 0xFF) {
    if ($i + 5 -gt $fav.Length) { 'false'; return }
    $len = [BitConverter]::ToUInt32($fav, $i + 1)
    if ($i + 5 + $len -gt $fav.Length) { 'false'; return }
    $pidlBytes = New-Object byte[] $len
    [Array]::Copy($fav, $i + 5, $pidlBytes, 0, $len)
    $names.Add([Win32Taskbar.Native]::GetDisplayName($pidlBytes))
    $i += 5 + [int]$len
}
if ($names.Count -ne $expected.Count) { 'false'; return }
for ($j = 0; $j -lt $expected.Count; $j++) {
    if ($names[$j] -ne $expected[$j]) { 'false'; return }
}
'true'
`);
    return out.trim() === "true";
  },

  async set() {
    const pinsJson = JSON.stringify(PINS).replace(/'/g, "''");
    await runPwsh(`
$ErrorActionPreference = 'Stop'
if (-not ('Win32Taskbar.Native' -as [type])) {
    Add-Type -TypeDefinition @'
${SHARED_CS}
'@
}
$pins = '${pinsJson}' | ConvertFrom-Json
$taskbarDir = Join-Path $env:APPDATA 'Microsoft\\Internet Explorer\\Quick Launch\\User Pinned\\TaskBar'
if (-not (Test-Path -LiteralPath $taskbarDir)) {
    New-Item -ItemType Directory -Path $taskbarDir -Force | Out-Null
}

$expectedLnkNames = New-Object System.Collections.Generic.HashSet[string]([System.StringComparer]::OrdinalIgnoreCase)
$shell = New-Object -ComObject WScript.Shell

$favStream = New-Object System.IO.MemoryStream
$resStream = New-Object System.IO.MemoryStream

foreach ($pin in $pins) {
    $parsingName = $null
    if ($pin.target) {
        $targetExe = $ExecutionContext.InvokeCommand.ExpandString($pin.target)
        if (-not (Test-Path -LiteralPath $targetExe)) {
            throw "taskbar pin target missing: $targetExe"
        }
        $lnkName = "$($pin.name).lnk"
        $null = $expectedLnkNames.Add($lnkName)
        $lnkPath = Join-Path $taskbarDir $lnkName
        $sc = $shell.CreateShortcut($lnkPath)
        $sc.TargetPath = $targetExe
        $sc.WorkingDirectory = Split-Path -Path $targetExe -Parent
        $sc.IconLocation = "$targetExe,0"
        $sc.Save()
        $parsingName = $lnkPath
    } elseif ($pin.appId) {
        $parsingName = "shell:AppsFolder\\$($pin.appId)"
    } else {
        throw "invalid taskbar pin entry: $($pin.name)"
    }

    $pidlBytes = [Win32Taskbar.Native]::ParsePidl($parsingName)
    $resolveBytes = [Win32Taskbar.Native]::BuildResolveStream($pidlBytes)

    $favStream.WriteByte(0x00)
    $lenBytes = [BitConverter]::GetBytes([uint32]$pidlBytes.Length)
    $favStream.Write($lenBytes, 0, 4)
    $favStream.Write($pidlBytes, 0, $pidlBytes.Length)

    $resLenBytes = [BitConverter]::GetBytes([uint32]$resolveBytes.Length)
    $resStream.Write($resLenBytes, 0, 4)
    $resStream.Write($resolveBytes, 0, $resolveBytes.Length)
}
$favStream.WriteByte(0xFF)

# Remove stale .lnk files not in the declared pin list.
Get-ChildItem -LiteralPath $taskbarDir -Filter '*.lnk' -ErrorAction SilentlyContinue |
    Where-Object { -not $expectedLnkNames.Contains($_.Name) } |
    Remove-Item -Force -ErrorAction SilentlyContinue

# Stop explorer.exe before writing Taskband so it does not overwrite our state.
if (Get-Process -Name explorer -ErrorAction SilentlyContinue) {
    Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
    $deadline = (Get-Date).AddSeconds(5)
    while ((Get-Process -Name explorer -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 150
    }
}

$tbKey = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Taskband'
if (-not (Test-Path -LiteralPath $tbKey)) {
    New-Item -Path $tbKey -Force | Out-Null
}
$curChanges = (Get-ItemProperty -Path $tbKey -Name FavoritesChanges -ErrorAction SilentlyContinue).FavoritesChanges
$nextChanges = if ($null -ne $curChanges) { [int]$curChanges + 1 } else { 1 }

Set-ItemProperty -Path $tbKey -Name Favorites -Value ($favStream.ToArray()) -Type Binary
Set-ItemProperty -Path $tbKey -Name FavoritesResolve -Value ($resStream.ToArray()) -Type Binary
Set-ItemProperty -Path $tbKey -Name FavoritesVersion -Value 3 -Type DWord
Set-ItemProperty -Path $tbKey -Name FavoritesChanges -Value $nextChanges -Type DWord

if (-not (Get-Process -Name explorer -ErrorAction SilentlyContinue)) {
    Start-Process explorer.exe
}
`);
  },
});
