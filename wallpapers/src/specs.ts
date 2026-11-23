export const CELL = { width: 24, height: 48 } as const;

export type WallpaperId = "desktop" | "mobile" | "tablet";

export interface WallpaperSpec {
  readonly id: WallpaperId;
  /** Output width in pixels; must be a whole number of CELL.width. */
  readonly width: number;
  /** Output height in pixels; must be a whole number of CELL.height. */
  readonly height: number;
}

export const WALLPAPERS: readonly WallpaperSpec[] = [
  { id: "desktop", width: 3840, height: 2160 },
  // iPhone 16 Pro is 1206x2622 (0.45995); 2208x4800 (0.46) matches that
  // aspect on the 24x48 cell grid without changing the mark's relative size.
  { id: "mobile", width: 2208, height: 4800 },
  // iPad 4:3.
  { id: "tablet", width: 2880, height: 2160 },
];

export function cols(spec: WallpaperSpec): number {
  return spec.width / CELL.width;
}

export function rows(spec: WallpaperSpec): number {
  return spec.height / CELL.height;
}

export function validateWallpapers(specs: readonly WallpaperSpec[] = WALLPAPERS): void {
  const seen = new Set<WallpaperId>();

  for (const spec of specs) {
    if (seen.has(spec.id)) {
      throw new Error(`duplicate wallpaper id: ${spec.id}`);
    }
    seen.add(spec.id);

    if (spec.width % CELL.width !== 0 || spec.height % CELL.height !== 0) {
      throw new Error(
        `${spec.id} (${spec.width}x${spec.height}) is not on the ${CELL.width}x${CELL.height}px cell grid`
      );
    }

    if (spec.width < CELL.width * 32 || spec.height < CELL.height * 8) {
      throw new Error(`${spec.id} (${spec.width}x${spec.height}) is too small for the mark`);
    }
  }
}
