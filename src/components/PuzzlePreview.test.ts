import { test, expect } from "vitest";
import { drawPuzzlePreview } from "./puzzlePreviewRenderer";
import { serialize } from "../lib/lightup/serializer";
import { createEmptyGrid, setCell } from "../lib/lightup/grid";

test("drawPuzzlePreview: draws black cells on canvas at 2px per cell", () => {
  const grid = setCell(
    createEmptyGrid(3, 3),
    { row: 0, col: 0 },
    { kind: "black", number: null },
  );
  const data = serialize(grid);

  const canvas = document.createElement("canvas");
  drawPuzzlePreview(canvas, data, 2);

  expect(canvas.width).toBe(6);
  expect(canvas.height).toBe(6);
});

test("drawPuzzlePreview: sets canvas dimensions based on grid size and cell size", () => {
  const grid = createEmptyGrid(7, 7);
  const data = serialize(grid);

  const canvas = document.createElement("canvas");
  drawPuzzlePreview(canvas, data, 2);

  expect(canvas.width).toBe(14);
  expect(canvas.height).toBe(14);
});

test("drawPuzzlePreview: handles non-square grids", () => {
  const grid = createEmptyGrid(5, 10);
  const data = serialize(grid);

  const canvas = document.createElement("canvas");
  drawPuzzlePreview(canvas, data, 2);

  expect(canvas.width).toBe(20);
  expect(canvas.height).toBe(10);
});
