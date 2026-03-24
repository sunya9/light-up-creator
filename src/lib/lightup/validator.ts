import type { Pos, PuzzleDef } from "./types";
import { posToKey } from "./types";
import { getIlluminatedCells, getVisibleCells } from "./illumination";

type ValidationError =
  | { kind: "unlit"; pos: Pos }
  | { kind: "conflict"; pos1: Pos; pos2: Pos }
  | { kind: "number"; pos: Pos; expected: number; actual: number };

type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

const ADJACENT: readonly Pos[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

function getAdjacentWhiteWithBulb(
  grid: PuzzleDef,
  pos: Pos,
  bulbs: Set<string>,
): number {
  let count = 0;
  for (const d of ADJACENT) {
    const r = pos.row + d.row;
    const c = pos.col + d.col;
    if (r >= 0 && r < grid.rows && c >= 0 && c < grid.cols) {
      if (
        grid.cells[r][c].kind === "white" &&
        bulbs.has(posToKey({ row: r, col: c }))
      ) {
        count++;
      }
    }
  }
  return count;
}

/** 完成した解を検証する */
export function validate(
  grid: PuzzleDef,
  bulbs: Set<string>,
): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. 電球同士の衝突チェック
  for (const key of bulbs) {
    const [row, col] = key.split(",").map(Number);
    const pos: Pos = { row, col };
    const visible = getVisibleCells(grid, pos);
    for (const v of visible) {
      const vKey = posToKey(v);
      if (bulbs.has(vKey)) {
        // 重複回避: 小さいキーからのみ報告
        if (key < vKey) {
          errors.push({ kind: "conflict", pos1: pos, pos2: v });
        }
      }
    }
  }

  // 2. 全白マス照射チェック
  const lit = getIlluminatedCells(grid, bulbs);
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (
        grid.cells[r][c].kind === "white" &&
        !lit.has(posToKey({ row: r, col: c }))
      ) {
        errors.push({ kind: "unlit", pos: { row: r, col: c } });
      }
    }
  }

  // 3. 数字付き黒マスの制約チェック
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const cell = grid.cells[r][c];
      if (cell.kind === "black" && cell.number !== null) {
        const actual = getAdjacentWhiteWithBulb(
          grid,
          { row: r, col: c },
          bulbs,
        );
        if (actual !== cell.number) {
          errors.push({
            kind: "number",
            pos: { row: r, col: c },
            expected: cell.number,
            actual,
          });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
