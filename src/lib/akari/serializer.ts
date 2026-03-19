import type { PuzzleDef, CellType } from "./types";

/** パズル定義をコンパクトなJSON文字列にシリアライズ */
export function serialize(def: PuzzleDef): string {
  const compact = {
    r: def.rows,
    c: def.cols,
    /** 黒マスのみ記録: [row, col, number | -1] */
    b: [] as [number, number, number][],
  };
  for (let r = 0; r < def.rows; r++) {
    for (let c = 0; c < def.cols; c++) {
      const cell = def.cells[r][c];
      if (cell.kind === "black") {
        compact.b.push([r, c, cell.number ?? -1]);
      }
    }
  }
  return JSON.stringify(compact);
}

/** JSON文字列からパズル定義をデシリアライズ */
export function deserialize(json: string): PuzzleDef {
  const compact = JSON.parse(json) as { r: number; c: number; b: [number, number, number][] };
  const cells: CellType[][] = Array.from({ length: compact.r }, () =>
    Array.from({ length: compact.c }, (): CellType => ({ kind: "white" })),
  );
  for (const [r, c, n] of compact.b) {
    cells[r][c] = { kind: "black", number: n === -1 ? null : n };
  }
  return { rows: compact.r, cols: compact.c, cells };
}

/** パズルをURLハッシュ用にBase64エンコード */
export function toUrlHash(def: PuzzleDef): string {
  return btoa(serialize(def));
}

/** URLハッシュからパズルをデコード */
export function fromUrlHash(hash: string): PuzzleDef {
  return deserialize(atob(hash));
}
