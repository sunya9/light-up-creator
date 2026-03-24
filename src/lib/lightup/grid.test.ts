import { test, expect } from "vitest";
import {
  createEmptyGrid,
  setCell,
  isWhite,
  isBlack,
  getNumber,
  resizeGrid,
  hasContentOutsideBounds,
} from "./grid";
import type { PuzzleDef } from "./types";

test("grid: createEmptyGrid: creates a grid with all white cells", () => {
  const grid = createEmptyGrid(3, 4);
  expect(grid.rows).toBe(3);
  expect(grid.cols).toBe(4);
  expect(grid.cells.length).toBe(3);
  expect(grid.cells[0].length).toBe(4);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      expect(grid.cells[r][c]).toEqual({ kind: "white" });
    }
  }
});

test("grid: createEmptyGrid: creates a 1x1 grid", () => {
  const grid = createEmptyGrid(1, 1);
  expect(grid.rows).toBe(1);
  expect(grid.cols).toBe(1);
});

test("grid: setCell: sets a cell to black without number", () => {
  const grid = createEmptyGrid(3, 3);
  const updated = setCell(
    grid,
    { row: 1, col: 1 },
    { kind: "black", number: null },
  );
  expect(updated.cells[1][1]).toEqual({ kind: "black", number: null });
  // original is not mutated
  expect(grid.cells[1][1]).toEqual({ kind: "white" });
});

test("grid: setCell: sets a cell to black with number", () => {
  const grid = createEmptyGrid(3, 3);
  const updated = setCell(
    grid,
    { row: 0, col: 2 },
    { kind: "black", number: 2 },
  );
  expect(updated.cells[0][2]).toEqual({ kind: "black", number: 2 });
});

test("grid: setCell: sets a black cell back to white", () => {
  let grid = createEmptyGrid(3, 3);
  grid = setCell(grid, { row: 1, col: 1 }, { kind: "black", number: 3 });
  grid = setCell(grid, { row: 1, col: 1 }, { kind: "white" });
  expect(grid.cells[1][1]).toEqual({ kind: "white" });
});

test("grid: resizeGrid: expands grid preserving content", () => {
  let grid = createEmptyGrid(2, 2);
  grid = setCell(grid, { row: 0, col: 1 }, { kind: "black", number: 3 });
  const resized = resizeGrid(grid, 3, 4);
  expect(resized.rows).toBe(3);
  expect(resized.cols).toBe(4);
  expect(resized.cells[0][1]).toEqual({ kind: "black", number: 3 });
  expect(resized.cells[2][3]).toEqual({ kind: "white" });
});

test("grid: resizeGrid: shrinks grid truncating content", () => {
  let grid = createEmptyGrid(3, 3);
  grid = setCell(grid, { row: 2, col: 2 }, { kind: "black", number: 1 });
  const resized = resizeGrid(grid, 2, 2);
  expect(resized.rows).toBe(2);
  expect(resized.cols).toBe(2);
  expect(resized.cells[0][0]).toEqual({ kind: "white" });
});

test("grid: resizeGrid: preserves all content within new bounds", () => {
  let grid = createEmptyGrid(3, 3);
  grid = setCell(grid, { row: 0, col: 0 }, { kind: "black", number: 2 });
  grid = setCell(grid, { row: 1, col: 1 }, { kind: "black", number: null });
  const resized = resizeGrid(grid, 2, 2);
  expect(resized.cells[0][0]).toEqual({ kind: "black", number: 2 });
  expect(resized.cells[1][1]).toEqual({ kind: "black", number: null });
});

test("grid: hasContentOutsideBounds: returns false when no content outside", () => {
  let grid = createEmptyGrid(3, 3);
  grid = setCell(grid, { row: 0, col: 0 }, { kind: "black", number: 1 });
  expect(hasContentOutsideBounds(grid, 2, 2)).toBe(false);
});

test("grid: hasContentOutsideBounds: returns true when black cell is outside new row bounds", () => {
  let grid = createEmptyGrid(3, 3);
  grid = setCell(grid, { row: 2, col: 0 }, { kind: "black", number: null });
  expect(hasContentOutsideBounds(grid, 2, 3)).toBe(true);
});

test("grid: hasContentOutsideBounds: returns true when black cell is outside new col bounds", () => {
  let grid = createEmptyGrid(3, 3);
  grid = setCell(grid, { row: 0, col: 2 }, { kind: "black", number: 0 });
  expect(hasContentOutsideBounds(grid, 3, 2)).toBe(true);
});

test("grid: hasContentOutsideBounds: returns false when expanding", () => {
  let grid = createEmptyGrid(3, 3);
  grid = setCell(grid, { row: 2, col: 2 }, { kind: "black", number: 4 });
  expect(hasContentOutsideBounds(grid, 5, 5)).toBe(false);
});

test("grid: isWhite / isBlack / getNumber: correctly identifies cell types", () => {
  const grid: PuzzleDef = {
    rows: 2,
    cols: 2,
    cells: [
      [{ kind: "white" }, { kind: "black", number: null }],
      [{ kind: "black", number: 2 }, { kind: "white" }],
    ],
  };
  expect(isWhite(grid, { row: 0, col: 0 })).toBe(true);
  expect(isBlack(grid, { row: 0, col: 0 })).toBe(false);
  expect(isBlack(grid, { row: 0, col: 1 })).toBe(true);
  expect(isWhite(grid, { row: 0, col: 1 })).toBe(false);
  expect(getNumber(grid, { row: 0, col: 1 })).toBeNull();
  expect(getNumber(grid, { row: 1, col: 0 })).toBe(2);
  expect(getNumber(grid, { row: 0, col: 0 })).toBeNull();
});
