import * as v from "valibot";
import type { PuzzleDef, CellType } from "./types";

/** シリアライズ済みパズルのコンパクト形式スキーマ */
const CompactPuzzleSchema = v.object({
  r: v.number(),
  c: v.number(),
  b: v.array(v.tuple([v.number(), v.number(), v.number()])),
});

/** サイズ取得用の軽量スキーマ */
const DimensionsSchema = v.object({
  r: v.number(),
  c: v.number(),
});

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
export function deserialize(json: string): PuzzleDef | null {
  const result = v.safeParse(CompactPuzzleSchema, JSON.parse(json));
  if (!result.success) return null;
  const { r, c, b } = result.output;
  const cells: CellType[][] = Array.from({ length: r }, () =>
    Array.from({ length: c }, (): CellType => ({ kind: "white" })),
  );
  for (const [row, col, n] of b) {
    cells[row][col] = { kind: "black", number: n === -1 ? null : n };
  }
  return { rows: r, cols: c, cells };
}

/** シリアライズ済みデータからサイズだけ取得（全セルのデシリアライズ不要） */
export function getDimensions(
  json: string,
): { rows: number; cols: number } | null {
  const result = v.safeParse(DimensionsSchema, JSON.parse(json));
  return result.success
    ? { rows: result.output.r, cols: result.output.c }
    : null;
}

/** パズルをURLハッシュ用にBase64エンコード */
export function toUrlHash(def: PuzzleDef): string {
  return btoa(serialize(def));
}

/** URLハッシュからパズルをデコード */
export function fromUrlHash(hash: string): PuzzleDef | null {
  return deserialize(atob(hash));
}
