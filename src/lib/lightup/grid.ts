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

/** 既存の内容を保持したままリサイズ。拡大時は白マスで埋める */
export function resizeGrid(
  grid: PuzzleDef,
  rows: number,
  cols: number,
): PuzzleDef {
  const cells: CellType[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c): CellType => {
      if (r < grid.rows && c < grid.cols) return grid.cells[r][c];
      return { kind: "white" };
    }),
  );
  return { rows, cols, cells };
}

/** 縮小時に失われるセルのうち白マスでないものがあるか判定 */
export function hasContentOutsideBounds(
  grid: PuzzleDef,
  newRows: number,
  newCols: number,
): boolean {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (r >= newRows || c >= newCols) {
        if (grid.cells[r][c].kind !== "white") return true;
      }
    }
  }
  return false;
}

/** 黒マスの数字を返す。白マスまたは数字なし黒マスは null */
export function getNumber(grid: PuzzleDef, pos: Pos): number | null {
  const cell = grid.cells[pos.row][pos.col];
  return cell.kind === "black" ? cell.number : null;
}
