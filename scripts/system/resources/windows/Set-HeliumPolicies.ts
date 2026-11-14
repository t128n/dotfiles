// Helium browser policies under HKCU\Software\Policies\Helium.
// Verify active policies inside the browser at helium://policy.
import { $ } from "bun";
import { defineResource } from "../../lib/types.ts";
import { regGet, setRegistryTargets, testRegistryTargets, type RegistryTarget } from "../../lib/windows.ts";

const HELIUM_POLICY_KEY = "HKCU:\\Software\\Policies\\Helium";
const REMOVED_POLICIES = [
  "RestoreOnStartup",
  "MetricsReportingEnabled",
  "AutofillAddressEnabled",
  "AutofillCreditCardEnabled",
  "PromotionalTabsEnabled",
];

const TARGETS: RegistryTarget[] = [
  // UI & startup
  { path: HELIUM_POLICY_KEY, name: "BookmarkBarEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "ShowHomeButton", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "DefaultBrowserSettingEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "DeveloperToolsAvailability", value: 1, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "HardwareAccelerationModeEnabled", value: 1, type: "DWord" },

  // Password manager & payments
  { path: HELIUM_POLICY_KEY, name: "PasswordManagerEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "PaymentMethodQueryEnabled", value: 0, type: "DWord" },

  // Privacy, network & popups
  { path: HELIUM_POLICY_KEY, name: "HttpsOnlyMode", value: "force_enabled", type: "String" },
  { path: HELIUM_POLICY_KEY, name: "DnsOverHttpsMode", value: "automatic", type: "String" },
  { path: HELIUM_POLICY_KEY, name: "NetworkPredictionOptions", value: 2, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "BackgroundModeEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "SearchSuggestEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "TranslateEnabled", value: 0, type: "DWord" },
  { path: HELIUM_POLICY_KEY, name: "SpellcheckEnabled", value: 1, type: "DWord" },
  { path: `${HELIUM_POLICY_KEY}\\SpellcheckLanguage`, name: "1", value: "en-US", type: "String" },

  // Downloads
  { path: HELIUM_POLICY_KEY, name: "PromptForDownloadLocation", value: 0, type: "DWord" },
];

export default defineResource({
  async test() {
    for (const name of REMOVED_POLICIES) {
      if ((await regGet(HELIUM_POLICY_KEY, name)) !== null) return false;
    }
    return testRegistryTargets(TARGETS);
  },

  async set() {
    await setRegistryTargets(TARGETS);
    for (const name of REMOVED_POLICIES) {
      if ((await regGet(HELIUM_POLICY_KEY, name)) !== null) {
        const res = await $`reg.exe delete HKCU\\Software\\Policies\\Helium /v ${name} /f`.nothrow().quiet();
        if (res.exitCode !== 0) {
          throw new Error(`reg delete HKCU\\Software\\Policies\\Helium\\${name} failed`);
        }
      }
    }
  },
});
