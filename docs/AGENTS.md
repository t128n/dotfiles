# Docs Notes

- `docs/` is reference material only. Nothing here is deployed to `$HOME`; deployment is `home/` plus the `[dotfiles]` entries in `mise.toml`.
- One folder per topic, with `README.md` as its entry point. Add subfolders (`examples/`, `assets/`) only when the topic needs them.
- Claims about third-party software are checked against the installed build, and the doc names the version and date it was verified against.
- `docs/helium/` covers Helium policy and profile standardization; its examples are not applied by any task yet.
