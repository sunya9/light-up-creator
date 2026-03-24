import { test, expect } from "vitest";
import { serialize, deserialize, toUrlHash, fromUrlHash } from "./serializer";
import { createEmptyGrid, setCell } from "./grid";

test("serializer: round-trips a puzzle through JSON", () => {
  let grid = createEmptyGrid(3, 4);
  grid = setCell(grid, { row: 0, col: 1 }, { kind: "black", number: 2 });
  grid = setCell(grid, { row: 2, col: 3 }, { kind: "black", number: null });

  const json = serialize(grid);
  const restored = deserialize(json);

  expect(restored).not.toBeNull();
  expect(restored!.rows).toBe(3);
  expect(restored!.cols).toBe(4);
  expect(restored!.cells[0][1]).toEqual({ kind: "black", number: 2 });
  expect(restored!.cells[2][3]).toEqual({ kind: "black", number: null });
  expect(restored!.cells[0][0]).toEqual({ kind: "white" });
});

test("serializer: round-trips through URL hash", () => {
  let grid = createEmptyGrid(5, 5);
  grid = setCell(grid, { row: 2, col: 2 }, { kind: "black", number: 0 });

  const hash = toUrlHash(grid);
  const restored = fromUrlHash(hash);

  expect(restored).toEqual(grid);
});

test("serializer: serializes an empty grid compactly", () => {
  const grid = createEmptyGrid(2, 2);
  const json = serialize(grid);
  expect(JSON.parse(json)).toEqual({ r: 2, c: 2, b: [] });
});
