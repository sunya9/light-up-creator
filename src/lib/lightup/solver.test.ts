import { test, expect } from "vitest";
import { solve } from "./solver";
import type { PuzzleDef } from "./types";

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

test("solver: solves a trivial 1x1 puzzle (single white cell)", () => {
  const grid = parsePuzzle(["."]);
  const result = solve(grid);
  expect(result.kind).toBe("unique");
  if (result.kind === "unique") {
    expect(result.solution.has("0,0")).toBe(true);
  }
});

test("solver: solves a 1x3 puzzle with number constraint", () => {
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

test("solver: detects no solution when impossible", () => {
  // 0 means no adjacent bulbs allowed
  // . 0 .  — (0,0) and (0,2) need light but can't place bulbs adjacent to 0
  // But (0,0) is adjacent to (0,1)=black(0), so no bulb at (0,0)
  // Then (0,0) has no light source → impossible
  const grid = parsePuzzle([".0."]);
  const result = solve(grid);
  expect(result.kind).toBe("none");
});

test("solver: solves a 3x3 puzzle with unique solution", () => {
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

test("solver: detects multiple solutions with diff", () => {
  // 3x3 all white — many possible bulb placements
  const grid = parsePuzzle(["...", "...", "..."]);
  const result = solve(grid);
  expect(result.kind).toBe("multiple");
  if (result.kind === "multiple") {
    expect(result.solutions).toHaveLength(2);
    expect(result.diff.size).toBeGreaterThan(0);
  }
});

test("solver: solves a well-constrained puzzle with unique solution", () => {
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

test("solver: solves a non-square puzzle", () => {
  // 2x4 puzzle
  // . . # .
  // . # . .
  const grid = parsePuzzle(["..#.", ".#.."]);
  const result = solve(grid);
  // Should have some solution(s)
  expect(result.kind).not.toBe("none");
});

test("solver: handles all-black grid (trivially solved, no white cells)", () => {
  const grid = parsePuzzle(["##", "##"]);
  const result = solve(grid);
  expect(result.kind).toBe("unique");
  if (result.kind === "unique") {
    expect(result.solution.size).toBe(0);
  }
});

test("solver: detects multiple solutions in numberless corridor", () => {
  // . . . . .
  // # # # # #
  // . . . . .
  // 上の行と下の行は黒マスで完全に分断。
  // 各行は独立した1x5の廊下。数字制約なし。
  const grid = parsePuzzle([".....", "#####", "....."]);
  const result = solve(grid);
  expect(result.kind).toBe("multiple");
});

test("solver: detects multiple solutions in open grid with only numberless black cells", () => {
  // . . . .
  // . # . .
  // . . # .
  // . . . .
  // 数字なし黒マスのみ。複数の解があるはず
  const grid = parsePuzzle(["....", ".#..", "..#.", "...."]);
  const result = solve(grid);
  expect(result.kind).toBe("multiple");
});

test("solver: detects multiple solutions when illumination candidate undercounting would miss them", () => {
  // This tests the bug where propagation only counts the first undecided
  // cell per direction as an illumination candidate, potentially forcing
  // a bulb and missing an alternative solution.
  //
  // # . .
  // . # .
  // . . #
  //
  // Diagonal black cells split the grid.
  // (0,1) and (0,2) form a corridor; (1,0) is isolated vertically from (2,0).
  // Multiple valid configurations exist.
  const grid = parsePuzzle(["#..", ".#.", "..#"]);
  const result = solve(grid);
  expect(result.kind).toBe("multiple");
});

test("solver: solves puzzle with 4-constraint", () => {
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
