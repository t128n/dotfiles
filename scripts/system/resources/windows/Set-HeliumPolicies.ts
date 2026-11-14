// Helium browser policies under HKCU\Software\Policies\Helium.
// Verify active policies inside the browser at helium://policy.
import { defineResource } from "../../lib/types.ts";
import { invokeElevated, testRegistryTargets, type RegistryTarget } from "../../lib/windows.ts";

const HELIUM_POLICY_KEY = "HKCU:\\Software\\Policies\\Helium";

const TARGETS: RegistryTarget[] = [
  // UI & startup
  { path: HELIUM_POLICY_KEY, name: "BookmarkBarEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "ShowHomeButton", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "RestoreOnStartup", value: 1, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "DefaultBrowserSettingEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "PromotionalTabsEnabled", value: 0, type: "DWord" },

  // Password manager & autofill
  { path: HELIUM_POLICY_KEY, name: "PasswordManagerEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "AutofillAddressEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "AutofillCreditCardEnabled", value: 0, type: "DWord" },

  // Privacy, network & popups
  { path: HELIUM_POLICY_KEY, name: "HttpsOnlyMode", value: "force_enabled", type: "String" },
  { path: HELIUM_POLICY_KEY, name: "DnsOverHttpsMode", value: "automatic", type: "String" },
  { path: HELIUM_POLICY_KEY, name: "MetricsReportingEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "SearchSuggestEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "TranslateEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "SpellcheckEnabled", value: 1, type: "DWord" },
  { path: `${HELIUM_POLICY_KEY}\\SpellcheckLanguage`, name: "1", value: "en-US", type: "String" },

  // Downloads
  { path: HELIUM_POLICY_KEY, name: "PromptForDownloadLocation", value: 0, type: "DWord" },
];

export default defineResource({
  async test() {
    return testRegistryTargets(TARGETS);
  },

  async set() {
    const json = JSON.stringify(TARGETS).replace(/'/g, "''");
    await invokeElevated(`
$ErrorActionPreference = 'Stop'
$targets = '${json}' | ConvertFrom-Json
foreach ($t in $targets) {
    if (-not (Test-Path -LiteralPath $t.path)) {
        New-Item -Path $t.path -Force | Out-Null
    }
    Set-ItemProperty -Path $t.path -Name $t.name -Value $t.value -Type $t.type
}
`);
  },
});
