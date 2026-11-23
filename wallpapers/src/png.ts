import { Resvg } from "@resvg/resvg-js";

/** Rasterize the SVG at its declared pixel size, independent of platform. */
export function renderPng(svg: string): Uint8Array {
  const resvg = new Resvg(svg, { fitTo: { mode: "original" } });
  return resvg.render().asPng();
}
