import type { PuzzleDef, Pos } from "./types";
import { posToKey } from "./types";
import { isBlack } from "./grid";

const ADJACENT_DIRS: readonly Pos[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/** 隣接する数字付き黒マスのうち、既に制約を満たしている（飽和）ものがあるか */
export function hasAdjacentSaturatedNumber(
  grid: PuzzleDef,
  pos: Pos,
  bulbs: Set<string>,
): boolean {
  for (const d of ADJACENT_DIRS) {
    const r = pos.row + d.row;
    const c = pos.col + d.col;
    if (r < 0 || r >= grid.rows || c < 0 || c >= grid.cols) continue;
    const cell = grid.cells[r][c];
    if (cell.kind !== "black" || cell.number === null) continue;
    let count = 0;
    for (const dd of ADJACENT_DIRS) {
      const rr = r + dd.row;
      const cc = c + dd.col;
      if (rr >= 0 && rr < grid.rows && cc >= 0 && cc < grid.cols) {
        if (bulbs.has(posToKey({ row: rr, col: cc }))) count++;
      }
    }
    if (count >= cell.number) return true;
  }
  return false;
}

type ToggleBulbResult =
  | { action: "remove_cross" }
  | { action: "remove_bulb" }
  | { action: "place_cross" }
  | { action: "place_bulb" }
  | { action: "reject" }
  | { action: "none" };

/**
 * 電球トグルの判定ロジック（純粋関数）
 * Editor (reducer) と Player の両方から使用
 */
export function toggleBulb(
  grid: PuzzleDef,
  pos: Pos,
  bulbs: Set<string>,
  crosses: Set<string>,
  illuminated: Set<string>,
): ToggleBulbResult {
  if (isBlack(grid, pos)) return { action: "none" };
  const key = posToKey(pos);

  if (crosses.has(key)) return { action: "remove_cross" };
  if (bulbs.has(key)) return { action: "remove_bulb" };

  if (illuminated.has(key)) {
    if (hasAdjacentSaturatedNumber(grid, pos, bulbs)) {
      return { action: "place_cross" };
    }
    return { action: "reject" };
  }

  if (hasAdjacentSaturatedNumber(grid, pos, bulbs)) {
    return { action: "place_cross" };
  }

  return { action: "place_bulb" };
}
