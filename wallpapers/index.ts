import { BoxRenderable, TextRenderable } from "@opentui/core";
import { createTestRenderer } from "@opentui/core/testing";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const COLS = 160;
const ROWS = 45;
const CELL_W = 24;
const CELL_H = 48;
const WIDTH = COLS * CELL_W; // 3840
const HEIGHT = ROWS * CELL_H; // 2160

const BG_CANVAS = "#1E1E1E";
const GRID_LINE = "#282828";
const PANEL_BG = "#181818";
const PANEL_BORDER = "#333333";
const ACCENT_PURPLE = "#7F6DF2";
const BRACKET_UPPER = "#6A6A6A";
const BRACKET_LOWER = "#4C4C4C";
const KBD_BG = "#282828";
const KBD_FG = "#EFEFEF";
const LABEL_FG = "#E8E8E8";
const HEADER_FG = "#808080";

interface Shortcut {
  label: string;
  keys: string[];
}

const SHORTCUTS: Shortcut[] = [
  { label: "Text Extractor (OCR)", keys: ["Win", "Shift", "T"] },
  { label: "Always on Top", keys: ["Win", "Ctrl", "T"] },
  { label: "Quake Summon", keys: ["Ctrl", "`"] },
];

function rgbaToHex(c: { buffer: ArrayLike<number> }): { hex: string; alpha: number } {
  const r = Math.round(c.buffer[0] ?? 0);
  const g = Math.round(c.buffer[1] ?? 0);
  const b = Math.round(c.buffer[2] ?? 0);
  const a = (c.buffer[3] ?? 255) / 255;
  const hex =
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("");
  return { hex, alpha: a };
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function addBracketPair(
  parent: BoxRenderable,
  renderer: Awaited<ReturnType<typeof createTestRenderer>>["renderer"],
  leftCol: number,
  topRow: number,
  isRight: boolean,
  upperColor: string,
  lowerColor: string
) {
  // Each square unit = 2 cols x 1 row (48x48px)
  // Bracket is 4 cols wide (2 square units), 8 rows tall (4 upper + 4 lower)
  const stemLeft = isRight ? leftCol + 2 : leftCol;

  // Upper 4 rows (#6A6A6A)
  parent.add(
    new BoxRenderable(renderer, {
      position: "absolute",
      left: leftCol,
      top: topRow,
      width: 4,
      height: 1,
      backgroundColor: upperColor,
    })
  );
  parent.add(
    new BoxRenderable(renderer, {
      position: "absolute",
      left: stemLeft,
      top: topRow + 1,
      width: 2,
      height: 3,
      backgroundColor: upperColor,
    })
  );

  // Lower 4 rows (#4C4C4C)
  parent.add(
    new BoxRenderable(renderer, {
      position: "absolute",
      left: stemLeft,
      top: topRow + 4,
      width: 2,
      height: 3,
      backgroundColor: lowerColor,
    })
  );
  parent.add(
    new BoxRenderable(renderer, {
      position: "absolute",
      left: leftCol,
      top: topRow + 7,
      width: 4,
      height: 1,
      backgroundColor: lowerColor,
    })
  );
}

async function buildOpenTuiFrame() {
  const setup = await createTestRenderer({ width: COLS, height: ROWS });
  const { renderer } = setup;

  try {
    const root = new BoxRenderable(renderer, {
      position: "relative",
      width: COLS,
      height: ROWS,
      backgroundColor: BG_CANVAS,
    });

    // Centerpiece: cell-constructed [[   ]] (8 rows tall, 4-square-unit center void)
    // Cols 66..93 (center at col 80)
    const topRow = 18;
    addBracketPair(root, renderer, 66, topRow, false, BRACKET_UPPER, BRACKET_LOWER); // outer [
    addBracketPair(root, renderer, 72, topRow, false, BRACKET_UPPER, BRACKET_LOWER); // inner [
    addBracketPair(root, renderer, 84, topRow, true, BRACKET_UPPER, BRACKET_LOWER); // inner ]
    addBracketPair(root, renderer, 90, topRow, true, BRACKET_UPPER, BRACKET_LOWER); // outer ]

    // Bottom-left grid-snapped Hotkeys panel (cols 8..49 = 42 cols; rows 32..40 = 9 rows, 4 rows from bottom)
    const panel = new BoxRenderable(renderer, {
      position: "absolute",
      left: 8,
      top: 32,
      width: 42,
      height: 9,
      backgroundColor: PANEL_BG,
      border: true,
      borderStyle: "single",
      borderColor: PANEL_BORDER,
      flexDirection: "column",
      paddingLeft: 1,
      paddingRight: 1,
    });

    // Header row
    panel.add(
      new TextRenderable(renderer, {
        content: "> HOTKEYS",
        fg: HEADER_FG,
        height: 1,
      })
    );

    // Shortcut rows (2 rows per item: 1 spacer + 1 content row)
    for (const item of SHORTCUTS) {
      panel.add(
        new BoxRenderable(renderer, {
          width: "100%",
          height: 1,
          border: ["top"],
          borderStyle: "single",
          borderColor: "#282828",
        })
      );

      const row = new BoxRenderable(renderer, {
        width: "100%",
        height: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      });

      row.add(
        new TextRenderable(renderer, {
          content: item.label,
          fg: LABEL_FG,
        })
      );

      const keysBox = new BoxRenderable(renderer, {
        flexDirection: "row",
        gap: 1,
      });

      for (const k of item.keys) {
        keysBox.add(
          new TextRenderable(renderer, {
            content: ` ${k} `,
            fg: KBD_FG,
            bg: KBD_BG,
          })
        );
      }

      row.add(keysBox);
      panel.add(row);
    }

    root.add(panel);
    renderer.root.add(root);

    await setup.renderOnce();
    return setup.captureSpans();
  } finally {
    renderer.destroy();
  }
}

function renderSvgFromSpans(frame: Awaited<ReturnType<typeof buildOpenTuiFrame>>): string {
  const bgRects: string[] = [];
  const textEls: string[] = [];

  for (let row = 0; row < frame.lines.length; row++) {
    const line = frame.lines[row]!;
    let col = 0;
    const y = row * CELL_H;

    for (const span of line.spans) {
      const spanCols = span.width || span.text.length;
      const x = col * CELL_W;
      const w = spanCols * CELL_W;

      const bg = rgbaToHex(span.bg);
      if (bg.alpha > 0 && bg.hex.toLowerCase() !== BG_CANVAS.toLowerCase()) {
        bgRects.push(`<rect x="${x}" y="${y}" width="${w}" height="${CELL_H}" fill="${bg.hex}"/>`);
      }

      if (span.text.trim().length > 0) {
        const fg = rgbaToHex(span.fg);
        // Render character by character on exact terminal cell centers so monospace grid never drifts
        let charCol = col;
        for (const ch of span.text) {
          if (ch !== " ") {
            const cx = charCol * CELL_W + CELL_W / 2;
            const cy = y + CELL_H * 0.72;
            const cellX = charCol * CELL_W;
            const midY = y + CELL_H / 2;
            const boxPath =
              ch === "─" ? `M ${cellX} ${midY} H ${cellX + CELL_W}` :
              ch === "│" ? `M ${cx} ${y} V ${y + CELL_H}` :
              ch === "┌" ? `M ${cx} ${y + CELL_H} V ${midY} H ${cellX + CELL_W}` :
              ch === "┐" ? `M ${cellX} ${midY} H ${cx} V ${y + CELL_H}` :
              ch === "└" ? `M ${cx} ${y} V ${midY} H ${cellX + CELL_W}` :
              ch === "┘" ? `M ${cellX} ${midY} H ${cx} V ${y}` :
              null;

            if (boxPath) {
              textEls.push(`<path d="${boxPath}" fill="none" stroke="${fg.hex}" stroke-width="1"/>`);
            } else {
              textEls.push(
                `<text x="${cx}" y="${cy}" text-anchor="middle" fill="${fg.hex}">${escapeXml(ch)}</text>`
              );
            }
          }
          charCol += 1;
        }
      }

      col += spanCols;
    }
  }

  // 2px Obsidian purple accent stripe down the left edge of the OpenTUI Hotkeys panel (col 8, rows 32..41)
  const panelX = 8 * CELL_W;
  const panelY = 32 * CELL_H;
  const panelH = 9 * CELL_H;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" style="overflow:hidden;display:block">
  <defs>
    <!-- 48px square atomic grid (2 cols x 1 row) -->
    <pattern id="cellGrid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="${GRID_LINE}" stroke-width="1"/>
    </pattern>
    <style>
      text {
        font-family: 'Cascadia Code', 'Cascadia Mono', 'Consolas', monospace;
        font-size: 36px;
        font-weight: 500;
      }
    </style>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_CANVAS}"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#cellGrid)"/>

  <g id="opentui-bg">
    ${bgRects.join("\n    ")}
  </g>

  <!-- 4px Obsidian purple accent stripe on left edge of Hotkeys panel -->
  <rect x="${panelX}" y="${panelY}" width="4" height="${panelH}" fill="${ACCENT_PURPLE}"/>

  <g id="opentui-fg">
    ${textEls.join("\n    ")}
  </g>
</svg>
`;
}

function exportPngWithEdge(svgPath: string, pngPath: string) {
  const edgeExe = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const userDataDir = join(tmpdir(), `edge-opentui-${Date.now()}`);
  const url = pathToFileURL(svgPath).href;

  const res = Bun.spawnSync([
    edgeExe,
    "--headless=new",
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--force-device-scale-factor=1",
    `--window-size=${WIDTH},${HEIGHT}`,
    `--screenshot=${pngPath}`,
    url,
  ]);

  rmSync(userDataDir, { recursive: true, force: true });

  if (res.exitCode !== 0) {
    throw new Error(`Edge headless exited with code ${res.exitCode}: ${res.stderr.toString()}`);
  }
}

function printTerminalPreview(frame: Awaited<ReturnType<typeof buildOpenTuiFrame>>) {
  for (const line of frame.lines) {
    let out = "";
    for (const span of line.spans) {
      const fgR = Math.round(span.fg.buffer[0] ?? 255);
      const fgG = Math.round(span.fg.buffer[1] ?? 255);
      const fgB = Math.round(span.fg.buffer[2] ?? 255);
      const bgR = Math.round(span.bg.buffer[0] ?? 30);
      const bgG = Math.round(span.bg.buffer[1] ?? 30);
      const bgB = Math.round(span.bg.buffer[2] ?? 30);
      const bgA = span.bg.buffer[3] ?? 255;

      const bgSeq = bgA > 0 ? `\x1b[48;2;${bgR};${bgG};${bgB}m` : `\x1b[48;2;30;30;30m`;
      const fgSeq = `\x1b[38;2;${fgR};${fgG};${fgB}m`;
      out += `${bgSeq}${fgSeq}${span.text}`;
    }
    process.stdout.write(`${out}\x1b[0m\n`);
  }
}

const isPreview = Bun.argv.includes("--preview");
const frame = await buildOpenTuiFrame();

if (isPreview) {
  printTerminalPreview(frame);
} else {
  const svg = renderSvgFromSpans(frame);

  const svgPath = resolve(import.meta.dir, "Wallpaper.svg");
  const pngPath = resolve(import.meta.dir, "Wallpaper.png");

  writeFileSync(svgPath, svg, "utf8");
  exportPngWithEdge(svgPath, pngPath);

  console.log(`Generated ${svgPath} and ${pngPath} from OpenTUI (${COLS}x${ROWS} cells -> ${WIDTH}x${HEIGHT}px)`);
}
