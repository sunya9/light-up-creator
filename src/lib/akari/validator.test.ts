import { describe, it, expect } from "vitest";
import { validate } from "./validator";
import type { PuzzleDef } from "./types";

function parsePuzzle(lines: string[]): PuzzleDef {
  const rows = lines.length;
  const cols = lines[0].length;
  const cells = lines.map((line) =>
    [...line].map((ch) => {
      if (ch === ".") return { kind: "white" as const };
      if (ch === "#") return { kind: "black" as const, number: null };
      const n = parseInt(ch, 10);
      return { kind: "black" as const, number: n };
    }),
  );
  return { rows, cols, cells };
}

describe("validator", () => {
  it("validates a correct simple solution", () => {
    // 3x3, black center with number 0
    // * . .
    // . 0 .
    // . . *
    const grid = parsePuzzle(["...", ".0.", "..."]);
    const bulbs = new Set(["0,0", "2,2"]);
    const result = validate(grid, bulbs);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects unlit white cells", () => {
    // 3x3 with one bulb — not all cells lit
    const grid = parsePuzzle([".#.", "...", "..."]);
    // bulb at (0,0): lights (0,0), (1,0), (2,0)
    // (0,2),(1,1),(1,2),(2,1),(2,2) not lit
    const bulbs = new Set(["0,0"]);
    const result = validate(grid, bulbs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.kind === "unlit")).toBe(true);
  });

  it("detects bulbs illuminating each other", () => {
    const grid = parsePuzzle(["...", "...", "..."]);
    // Two bulbs on same row with no block between
    const bulbs = new Set(["0,0", "0,2"]);
    const result = validate(grid, bulbs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.kind === "conflict")).toBe(true);
  });

  it("detects number constraint violation (too many bulbs)", () => {
    // 1 の黒マスに隣接 bulb が2つ
    const grid = parsePuzzle([".1.", "..."]);
    const bulbs = new Set(["0,0", "0,2", "1,1"]); // (0,1) is black with number 1, adjacent bulbs: (0,0),(0,2),(1,1)
    const result = validate(grid, bulbs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.kind === "number")).toBe(true);
  });

  it("detects number constraint violation (too few bulbs when all placed)", () => {
    // 3 の黒マスに隣接 bulb が1つで、残り隣接白マスが0
    const grid = parsePuzzle([".3.", "..."]);
    // (0,1) is black with 3, neighbors: (0,0),(0,2),(1,1) → 3 white neighbors
    // Only 1 bulb adjacent → not enough, but only if all white cells are decided
    // For validator (checks complete solution): need exactly 3 bulbs adjacent
    const bulbs = new Set(["0,0", "1,0", "1,2"]); // only (0,0) adjacent to (0,1)
    const result = validate(grid, bulbs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.kind === "number")).toBe(true);
  });

  it("allows bulbs on same line separated by black cell", () => {
    const grid = parsePuzzle([".#."]);
    const bulbs = new Set(["0,0", "0,2"]);
    const result = validate(grid, bulbs);
    expect(result.valid).toBe(true);
  });
});
