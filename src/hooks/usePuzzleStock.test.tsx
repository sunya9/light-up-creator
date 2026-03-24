import { test, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { usePuzzleStock, PuzzleStockProvider } from "./usePuzzleStock";
import { createEmptyGrid, setCell } from "../lib/lightup/grid";
import { getDimensions } from "../lib/lightup/serializer";

function wrapper({ children }: { children: ReactNode }) {
  return <PuzzleStockProvider>{children}</PuzzleStockProvider>;
}

test("usePuzzleStock: upsert: creates a new puzzle when id does not exist", () => {
  const { result } = renderHook(() => usePuzzleStock(), { wrapper });
  const grid = createEmptyGrid(5, 5);

  act(() => {
    result.current.upsert("test-id-1", grid);
  });

  expect(result.current.puzzles).toHaveLength(1);
  expect(result.current.puzzles[0].id).toBe("test-id-1");
  expect(getDimensions(result.current.puzzles[0].data)?.rows).toBe(5);
  expect(getDimensions(result.current.puzzles[0].data)?.cols).toBe(5);
});

test("usePuzzleStock: upsert: generates a default name when name is not provided", () => {
  const { result } = renderHook(() => usePuzzleStock(), { wrapper });
  const grid = createEmptyGrid(7, 7);

  act(() => {
    result.current.upsert("test-id-2", grid);
  });

  expect(result.current.puzzles[0].name).toBe("New Puzzle");
});

test("usePuzzleStock: upsert: uses provided name if given", () => {
  const { result } = renderHook(() => usePuzzleStock(), { wrapper });
  const grid = createEmptyGrid(7, 7);

  act(() => {
    result.current.upsert("test-id-3", grid, "My Puzzle");
  });

  expect(result.current.puzzles[0].name).toBe("My Puzzle");
});

test("usePuzzleStock: upsert: updates existing puzzle data when id already exists", () => {
  const { result } = renderHook(() => usePuzzleStock(), { wrapper });
  const grid1 = createEmptyGrid(5, 5);
  const grid2 = setCell(
    createEmptyGrid(7, 7),
    { row: 0, col: 0 },
    { kind: "black", number: null },
  );

  act(() => {
    result.current.upsert("test-id-4", grid1, "Original");
  });
  act(() => {
    result.current.upsert("test-id-4", grid2);
  });

  expect(result.current.puzzles).toHaveLength(1);
  expect(getDimensions(result.current.puzzles[0].data)?.rows).toBe(7);
  expect(getDimensions(result.current.puzzles[0].data)?.cols).toBe(7);
  expect(result.current.puzzles[0].name).toBe("Original");
});

test("usePuzzleStock: upsert: updates name when provided on existing puzzle", () => {
  const { result } = renderHook(() => usePuzzleStock(), { wrapper });
  const grid = createEmptyGrid(5, 5);

  act(() => {
    result.current.upsert("test-id-5", grid, "Original");
  });
  act(() => {
    result.current.upsert("test-id-5", grid, "Renamed");
  });

  expect(result.current.puzzles[0].name).toBe("Renamed");
});

test("usePuzzleStock: copy: duplicates a puzzle with a new id and ' (copy)' suffix", () => {
  const { result } = renderHook(() => usePuzzleStock(), { wrapper });
  const grid = createEmptyGrid(5, 5);

  act(() => {
    result.current.upsert("original-id", grid, "Test Puzzle");
  });

  let newId: string | null = null;
  act(() => {
    newId = result.current.copy("original-id");
  });

  expect(newId).not.toBeNull();
  expect(newId).not.toBe("original-id");
  expect(result.current.puzzles).toHaveLength(2);

  const copied = result.current.puzzles.find((p) => p.id === newId);
  expect(copied).toBeDefined();
  expect(copied!.name).toBe("Test Puzzle (copy)");
  expect(getDimensions(copied!.data)?.rows).toBe(5);
  expect(getDimensions(copied!.data)?.cols).toBe(5);
  expect(copied!.data).toBe(
    result.current.puzzles.find((p) => p.id === "original-id")!.data,
  );
});

test("usePuzzleStock: copy: returns null when source id does not exist", () => {
  const { result } = renderHook(() => usePuzzleStock(), { wrapper });

  let newId: string | null = null;
  act(() => {
    newId = result.current.copy("nonexistent");
  });

  expect(newId).toBeNull();
});

test("usePuzzleStock: isolation: each provider has independent snapshot state", () => {
  const { result: r1 } = renderHook(() => usePuzzleStock(), { wrapper });
  const grid = createEmptyGrid(3, 3);

  act(() => {
    r1.current.upsert("id-a", grid, "Puzzle A");
  });

  // A second provider reading the same localStorage sees the data
  const { result: r2 } = renderHook(() => usePuzzleStock(), { wrapper });
  expect(r2.current.puzzles).toHaveLength(1);
});
