# Helium extensions

Helium installs Chrome Web Store extensions. Two policies control them; only one should be used per
extension.

## Current state

| ID | Name | Version | Installed | Forced |
|---|---|---|---|---|
| `ghmbeldphafepmbegfdlkpapadhbakde` | Proton Pass | 1.43.0 | yes | yes |
| `gbmdgpbipfallnflgajpaliibnhdgobh` | JSON Viewer (legacy) | — | **no** | yes, stale |
| `mfnicocicmmlkpjnaffgihfjhdgjkdjg` | browse (agent-browser) | 0.0.15 | yes | no |

The JSON Viewer entry is a leftover: the extension is no longer installable, so the policy errors and
nothing is installed. Remove it.

`browse` is the extension that pairs with the `browse`/agent-browser tooling. Force-install it only if
you want the same automation capability on every machine — it requests `debugger`, `tabs` and
`tabCapture`, which is wide access for a browser profile used manually.

## Forcelist

```
HKLM\SOFTWARE\Policies\Helium\ExtensionInstallForcelist
  1 = ghmbeldphafepmbegfdlkpapadhbakde;https://clients2.google.com/service/update2/crx
  2 = <next-id>;https://clients2.google.com/service/update2/crx
```

- Subkey values are `REG_SZ`, numbered sequentially from `1`.
- The update URL is always the Chrome Web Store one above for store extensions.
- Forced extensions cannot be removed or disabled by the user, and they reinstall if deleted.

## ExtensionSettings

Use this instead of the forcelist when you also want toolbar pinning or to block everything else:

```json
{
  "ghmbeldphafepmbegfdlkpapadhbakde": {
    "installation_mode": "force_installed",
    "update_url": "https://clients2.google.com/service/update2/crx",
    "toolbar_pin": "force_pinned"
  },
  "mfnicocicmmlkpjnaffgihfjhdgjkdjg": {
    "installation_mode": "force_installed",
    "update_url": "https://clients2.google.com/service/update2/crx",
    "toolbar_pin": "force_unpinned"
  }
}
```

`ExtensionSettings` is a `REG_SZ` value holding that JSON. It takes precedence over
`ExtensionInstallForcelist`, so keep each extension in exactly one of the two.

To allow nothing outside the list:

```
HKLM\SOFTWARE\Policies\Helium\ExtensionInstallBlocklist
  1 = *
```

This blocks user-installed extensions but still allows the forced set. It is a hard lock — expect it to
break workflows that rely on ad-hoc extensions.

## Finding an extension ID

`helium://extensions` with Developer mode on shows the ID under each card, or the store URL
(`.../detail/<slug>/<id>`). Verify an ID by checking the name in that page before adding it to a policy.

## Verification

1. `helium://policy` — the extension policies must show `OK`, and no extension may appear twice
   (forcelist *and* `ExtensionSettings`).
2. `helium://extensions` — forced extensions are listed without a remove button.
3. A forced extension that never appears usually means a dead store ID or a network/proxy block; the
   policy error table in `helium://policy` names it.
