# First-run profile seed (`master_preferences`)

Helium's own settings — layout, zen mode, centered location bar — have no enterprise policy. They live in
`User Data\Default\Preferences` under the `helium` key. The supported way to standardize them is to seed
them at profile creation time.

## File placement

```
%LOCALAPPDATA%\imput\Helium\Application\master_preferences
```

No extension in the name. It sits next to `chrome.exe`, one level above the versioned directory, so it
survives Helium updates. Chromium reads it while creating a profile, then never again for that profile.

- Applies to **new profiles only**. Existing profiles keep their current settings; changing the file
  does not rewrite them.
- Values not understood by the running version are ignored; nothing breaks.
- It is not a full `Preferences` copy. Keep it to keys you actually want to seed.

## Example

```json
{
  "helium": {
    "completed_onboarding": true,
    "services": { "schema_version": 1, "user_consented": true },
    "browser": {
      "centered_location_bar": true,
      "layout": 0,
      "minimal_location_bar": false,
      "rounded_frame": true,
      "zen_mode": false,
      "zen_mode_sidebar_pinned": true,
      "zen_mode_top_chrome_pinned": true
    }
  },
  "bookmark_bar": { "show_on_all_tabs": true },
  "browser": { "show_home_button": false },
  "session": { "restore_on_startup": 1 },
  "profile": { "name": "Your Helium" },
  "distribution": {
    "skip_first_run_ui": true,
    "make_chrome_default": false,
    "suppress_first_run_default_browser_prompt": true
  }
}
```

## Helium-specific keys

Observed on 0.21.2.1 in `Preferences → helium`:

| Key | Type | Meaning |
|---|---|---|
| `completed_onboarding` | bool | skip the first-run onboarding |
| `services.schema_version` | int | schema of the services consent block |
| `services.user_consented` | bool | consent to Helium services |
| `browser.layout` | int | tab layout; `0` on the current profile, other values undocumented |
| `browser.zen_mode` | bool | zen mode |
| `browser.zen_mode_sidebar_pinned` | bool | |
| `browser.zen_mode_top_chrome_pinned` | bool | |
| `browser.centered_location_bar` | bool | centered omnibox |
| `browser.minimal_location_bar` | bool | |
| `browser.rounded_frame` | bool | |

There is no public schema for these. To discover a value: change the setting in Helium, close it, and diff
`Preferences` against a backup. Do that per version you care about rather than guessing enum values.

## Relationship to policies

Where a policy exists, the policy wins and the seed is irrelevant. For example `BookmarkBarEnabled` (policy)
overrides `bookmark_bar.show_on_all_tabs` (seed). Keep the seed for the `helium.*` block and anything else
without a policy.

## Testing

Do not test on your real profile:

```powershell
& "$env:LOCALAPPDATA\imput\Helium\Application\chrome.exe" --user-data-dir="$env:TEMP\helium-test"
```

A fresh `--user-data-dir` is a new profile, so the seed applies. Check that onboarding is skipped, the
layout matches, and no first-run tabs appear. Delete `$env:TEMP\helium-test` afterwards.

## Alternatives considered

| Approach | Verdict |
|---|---|
| Copy the whole `User Data` folder between machines | breaks: profile GUIDs, timestamps, site data, version-coupled schema |
| Ship a `Preferences` file | overwrites bookmarks, history and extension state; schema drifts per Chromium bump |
| Merge selected keys into an existing `Preferences` | only viable with Helium closed and a backup; version-fragile, no verification surface |
| `master_preferences` | supported first-run path, ignored when malformed, survives updates |

For an existing profile the honest answer is: set the few Helium toggles by hand once, and let policies
carry everything that must be enforced.
