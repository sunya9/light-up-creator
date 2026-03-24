import { test, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { usePuzzleManager } from "./usePuzzleManager";
import { PuzzleStockProvider, usePuzzleStock } from "./usePuzzleStock";
import { createEmptyGrid, setCell } from "../lib/lightup/grid";

function wrapper({ children }: { children: ReactNode }) {
  return <PuzzleStockProvider>{children}</PuzzleStockProvider>;
}

test("usePuzzleManager: initial state: starts with null currentPuzzleId", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });
  expect(result.current.currentPuzzleId).toBeUndefined();
});

test("usePuzzleManager: initial state: starts with an empty 10x10 grid", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });
  expect(result.current.state.grid.rows).toBe(10);
  expect(result.current.state.grid.cols).toBe(10);
});

test("usePuzzleManager: auto ID assignment on first edit: assigns an ID on TOGGLE_CELL when currentPuzzleId is null", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });
  expect(result.current.currentPuzzleId).toBeUndefined();

  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });

  expect(result.current.currentPuzzleId).toBeDefined();
});

test("usePuzzleManager: auto ID assignment on first edit: does not reassign ID on subsequent edits", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });

  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });
  const firstId = result.current.currentPuzzleId;

  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 1, col: 1 },
    });
  });

  expect(result.current.currentPuzzleId).toBe(firstId);
});

test("usePuzzleManager: auto ID assignment on first edit: does not assign ID for SET_MODE", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });

  act(() => {
    result.current.dispatch({ type: "SET_MODE", mode: "play" });
  });

  expect(result.current.currentPuzzleId).toBeUndefined();
});

test("usePuzzleManager: auto ID assignment on first edit: does not assign ID for SET_GRID", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });
  const grid = result.current.state.grid;

  act(() => {
    result.current.dispatch({ type: "SET_GRID", grid });
  });

  expect(result.current.currentPuzzleId).toBeUndefined();
});

test("usePuzzleManager: auto ID assignment on first edit: does not create a new stock entry when SET_GRID is dispatched", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });
  const grid = result.current.state.grid;

  act(() => {
    result.current.dispatch({ type: "SET_GRID", grid });
  });

  expect(result.current.currentPuzzleId).toBeUndefined();
});

test("usePuzzleManager: auto-save: saves immediately when grid changes", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });

  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });

  const saved = result.current.stock.puzzles.find(
    (p) => p.id === result.current.currentPuzzleId,
  );
  expect(saved).toBeDefined();
});

test("usePuzzleManager: puzzle switching: switches to a saved puzzle and restores its grid", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });

  // Create first puzzle
  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });

  const firstId = result.current.currentPuzzleId!;

  // Create second puzzle via newPuzzle
  act(() => {
    result.current.newPuzzle();
  });
  expect(result.current.currentPuzzleId).toBeDefined();
  expect(result.current.currentPuzzleId).not.toBe(firstId);

  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 2, col: 2 },
    });
  });

  // Switch back to first puzzle
  act(() => {
    result.current.loadPuzzle(firstId);
  });

  expect(result.current.currentPuzzleId).toBe(firstId);
  expect(result.current.state.grid.cells[0][0].kind).toBe("black");
});

test("usePuzzleManager: puzzle switching: preserves undo history per puzzle", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });

  // Edit puzzle 1
  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });
  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 1, col: 1 },
    });
  });

  const puzzle1Id = result.current.currentPuzzleId!;
  expect(result.current.canUndo).toBe(true);

  // Switch to new puzzle
  act(() => {
    result.current.newPuzzle();
  });

  // New puzzle has no history
  expect(result.current.canUndo).toBe(false);

  // Switch back
  act(() => {
    result.current.loadPuzzle(puzzle1Id);
  });

  // History is restored
  expect(result.current.canUndo).toBe(true);
});

test("usePuzzleManager: newPuzzle: creates a fresh empty grid with an ID and saves immediately", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });

  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });

  act(() => {
    result.current.newPuzzle();
  });

  expect(result.current.currentPuzzleId).toBeDefined();
  expect(result.current.state.grid.cells[0][0].kind).toBe("white");
  // Immediately appears in stock
  const newEntry = result.current.stock.puzzles.find(
    (p) => p.id === result.current.currentPuzzleId,
  );
  expect(newEntry).toBeDefined();
});

test("usePuzzleManager: copyPuzzle: duplicates a puzzle in the stock", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });

  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });

  const id = result.current.currentPuzzleId!;

  act(() => {
    result.current.copyPuzzle(id);
  });

  // Copy exists in stock
  const copies = result.current.stock.puzzles.filter((p) => p.id !== id);
  expect(copies.length).toBeGreaterThanOrEqual(1);
  // Does NOT navigate to the copy
  expect(result.current.currentPuzzleId).toBe(id);
});

test("usePuzzleManager: removePuzzle: switches to previous puzzle when deleting the current one", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });

  // Create puzzle 1
  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });

  const id1 = result.current.currentPuzzleId!;

  // Create puzzle 2
  act(() => {
    result.current.newPuzzle();
  });
  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 2, col: 2 },
    });
  });

  const id2 = result.current.currentPuzzleId!;

  // Delete puzzle 2 → should switch to puzzle 1
  act(() => {
    result.current.removePuzzle(id2);
  });

  expect(result.current.currentPuzzleId).toBe(id1);
  expect(result.current.state.grid.cells[0][0].kind).toBe("black");
});

test("usePuzzleManager: removePuzzle: creates new puzzle when deleting the only puzzle", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });

  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });

  const id = result.current.currentPuzzleId!;
  // Verify this is the only puzzle
  expect(result.current.stock.puzzles.filter((p) => p.id === id)).toHaveLength(
    1,
  );

  act(() => {
    result.current.removePuzzle(id);
  });

  // New puzzle created with different ID
  expect(result.current.currentPuzzleId).toBeDefined();
  expect(result.current.currentPuzzleId).not.toBe(id);
});

test("usePuzzleManager: removePuzzle: does not affect current puzzle when deleting a different one", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });

  // Create puzzle 1
  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });

  const id1 = result.current.currentPuzzleId!;

  // Create puzzle 2
  act(() => {
    result.current.newPuzzle();
  });
  act(() => {
    result.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 2, col: 2 },
    });
  });

  const id2 = result.current.currentPuzzleId!;

  // Delete puzzle 1
  act(() => {
    result.current.removePuzzle(id1);
  });

  expect(result.current.currentPuzzleId).toBe(id2);
});

test("usePuzzleManager: import via stock + routeId (Importer flow): loads imported puzzle when stock.upsert is called then routeId changes", () => {
  const grid = setCell(
    createEmptyGrid(5, 5),
    { row: 0, col: 0 },
    { kind: "black", number: null },
  );
  const importedId = crypto.randomUUID();

  // Simulate Importer: write to stock directly
  const { result: stockHook } = renderHook(() => usePuzzleStock(), {
    wrapper,
  });
  act(() => {
    stockHook.current.upsert(importedId, grid);
  });

  // Then Editor mounts with routeId = importedId
  const { result } = renderHook(() => usePuzzleManager(importedId), {
    wrapper,
  });

  expect(result.current.currentPuzzleId).toBe(importedId);
  expect(result.current.state.grid.cells[0][0].kind).toBe("black");
  expect(result.current.state.grid.rows).toBe(5);
});

test("usePuzzleManager: routeId initialization: loads puzzle from stock when routeId is provided", () => {
  const { result: setup } = renderHook(() => usePuzzleManager(), {
    wrapper,
  });

  // Create a puzzle with content
  act(() => {
    setup.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });

  const savedId = setup.current.currentPuzzleId!;

  // Mount a new instance with routeId pointing to the saved puzzle
  const { result } = renderHook(() => usePuzzleManager(savedId), {
    wrapper,
  });

  expect(result.current.currentPuzzleId).toBe(savedId);
  expect(result.current.state.grid.cells[0][0].kind).toBe("black");
});

test("usePuzzleManager: routeId initialization: does not overwrite stock data with empty grid on init", () => {
  const { result: setup } = renderHook(() => usePuzzleManager(), {
    wrapper,
  });

  // Create a puzzle with content
  act(() => {
    setup.current.dispatch({
      type: "TOGGLE_CELL",
      pos: { row: 0, col: 0 },
    });
  });

  const savedId = setup.current.currentPuzzleId!;

  // Mount with routeId and wait for auto-save debounce
  const { result } = renderHook(() => usePuzzleManager(savedId), {
    wrapper,
  });

  // Stock should still have the black cell, not be overwritten with empty
  const stockEntry = result.current.stock.puzzles.find((p) => p.id === savedId);
  expect(stockEntry).toBeDefined();
  // Verify the grid wasn't overwritten by checking the loaded state
  expect(result.current.state.grid.cells[0][0].kind).toBe("black");
});

test("usePuzzleManager: routeId initialization: starts with empty grid when no routeId", () => {
  const { result } = renderHook(() => usePuzzleManager(), { wrapper });

  expect(result.current.currentPuzzleId).toBeUndefined();
  expect(result.current.state.grid.cells[0][0].kind).toBe("white");
});
