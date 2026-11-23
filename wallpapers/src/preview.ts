import type { Frame } from "./composition";

/**
 * Approximate terminal preview. It paints the captured cell backgrounds only;
 * the SVG grid is not rendered here. Useful for checking the mark before a PNG
 * is written.
 */
export function printTerminalPreview(frame: Frame): void {
  for (const line of frame.lines) {
    let out = "";

    for (const span of line.spans) {
      const bg = span.bg.buffer;
      const alpha = bg[3] ?? 255;

      if (alpha > 0) {
        const r = Math.round(bg[0] ?? 0);
        const g = Math.round(bg[1] ?? 0);
        const b = Math.round(bg[2] ?? 0);
        out += `\x1b[48;2;${r};${g};${b}m`;
      } else {
        out += "\x1b[49m";
      }

      out += span.text;
    }

    process.stdout.write(`${out}\x1b[0m\n`);
  }
}
