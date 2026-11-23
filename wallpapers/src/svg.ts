import type { Frame } from "./composition";
import { CELL, cols, rows, type WallpaperSpec } from "./specs";
import { THEME } from "./theme";

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

export function renderSvg(frame: Frame, spec: WallpaperSpec): string {
  const width = cols(spec) * CELL.width;
  const height = rows(spec) * CELL.height;

  if (width !== spec.width || height !== spec.height) {
    throw new Error(
      `render size mismatch for ${spec.id}: ${width}x${height} != ${spec.width}x${spec.height}`
    );
  }

  const rects: string[] = [];

  for (let row = 0; row < frame.lines.length; row++) {
    const line = frame.lines[row]!;
    let col = 0;
    const y = row * CELL.height;

    for (const span of line.spans) {
      const spanCols = span.width || span.text.length;
      if (spanCols === 0) continue;

      const bg = rgbaToHex(span.bg);
      if (bg.alpha > 0 && bg.hex.toLowerCase() !== THEME.canvas.toLowerCase()) {
        rects.push(
          `<rect x="${col * CELL.width}" y="${y}" width="${spanCols * CELL.width}" height="${CELL.height}" fill="${bg.hex}"/>`
        );
      }

      col += spanCols;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="overflow:hidden;display:block">
  <defs>
    <!-- ${CELL.width * 2}x${CELL.height} atomic grid (2 cols x 1 row) -->
    <pattern id="cellGrid" width="${CELL.width * 2}" height="${CELL.height}" patternUnits="userSpaceOnUse">
      <path d="M ${CELL.width * 2} 0 L 0 0 0 ${CELL.height}" fill="none" stroke="${THEME.gridLine}" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${width}" height="${height}" fill="${THEME.canvas}"/>
  <rect width="${width}" height="${height}" fill="url(#cellGrid)"/>

  <g id="brackets">
    ${rects.join("\n    ")}
  </g>
</svg>
`;
}
