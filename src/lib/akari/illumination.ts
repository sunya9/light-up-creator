import type { Pos, PuzzleDef } from "./types";
import { posToKey, keyToPos } from "./types";

const DIRECTIONS: readonly Pos[] = [
  { row: -1, col: 0 }, // up
  { row: 1, col: 0 }, // down
  { row: 0, col: -1 }, // left
  { row: 0, col: 1 }, // right
];

/**
 * 指定位置から上下左右に見えるセル一覧を返す（自身は含まない）。
 * 黒マスまたはグリッド端で停止する。
 */
export function getVisibleCells(grid: PuzzleDef, pos: Pos): Pos[] {
  const result: Pos[] = [];
  for (const dir of DIRECTIONS) {
    let r = pos.row + dir.row;
    let c = pos.col + dir.col;
    while (r >= 0 && r < grid.rows && c >= 0 && c < grid.cols) {
      if (grid.cells[r][c].kind === "black") break;
      result.push({ row: r, col: c });
      r += dir.row;
      c += dir.col;
    }
  }
  return result;
}

/**
 * 各方向の可視セルリストを返す（ソルバー用）。
 * 4要素の配列（上、下、左、右の順）。
 */
export function getVisibleCellsByDirection(grid: PuzzleDef, pos: Pos): string[][] {
  return DIRECTIONS.map((dir) => {
    const cells: string[] = [];
    let r = pos.row + dir.row;
    let c = pos.col + dir.col;
    while (r >= 0 && r < grid.rows && c >= 0 && c < grid.cols) {
      if (grid.cells[r][c].kind === "black") break;
      cells.push(posToKey({ row: r, col: c }));
      r += dir.row;
      c += dir.col;
    }
    return cells;
  });
}

/**
 * 与えられた電球セットから照射されるすべての白マスを返す。
 * 電球自身の位置も含む。黒マスは含まない。
 */
export function getIlluminatedCells(grid: PuzzleDef, bulbs: Set<string>): Set<string> {
  const lit = new Set<string>();
  for (const key of bulbs) {
    lit.add(key);
    const pos = keyToPos(key);
    for (const visible of getVisibleCells(grid, pos)) {
      lit.add(posToKey(visible));
    }
  }
  return lit;
}
