import { BoxRenderable } from "@opentui/core";
import { createTestRenderer } from "@opentui/core/testing";
import { cols, rows, type WallpaperSpec } from "./specs";
import { THEME } from "./theme";

/**
 * The mark is 28 columns wide, left to right:
 *
 *   4-col outer bracket + 2-col gap + 4-col inner bracket + 8-col inner gap
 *   + 4-col inner bracket + 2-col gap + 4-col outer bracket
 *
 * Each bracket is 8 rows tall: 4 upper rows in `bracketUpper`, 4 lower rows in
 * `bracketLower`.
 */
const BRACKET_WIDTH = 4;
const BRACKET_HEIGHT = 8;
const BRACKET_HALF = BRACKET_HEIGHT / 2;
const OUTER_GAP = 2;
const INNER_GAP = 8;
const MARK_WIDTH = BRACKET_WIDTH * 4 + OUTER_GAP * 2 + INNER_GAP;
const HALF_WIDTH = MARK_WIDTH / 2;

type Renderer = Awaited<ReturnType<typeof createTestRenderer>>["renderer"];

function addBracketPair(
  parent: BoxRenderable,
  renderer: Renderer,
  leftCol: number,
  topRow: number,
  isRight: boolean
): void {
  // The stem sits on the inner edge of each bracket.
  const stemLeft = isRight ? leftCol + BRACKET_WIDTH / 2 : leftCol;

  parent.add(
    new BoxRenderable(renderer, {
      position: "absolute",
      left: leftCol,
      top: topRow,
      width: BRACKET_WIDTH,
      height: 1,
      backgroundColor: THEME.bracketUpper,
    })
  );
  parent.add(
    new BoxRenderable(renderer, {
      position: "absolute",
      left: stemLeft,
      top: topRow + 1,
      width: BRACKET_WIDTH / 2,
      height: BRACKET_HALF - 1,
      backgroundColor: THEME.bracketUpper,
    })
  );
  parent.add(
    new BoxRenderable(renderer, {
      position: "absolute",
      left: stemLeft,
      top: topRow + BRACKET_HALF,
      width: BRACKET_WIDTH / 2,
      height: BRACKET_HALF - 1,
      backgroundColor: THEME.bracketLower,
    })
  );
  parent.add(
    new BoxRenderable(renderer, {
      position: "absolute",
      left: leftCol,
      top: topRow + BRACKET_HEIGHT - 1,
      width: BRACKET_WIDTH,
      height: 1,
      backgroundColor: THEME.bracketLower,
    })
  );
}

export async function buildOpenTuiFrame(spec: WallpaperSpec) {
  const setup = await createTestRenderer({ width: cols(spec), height: rows(spec) });
  const { renderer } = setup;

  try {
    const root = new BoxRenderable(renderer, {
      position: "relative",
      width: cols(spec),
      height: rows(spec),
      backgroundColor: THEME.canvas,
    });

    const centerCol = Math.floor(cols(spec) / 2);
    const topRow = Math.floor((rows(spec) - BRACKET_HEIGHT) / 2);

    const leftOuter = centerCol - HALF_WIDTH;
    const leftInner = leftOuter + BRACKET_WIDTH + OUTER_GAP;
    const rightInner = centerCol + INNER_GAP / 2;
    const rightOuter = rightInner + BRACKET_WIDTH + OUTER_GAP;

    addBracketPair(root, renderer, leftOuter, topRow, false);
    addBracketPair(root, renderer, leftInner, topRow, false);
    addBracketPair(root, renderer, rightInner, topRow, true);
    addBracketPair(root, renderer, rightOuter, topRow, true);

    renderer.root.add(root);

    await setup.renderOnce();
    return setup.captureSpans();
  } finally {
    renderer.destroy();
  }
}

export type Frame = Awaited<ReturnType<typeof buildOpenTuiFrame>>;
