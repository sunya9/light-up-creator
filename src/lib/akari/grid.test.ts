import { describe, it, expect } from "vitest";
import { createEmptyGrid, setCell, isWhite, isBlack, getNumber } from "./grid";
import type { PuzzleDef } from "./types";

describe("grid", () => {
  describe("createEmptyGrid", () => {
    it("creates a grid with all white cells", () => {
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

    it("creates a 1x1 grid", () => {
      const grid = createEmptyGrid(1, 1);
      expect(grid.rows).toBe(1);
      expect(grid.cols).toBe(1);
    });
  });

  describe("setCell", () => {
    it("sets a cell to black without number", () => {
      const grid = createEmptyGrid(3, 3);
      const updated = setCell(grid, { row: 1, col: 1 }, { kind: "black", number: null });
      expect(updated.cells[1][1]).toEqual({ kind: "black", number: null });
      // original is not mutated
      expect(grid.cells[1][1]).toEqual({ kind: "white" });
    });

    it("sets a cell to black with number", () => {
      const grid = createEmptyGrid(3, 3);
      const updated = setCell(grid, { row: 0, col: 2 }, { kind: "black", number: 2 });
      expect(updated.cells[0][2]).toEqual({ kind: "black", number: 2 });
    });

    it("sets a black cell back to white", () => {
      let grid = createEmptyGrid(3, 3);
      grid = setCell(grid, { row: 1, col: 1 }, { kind: "black", number: 3 });
      grid = setCell(grid, { row: 1, col: 1 }, { kind: "white" });
      expect(grid.cells[1][1]).toEqual({ kind: "white" });
    });
  });

  describe("isWhite / isBlack / getNumber", () => {
    it("correctly identifies cell types", () => {
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
  });
});
