import type { CellType, Pos, PuzzleDef } from "./types";

/** 全マス白の空グリッドを生成 */
export function createEmptyGrid(rows: number, cols: number): PuzzleDef {
  const cells: CellType[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): CellType => ({ kind: "white" })),
  );
  return { rows, cols, cells };
}

/** 指定位置のセルを変更した新しいグリッドを返す（イミュータブル） */
export function setCell(grid: PuzzleDef, pos: Pos, cell: CellType): PuzzleDef {
  const cells = grid.cells.map((row, r) =>
    r === pos.row ? row.map((c, ci) => (ci === pos.col ? cell : c)) : row,
  );
  return { ...grid, cells };
}

export function isWhite(grid: PuzzleDef, pos: Pos): boolean {
  return grid.cells[pos.row][pos.col].kind === "white";
}

export function isBlack(grid: PuzzleDef, pos: Pos): boolean {
  return grid.cells[pos.row][pos.col].kind === "black";
}

/** 黒マスの数字を返す。白マスまたは数字なし黒マスは null */
export function getNumber(grid: PuzzleDef, pos: Pos): number | null {
  const cell = grid.cells[pos.row][pos.col];
  return cell.kind === "black" ? cell.number : null;
}
