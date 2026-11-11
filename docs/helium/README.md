# Helium — standardized configuration

Notes for reproducing the same Helium setup on every machine. Documentation only: nothing here is
applied automatically yet.

Verified against **Helium 0.21.2.1** on 2026-11-11.

## Layers

| Layer | Mechanism | Scope | Survives |
|---|---|---|---|
| 1. Machine policy | `HKLM\SOFTWARE\Policies\Helium` | all profiles, all users | profile reset, reinstall |
| 2. First-run seed | `master_preferences` next to `chrome.exe` | new profiles only | Helium updates |
| 3. Per-profile state | `User Data\Default\Preferences` | one profile | nothing reliable |

Use layer 1 for anything that must be identical everywhere. Use layer 2 for Helium's own UI settings,
which have no policy. Do not standardize by copying `User Data` — it carries profile GUIDs, timestamps
and site data, and breaks on update.

## Install

Helium installs per user into `%LOCALAPPDATA%\imput\Helium` and self-updates through WinSparkle, so
pin the package, not the version:

```powershell
winget install --id ImputNet.Helium -e --accept-package-agreements --accept-source-agreements
```

The version directory (`Application\0.21.2.1\`) changes on update. Anything that must survive updates
belongs one level up, in `Application\`.

## Documents

| File | Contents |
|---|---|
| [policies.md](policies.md) | policy root, value types, recommended set, known defects in the current registry |
| [extensions.md](extensions.md) | forced extensions, current IDs, `ExtensionSettings` recipes |
| [master-preferences.md](master-preferences.md) | first-run profile seed, Helium-specific prefs, testing |
| [examples/policies.json](examples/policies.json) | desired policy values, typed |
| [examples/master_preferences.json](examples/master_preferences.json) | desired first-run profile |

## Current state on this machine

Already present under `HKLM\SOFTWARE\Policies\Helium` (and duplicated under the unused
`Policies\Chromium`): DuckDuckGo as default search, metrics off, bookmark bar on, hardware acceleration
on, Proton Pass force-installed. Several values are the wrong type and one policy is invalid JSON — see
[policies.md](policies.md#defects-in-the-current-registry).

## Apply and verify

1. Export the current keys first: `reg export "HKLM\SOFTWARE\Policies\Helium" helium-backup.reg /y`
2. Write the values from `examples/policies.json` (elevated).
3. Copy `master_preferences` into `%LOCALAPPDATA%\imput\Helium\Application\`.
4. Restart Helium, open `helium://policy`, click **Reload policies**.
5. Every row must show status `OK` with source `Platform`. Any row in the errors table is a type or
   JSON problem, not a Helium bug.
6. Test the profile seed against a throwaway profile:

   ```powershell
   & "$env:LOCALAPPDATA\imput\Helium\Application\chrome.exe" --user-data-dir="$env:TEMP\helium-test"
   ```

   Onboarding should be skipped and the layout should match the seed.

## Rollback

```powershell
Remove-Item 'HKLM:\SOFTWARE\Policies\Helium' -Recurse -Force
Remove-Item "$env:LOCALAPPDATA\imput\Helium\Application\master_preferences" -Force
```

Or restore `helium-backup.reg` and restart Helium.

## Not yet decided

- Locked policies (main key) vs recommended defaults (`\Recommended` subkey).
- Whether the `browse` extension is force-installed like Proton Pass.
- Search provider beyond DuckDuckGo, startup pages, DoH provider.
