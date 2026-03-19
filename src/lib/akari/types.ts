/** セルの種類 */
export type CellType = { kind: "white" } | { kind: "black"; number: number | null };

/** パズル定義（問題データ） */
export type PuzzleDef = {
  rows: number;
  cols: number;
  cells: CellType[][];
};

/** 座標 */
export type Pos = {
  row: number;
  col: number;
};

/** 電球配置状態 */
export type BulbState = {
  /** 電球が置かれている座標のセット ("row,col" 形式) */
  bulbs: Set<string>;
};

/** ソルバーのセル状態 */
export type SolverCell = "bulb" | "empty" | "undecided";

/** ソルバーの結果 */
export type SolveResult =
  | { kind: "unique"; solution: Set<string> }
  | { kind: "multiple" }
  | { kind: "none" };

/** セルキーのユーティリティ */
export function posToKey(pos: Pos): string {
  return `${pos.row},${pos.col}`;
}

export function keyToPos(key: string): Pos {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}
