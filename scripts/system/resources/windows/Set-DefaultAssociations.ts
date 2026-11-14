// Default applications enforced via machine DefaultAssociationsConfiguration
// policy: Helium (web), NanaZip (archives), and Zed (text & code).
import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineResource } from "../../lib/types.ts";
import { invokeElevated, regGet, runPwsh } from "../../lib/windows.ts";

const ASSOCIATIONS_PATH = join(process.env.ProgramData || "C:\\ProgramData", "t128n", "DefaultAssociations.xml");
const POLICY_KEY = "HKLM:\\Software\\Policies\\Microsoft\\Windows\\System";

const TEXT_EXTENSIONS = [
  ".bash", ".bashrc", ".c", ".cc", ".cfg", ".cjs", ".cpp", ".cs", ".csv", ".cxx",
  ".diff", ".editorconfig", ".gitattributes", ".gitconfig", ".gitignore", ".go",
  ".h", ".hpp", ".hxx", ".ini", ".ipynb", ".java", ".js", ".json", ".jsx", ".log",
  ".lua", ".m", ".makefile", ".markdown", ".md", ".mjs", ".mk", ".php", ".plist",
  ".profile", ".properties", ".ps1", ".psd1", ".psgi", ".psm1", ".py", ".rb",
  ".rs", ".rst", ".sh", ".sql", ".tex", ".toml", ".ts", ".tsx", ".txt", ".xml",
  ".yaml", ".yml", ".zsh",
];

const BROWSER_IDENTIFIERS = ["http", "https", ".htm", ".html"];

const ARCHIVE_EXTENSIONS = [
  ".001", ".7z", ".arj", ".b64", ".br", ".bz2", ".bzip2", ".cab", ".cb7",
  ".cbr", ".cbz", ".cpio", ".deb", ".gz", ".gzip", ".lha", ".lz", ".lz4",
  ".lz5", ".lzh", ".lzma", ".lzma2", ".nupkg", ".rar", ".rpm", ".tar",
  ".taz", ".tbz", ".tbz2", ".tgz", ".tlz", ".tlz4", ".tlz5", ".tpz", ".txz",
  ".tz", ".tzst", ".tzstd", ".xar", ".xz", ".zip", ".zipx", ".z", ".zst",
  ".zstd",
];

async function resolveProgIds(): Promise<{ helium: string; nanazip: string }> {
  const extsJson = JSON.stringify(TEXT_EXTENSIONS);
  const out = await runPwsh(`
$ErrorActionPreference = 'Stop'
$helium = $null
foreach ($client in Get-ChildItem -LiteralPath 'HKCU:\\Software\\Clients\\StartMenuInternet' -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -like 'Helium*' }) {
    $p = (Get-ItemProperty -Path (Join-Path $client.PSPath 'Capabilities\\URLAssociations') -Name http -ErrorAction SilentlyContinue).http
    if ($p) { $helium = $p; break }
}
if (-not $helium) { throw 'Helium is not registered; install it with mise run apps' }

$nanazip = $null
foreach ($class in Get-ChildItem -LiteralPath 'HKCU:\\Software\\Classes' -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -like 'AppX*' }) {
    $model = (Get-ItemProperty -Path (Join-Path $class.PSPath 'Application') -Name AppUserModelID -ErrorAction SilentlyContinue).AppUserModelID
    if ($model -like '40174MouriNaruto.NanaZip_*') { $nanazip = $class.PSChildName; break }
}
if (-not $nanazip) { throw 'NanaZip is not registered; install it with mise run apps' }

$missing = @()
foreach ($ext in ('${extsJson}' | ConvertFrom-Json)) {
    if (-not (Test-Path -LiteralPath "HKCU:\\Software\\Classes\\Zed$ext")) {
        $missing += "Zed$ext"
    }
}
if ($missing.Count -gt 0) { throw "Zed does not register $($missing -join ', ')" }

@{ helium = $helium; nanazip = $nanazip } | ConvertTo-Json -Compress
`);
  return JSON.parse(out.trim()) as { helium: string; nanazip: string };
}

async function buildXml(): Promise<string> {
  const { helium, nanazip } = await resolveProgIds();
  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', "<DefaultAssociations>"];

  for (const id of BROWSER_IDENTIFIERS) {
    lines.push(`  <Association Identifier="${id}" ProgId="${helium}" ApplicationName="Helium" />`);
  }
  for (const ext of ARCHIVE_EXTENSIONS) {
    lines.push(`  <Association Identifier="${ext}" ProgId="${nanazip}" ApplicationName="NanaZip" />`);
  }
  for (const ext of TEXT_EXTENSIONS) {
    lines.push(`  <Association Identifier="${ext}" ProgId="Zed${ext}" ApplicationName="Zed" />`);
  }
  lines.push("</DefaultAssociations>");
  return `${lines.join("\n")}\n`;
}

export default defineResource({
  async test() {
    const xml = await buildXml();
    const policyPath = await regGet(POLICY_KEY, "DefaultAssociationsConfiguration");
    if (policyPath !== ASSOCIATIONS_PATH) return false;
    if (!existsSync(ASSOCIATIONS_PATH)) return false;
    const deployed = (await readFile(ASSOCIATIONS_PATH, "utf8")).replace(/\r\n/g, "\n");
    return deployed === xml;
  },

  async set() {
    const xml = await buildXml();
    const staging = join(tmpdir(), "t128n-DefaultAssociations.xml");
    await writeFile(staging, xml, "utf8");
    try {
      await invokeElevated(`
$ErrorActionPreference = 'Stop'
$path = '${ASSOCIATIONS_PATH.replace(/'/g, "''")}'
$directory = Split-Path -Path $path -Parent
if (-not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
}
Copy-Item -LiteralPath '${staging.replace(/'/g, "''")}' -Destination $path -Force
New-Item -Path '${POLICY_KEY}' -Force | Out-Null
Set-ItemProperty -Path '${POLICY_KEY}' -Name DefaultAssociationsConfiguration -Value $path -Type String
`);
    } finally {
      await rm(staging, { force: true }).catch(() => {});
    }
  },
});
