# Wallpapers

Generated wallpapers built from the `[[ ]]` mark on a 24×48px terminal cell grid.

## Generate

```bash
bun install
bun run generate            # all variants
bun run generate mobile     # one variant: desktop, mobile, or tablet
bun run generate --preview  # terminal preview, no files written
```

Outputs are committed to `dist/`:

| Variant | Size | Files |
|---|---|---|
| desktop | 3840×2160 | `dist/desktop.svg`, `dist/desktop.png` |
| mobile | 2208×4800 | `dist/mobile.svg`, `dist/mobile.png` |
| tablet | 2880×2160 | `dist/tablet.svg`, `dist/tablet.png` |

The `mobile` size matches the iPhone 16 Pro aspect ratio (1206×2622). It is
2208×4800 on the cell grid so the mark keeps the same relative size as the other
variants; iOS scales it down to the device. If the mark still shifts when the
wallpaper is applied, disable Perspective Zoom in the wallpaper settings.

`dist/desktop.png` is the deploy contract: `mise.toml` symlinks `wallpapers/dist`
to `~/.local/share/t128n-dotfiles/wallpapers`, and the Windows system resource
reads `desktop.png` from there. Only `dist/` is deployed; `src/` and
`node_modules/` stay out of the symlink.

## Layout

- `src/specs.ts` — variants in output pixels, cell size, and validation.
- `src/theme.ts` — canvas, grid, and bracket colors.
- `src/composition.ts` — OpenTUI frame: one centered mark, scaled per variant.
- `src/svg.ts` — captured frame → SVG.
- `src/png.ts` — SVG → PNG via `@resvg/resvg-js` (works on macOS, Windows, and Linux).
- `src/preview.ts` — optional terminal preview.
- `src/main.ts` — CLI and file output.

Sizes are declared in pixels. `validateWallpapers()` fails if a variant does not
divide evenly by the cell grid, so the SVG and PNG always have the requested
dimensions.
