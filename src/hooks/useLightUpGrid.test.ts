import { test, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLightUpGrid } from "./useLightUpGrid";
import type { HistoryState } from "./useLightUpGrid";
import { createEmptyGrid } from "../lib/lightup/grid";

test("useLightUpGrid: history export: exposes HistoryState via history property", () => {
  const { result } = renderHook(() => useLightUpGrid(3, 3));
  const { history } = result.current;
  expect(history).toBeDefined();
  expect(history.current).toBeDefined();
  expect(history.past).toEqual([]);
  expect(history.future).toEqual([]);
  expect(history.batchSnapshot).toBeNull();
});

test("useLightUpGrid: RESTORE_HISTORY action: replaces the entire history state", () => {
  const { result } = renderHook(() => useLightUpGrid(3, 3));

  // Make some changes to build up history
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

  // Save the history state
  const savedHistory: HistoryState = result.current.history;
  expect(savedHistory.past.length).toBe(2);

  // Reset the grid
  act(() => {
    result.current.dispatch({ type: "RESET" });
  });
  expect(result.current.history.past.length).toBe(3);

  // Restore the saved history
  act(() => {
    result.current.dispatch({
      type: "RESTORE_HISTORY",
      history: savedHistory,
    });
  });

  // History should be exactly what we saved
  expect(result.current.history.past.length).toBe(2);
  expect(result.current.state.grid.cells[0][0]).toEqual({
    kind: "black",
    number: null,
  });
  expect(result.current.state.grid.cells[1][1]).toEqual({
    kind: "black",
    number: null,
  });
});

test("useLightUpGrid: RESTORE_HISTORY action: does not push to undo history when restoring", () => {
  const { result } = renderHook(() => useLightUpGrid(3, 3));

  const emptyHistory: HistoryState = {
    current: {
      grid: createEmptyGrid(5, 5),
      bulbs: new Set(),
      crosses: new Set(),
      mode: "edit",
    },
    past: [],
    future: [],
    batchSnapshot: null,
  };

  act(() => {
    result.current.dispatch({
      type: "RESTORE_HISTORY",
      history: emptyHistory,
    });
  });

  expect(result.current.history.past).toEqual([]);
  expect(result.current.state.grid.rows).toBe(5);
  expect(result.current.state.grid.cols).toBe(5);
});
