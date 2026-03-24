import { test, expect } from "vitest";
import { getIlluminatedCells, getVisibleCells } from "./illumination";
import type { PuzzleDef } from "./types";

/**
 * テスト用ヘルパー: 文字列配列からPuzzleDefを生成
 * '.' = 白, '#' = 数字なし黒, '0'-'4' = 数字付き黒
 */
function parsePuzzle(lines: string[]): PuzzleDef {
  const rows = lines.length;
  const cols = lines[0].length;
  const cells = lines.map((line) =>
    Array.from(line).map((ch) => {
      if (ch === ".") return { kind: "white" as const };
      if (ch === "#") return { kind: "black" as const, number: null };
      const n = parseInt(ch, 10);
      return { kind: "black" as const, number: n };
    }),
  );
  return { rows, cols, cells };
}

test("illumination: getVisibleCells: returns cells visible from a position in all 4 directions", () => {
  // 5x5 all white
  const grid = parsePuzzle([".....", ".....", ".....", ".....", "....."]);
  const visible = getVisibleCells(grid, { row: 2, col: 2 });
  // Should see 4 cells in each direction (but not self)
  // up: (1,2),(0,2), down: (3,2),(4,2), left: (2,1),(2,0), right: (2,3),(2,4)
  expect(visible).toHaveLength(8);
});

test("illumination: getVisibleCells: stops at black cells", () => {
  const grid = parsePuzzle(["..#..", ".....", "#..#.", ".....", "....."]);
  // From (2,2): up→(1,2),(0,2)で(0,2)はblackの手前の(1,2)まで...いや(0,2)は'#'
  // 上方向: (1,2) OK, (0,2) は '#' → stop before → [(1,2)]
  // 下方向: (3,2),(4,2) → both white
  // 左方向: (2,1),(2,0) → (2,1) is white, (2,0) is '#' → [(2,1)]
  // 右方向: (2,3) is '#' → stop → []
  const visible = getVisibleCells(grid, { row: 2, col: 2 });
  expect(visible).toHaveLength(4); // (1,2),(3,2),(4,2),(2,1)
  expect(visible).toContainEqual({ row: 1, col: 2 });
  expect(visible).toContainEqual({ row: 3, col: 2 });
  expect(visible).toContainEqual({ row: 4, col: 2 });
  expect(visible).toContainEqual({ row: 2, col: 1 });
});

test("illumination: getVisibleCells: handles corner position", () => {
  const grid = parsePuzzle(["...", "...", "..."]);
  const visible = getVisibleCells(grid, { row: 0, col: 0 });
  // right: (0,1),(0,2), down: (1,0),(2,0)
  expect(visible).toHaveLength(4);
});

test("illumination: getIlluminatedCells: returns all cells illuminated by given bulbs", () => {
  const grid = parsePuzzle([".....", ".....", "..#..", ".....", "....."]);
  const bulbs = new Set(["0,0"]);
  const lit = getIlluminatedCells(grid, bulbs);
  // bulb at (0,0) lights: right → (0,1),(0,2),(0,3),(0,4) and down → (1,0),(2,0),(3,0),(4,0)
  // plus itself
  expect(lit.has("0,0")).toBe(true);
  expect(lit.has("0,1")).toBe(true);
  expect(lit.has("0,4")).toBe(true);
  expect(lit.has("4,0")).toBe(true);
  expect(lit.has("1,1")).toBe(false);
});

test("illumination: getIlluminatedCells: multiple bulbs combine illumination", () => {
  const grid = parsePuzzle(["...", "...", "..."]);
  const bulbs = new Set(["0,0", "2,2"]);
  const lit = getIlluminatedCells(grid, bulbs);
  // (0,0) lights row 0 and col 0
  // (2,2) lights row 2 and col 2
  // Together they should cover many cells
  expect(lit.has("0,0")).toBe(true);
  expect(lit.has("0,2")).toBe(true);
  expect(lit.has("2,0")).toBe(true);
  expect(lit.has("2,2")).toBe(true);
  expect(lit.has("1,1")).toBe(false); // not lit by either
});

test("illumination: getIlluminatedCells: black cells are never illuminated", () => {
  const grid = parsePuzzle([".#.", "...", "..."]);
  const bulbs = new Set(["0,0"]);
  const lit = getIlluminatedCells(grid, bulbs);
  expect(lit.has("0,1")).toBe(false); // black cell
  expect(lit.has("0,2")).toBe(false); // blocked by black
});
