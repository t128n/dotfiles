import { mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { buildOpenTuiFrame } from "./composition";
import { renderPng } from "./png";
import { printTerminalPreview } from "./preview";
import {
  WALLPAPERS,
  validateWallpapers,
  type WallpaperId,
  type WallpaperSpec,
} from "./specs";
import { renderSvg } from "./svg";

const OUT_DIR = join(import.meta.dir, "..", "dist");

const VARIANT_LINES = WALLPAPERS.map(
  (spec) => `  ${spec.id.padEnd(8)} ${spec.width}x${spec.height}`
).join("\n");

const USAGE = `Usage: bun run generate [variant...] [--preview]

Variants:
${VARIANT_LINES}

With no variant, every wallpaper is generated. --preview prints a terminal
approximation instead of writing files.`;

function fail(message: string): never {
  console.error(`error: ${message}`);
  console.error(USAGE);
  process.exit(1);
}

function parseArgs(argv: string[]): { targets: readonly WallpaperSpec[]; preview: boolean } {
  const requested = new Set<WallpaperId>();
  let preview = false;

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      process.exit(0);
    }

    if (arg === "--preview") {
      preview = true;
      continue;
    }

    const id = arg.replace(/^--/, "") as WallpaperId;
    if (!WALLPAPERS.some((spec) => spec.id === id)) {
      fail(`unknown variant: ${arg}`);
    }
    requested.add(id);
  }

  const targets =
    requested.size === 0 ? WALLPAPERS : WALLPAPERS.filter((spec) => requested.has(spec.id));
  return { targets, preview };
}

function logPath(path: string): string {
  return relative(process.cwd(), path) || path;
}

const { targets, preview } = parseArgs(Bun.argv.slice(2));
validateWallpapers();

if (!preview) {
  mkdirSync(OUT_DIR, { recursive: true });
}

for (const spec of targets) {
  const frame = await buildOpenTuiFrame(spec);

  if (preview) {
    console.log(`=== ${spec.id} (${spec.width}x${spec.height}) ===`);
    printTerminalPreview(frame);
    continue;
  }

  const svgPath = join(OUT_DIR, `${spec.id}.svg`);
  const pngPath = join(OUT_DIR, `${spec.id}.png`);
  const svg = renderSvg(frame, spec);

  writeFileSync(svgPath, svg, "utf8");
  writeFileSync(pngPath, renderPng(svg));

  console.log(
    `wrote ${logPath(svgPath)} and ${logPath(pngPath)} (${spec.width}x${spec.height})`
  );
}
