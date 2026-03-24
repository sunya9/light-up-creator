import type { PuzzleDef } from "./types";
import { posToKey } from "./types";
import { getVisibleCells } from "./illumination";
import { validate } from "./validator";

export interface PlayState {
  conflicts: Set<string>;
  numberErrors: Set<string>;
  isSolved: boolean;
}

export function computePlayState(
  grid: PuzzleDef,
  bulbs: Set<string>,
): PlayState {
  // conflicts: bulbs that can see each other
  const conflicts = new Set<string>();
  for (const key of bulbs) {
    const [row, col] = key.split(",").map(Number);
    const visible = getVisibleCells(grid, { row, col });
    for (const v of visible) {
      const vKey = posToKey(v);
      if (bulbs.has(vKey)) {
        conflicts.add(key);
        conflicts.add(vKey);
      }
    }
  }

  // numberErrors: only show when all cells are lit
  const { errors } = validate(grid, bulbs);
  const hasUnlit = errors.some((e) => e.kind === "unlit");
  let numberErrors: Set<string>;
  if (hasUnlit) {
    numberErrors = new Set();
  } else {
    const numErrors = errors.filter((e) => e.kind === "number");
    numberErrors = new Set(numErrors.map((e) => posToKey(e.pos)));
  }

  const isSolved = errors.length === 0 && bulbs.size > 0;

  return { conflicts, numberErrors, isSolved };
}
