# Helium policies

Helium inherits Chromium's policy engine. Everything below was verified against the shipped
`chrome.dll` of 0.21.2.1 and the registry of this machine.

## Policy root

```
HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Helium
```

Evidence: the string `SOFTWARE\Policies\Helium` is compiled into `chrome.dll`;
`SOFTWARE\Policies\Chromium` is not referenced by it. A `Policies\Chromium` key on this machine is
therefore inert for Helium (it only affects a real Chromium build).

`HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Helium\Recommended` holds recommended policies: Helium applies
them as defaults that the profile may still change. The main key is locked.

## Value types

The registry loader converts values before the policy handlers see them, so the type decides whether a
policy works at all.

| Policy kind | Registry type | Example |
|---|---|---|
| Boolean | `REG_DWORD` `0` / `1` | `MetricsReportingEnabled = 0` |
| Integer / enum | `REG_DWORD` | `RestoreOnStartup = 1` |
| String | `REG_SZ` | `DefaultSearchProviderSearchURL` |
| JSON object/array | `REG_SZ` containing JSON | `ExtensionSettings`, `ManagedBookmarks` |
| List | **subkey**, values named `1`, `2`, `3`… (sequential) | `ExtensionInstallForcelist` |

`REG_SZ "0"` is **not** a valid boolean — the policy is ignored and shows up as an error in
`helium://policy`. This is the most common way a policy silently does nothing.

## Recommended set

| Policy | Type | Value | Why |
|---|---|---|---|
| `DefaultSearchProviderEnabled` | DWORD | `1` | pin search |
| `DefaultSearchProviderName` | SZ | `DuckDuckGo` | |
| `DefaultSearchProviderSearchURL` | SZ | `https://duckduckgo.com/?q={searchTerms}` | `{searchTerms}` is literal, no escaping needed |
| `DefaultSearchProviderSuggestURL` | SZ | `https://duckduckgo.com/ac/?q={searchTerms}&type=list` | optional |
| `MetricsReportingEnabled` | DWORD | `0` | verify: Helium may remove the metric client anyway |
| `BackgroundModeEnabled` | DWORD | `0` | no background process after closing |
| `HardwareAccelerationModeEnabled` | DWORD | `1` | |
| `BookmarkBarEnabled` | DWORD | `1` | |
| `ShowHomeButton` | DWORD | `0` | |
| `PasswordManagerEnabled` | DWORD | `0` | when using Proton Pass |
| `AutofillAddressEnabled` | DWORD | `0` | |
| `AutofillCreditCardEnabled` | DWORD | `0` | |
| `SyncDisabled` | DWORD | `1` | Helium has no sync service |
| `BrowserSignin` | DWORD | `0` | |
| `SearchSuggestEnabled` | DWORD | `1` or `0` | leaks keystrokes to the search engine |
| `DefaultBrowserSettingEnabled` | DWORD | `0` | stops the "make default" prompt |
| `RestoreOnStartup` | DWORD | `1` (last session) or `4` (URL list) | |
| `RestoreOnStartupURLs` | list subkey | URLs | only with `4` |
| `HomepageLocation` | SZ | URL | |
| `NewTabPageLocation` | SZ | URL | |
| `DownloadDirectory` | SZ | path | |
| `HttpsOnlyMode` | SZ | `force_enabled` | |
| `DnsOverHttpsMode` | SZ | `secure` | |
| `DnsOverHttpsTemplates` | SZ | provider template | with `secure` |
| `IncognitoModeAvailability` | DWORD | `0` enabled / `1` disabled | |
| `TranslateEnabled` | DWORD | `0` or `1` | |
| `ExtensionInstallForcelist` | list subkey | `id;update-url` | see [extensions.md](extensions.md) |
| `ExtensionSettings` | SZ JSON | per-extension rules | pinning, blocking |
| `ManagedBookmarks` | SZ JSON | `[{"toplevel_name":"…"},{"name":"…","url":"…"}]` | must be valid JSON |

Policies Helium may not implement (privacy-focused builds drop some components): `SafeBrowsingProtectionLevel`,
`MetricsReportingEnabled`, `UrlKeyedAnonymizedDataCollectionEnabled`. Confirm each in `helium://policy`
rather than assuming; an unimplemented policy simply never appears.

## Defects in the current registry

Both roots currently hold identical values. Problems:

1. **Duplicate root** — `HKLM\SOFTWARE\Policies\Chromium` is not read by Helium. Delete it (keep the
   key if a real Chromium build is ever installed).
2. **Booleans as `REG_SZ`** — `MetricsReportingEnabled`, `BookmarkBarEnabled`,
   `DefaultSearchProviderEnabled`, `HardwareAccelerationModeEnabled` are strings. Rewrite as `REG_DWORD`.
3. **`ManagedBookmarks = "0"`** — invalid JSON, so the policy errors out and bookmarks are not managed.
   Replace with a real array or delete the value.
4. **Stale forcelist entry** — `gbmdgpbipfallnflgajpaliibnhdgobh` is the discontinued *JSON Viewer*
   extension and is not installed. Remove it from `ExtensionInstallForcelist`.
5. **Nothing set for** startup pages, DoH, password manager, or extension pinning.

Fix by writing the values from [examples/policies.json](examples/policies.json) over the key, then
checking `helium://policy`.

## Applying at scale

The registry writes are plain values, so the same manifest works for:

- a per-machine script (`New-ItemProperty` with `-PropertyType DWord`),
- `reg import` of an exported `.reg`,
- Intune/DSC custom registry settings.

Helium ships no ADMX templates of its own; Chromium's ADMX can be reused for reference because the
policy names are identical, but the registry namespace differs (`Helium`, not `Chromium`).

## Verification

`helium://policy` shows every loaded policy with source, scope and status, and has **Reload policies**
plus JSON export. A value that is wrong-typed or invalid JSON appears in the errors table and is not
applied. Always check there after writing the registry; the key alone proves nothing.
