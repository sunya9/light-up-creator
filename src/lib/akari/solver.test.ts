import { describe, it, expect } from "vitest";
import { solve } from "./solver";
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

describe("solver", () => {
  it("solves a trivial 1x1 puzzle (single white cell)", () => {
    const grid = parsePuzzle(["."]);
    const result = solve(grid);
    expect(result.kind).toBe("unique");
    if (result.kind === "unique") {
      expect(result.solution.has("0,0")).toBe(true);
    }
  });

  it("solves a 1x3 puzzle with number constraint", () => {
    // . 1 .
    // bulb at (0,0) → (0,1) sees 1 adjacent bulb → need exactly 1
    // (0,2) must NOT have bulb (would make 2 adjacent)
    // But (0,2) needs to be lit → it's lit by bulb at (0,0)? No, blocked by black (0,1)
    // Actually (0,1) is black, so (0,0) can't see (0,2)
    // So (0,2) needs its own bulb → but that makes 2 adj to (0,1)
    // So this puzzle has no solution
    const grid = parsePuzzle([".1."]);
    const result = solve(grid);
    expect(result.kind).toBe("none");
  });

  it("detects no solution when impossible", () => {
    // 0 means no adjacent bulbs allowed
    // . 0 .  — (0,0) and (0,2) need light but can't place bulbs adjacent to 0
    // But (0,0) is adjacent to (0,1)=black(0), so no bulb at (0,0)
    // Then (0,0) has no light source → impossible
    const grid = parsePuzzle([".0."]);
    const result = solve(grid);
    expect(result.kind).toBe("none");
  });

  it("solves a 3x3 puzzle with unique solution", () => {
    // . . #
    // . 0 .
    // # . .
    // Expected: bulbs at (0,0) and (2,2)
    const grid = parsePuzzle(["..#", ".0.", "#.."]);
    const result = solve(grid);
    expect(result.kind).toBe("unique");
    if (result.kind === "unique") {
      expect(result.solution.has("0,0")).toBe(true);
      expect(result.solution.has("2,2")).toBe(true);
      expect(result.solution.size).toBe(2);
    }
  });

  it("detects multiple solutions", () => {
    // 3x3 all white — many possible bulb placements
    const grid = parsePuzzle(["...", "...", "..."]);
    const result = solve(grid);
    expect(result.kind).toBe("multiple");
  });

  it("solves a well-constrained puzzle with unique solution", () => {
    // Highly constrained 5x5 puzzle designed to have unique solution
    // . 1 . 1 .
    // . . . . .
    // 1 . # . 1
    // . . . . .
    // . 1 . 1 .
    const grid = parsePuzzle([".1.1.", ".....", "1.#.1", ".....", ".1.1."]);
    const result = solve(grid);
    expect(result.kind).toBe("unique");
  });

  it("solves a non-square puzzle", () => {
    // 2x4 puzzle
    // . . # .
    // . # . .
    const grid = parsePuzzle(["..#.", ".#.."]);
    const result = solve(grid);
    // Should have some solution(s)
    expect(result.kind).not.toBe("none");
  });

  it("handles all-black grid (trivially solved, no white cells)", () => {
    const grid = parsePuzzle(["##", "##"]);
    const result = solve(grid);
    expect(result.kind).toBe("unique");
    if (result.kind === "unique") {
      expect(result.solution.size).toBe(0);
    }
  });

  it("solves puzzle with 4-constraint", () => {
    // . 4 .
    // 4 . 4
    // . 4 .
    // The center cell (1,1) is white. Each black cell with 4 needs all neighbors to be bulbs.
    // (0,1)=4: neighbors (0,0),(0,2),(1,1) — only 3 neighbors, can't satisfy 4
    // This should be "none"
    const grid = parsePuzzle([".4.", "4.4", ".4."]);
    const result = solve(grid);
    expect(result.kind).toBe("none");
  });
});
