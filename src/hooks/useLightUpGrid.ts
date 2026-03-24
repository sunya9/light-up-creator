import { useReducer, useMemo, useCallback, useEffect } from "react";
import type { CellType, Pos, PuzzleDef } from "../lib/lightup/types";
import { posToKey } from "../lib/lightup/types";
import {
  createEmptyGrid,
  setCell,
  isBlack,
  resizeGrid,
} from "../lib/lightup/grid";
import { hasAdjacentSaturatedNumber } from "../lib/lightup/bulbToggle";
import {
  getIlluminatedCells,
  getVisibleCells,
} from "../lib/lightup/illumination";

export type EditMode = "play" | "edit";

type State = {
  grid: PuzzleDef;
  bulbs: Set<string>;
  crosses: Set<string>;
  mode: EditMode;
};

export type HistoryState = {
  current: State;
  past: State[];
  future: State[];
  /** バッチ操作中の開始時点のスナップショット */
  batchSnapshot: State | null;
};

export type Action =
  | { type: "SET_GRID"; grid: PuzzleDef }
  | { type: "SET_MODE"; mode: EditMode }
  | { type: "RESIZE"; rows: number; cols: number }
  | { type: "TOGGLE_CELL"; pos: Pos }
  | { type: "CLEAR_CELL"; pos: Pos }
  | { type: "SET_BLACK"; pos: Pos }
  | { type: "TOGGLE_BULB"; pos: Pos }
  | { type: "TOGGLE_CROSS"; pos: Pos }
  | { type: "CLEAR_BULBS" }
  | { type: "RESET" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "BATCH_START" }
  | { type: "BATCH_END" }
  | { type: "RESTORE_HISTORY"; history: HistoryState };

function applyAction(state: State, action: Action): State | null {
  switch (action.type) {
    case "SET_GRID":
      return {
        ...state,
        grid: action.grid,
        bulbs: new Set(),
        crosses: new Set(),
      };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "RESIZE": {
      const newGrid = resizeGrid(state.grid, action.rows, action.cols);
      // 範囲外の bulbs / crosses を除去
      const newBulbs = new Set<string>();
      const newCrosses = new Set<string>();
      for (const key of state.bulbs) {
        const [r, c] = key.split(",").map(Number);
        if (
          r < action.rows &&
          c < action.cols &&
          newGrid.cells[r][c].kind === "white"
        ) {
          newBulbs.add(key);
        }
      }
      for (const key of state.crosses) {
        const [r, c] = key.split(",").map(Number);
        if (
          r < action.rows &&
          c < action.cols &&
          newGrid.cells[r][c].kind === "white"
        ) {
          newCrosses.add(key);
        }
      }
      return { ...state, grid: newGrid, bulbs: newBulbs, crosses: newCrosses };
    }
    case "TOGGLE_CELL": {
      const { pos } = action;
      const cell = state.grid.cells[pos.row][pos.col];
      let newCell: CellType;
      if (cell.kind === "white") {
        newCell = { kind: "black", number: null };
      } else if (cell.number === null) {
        newCell = { kind: "black", number: 0 };
      } else if (cell.number < 4) {
        newCell = { kind: "black", number: cell.number + 1 };
      } else {
        newCell = { kind: "white" };
      }
      const newGrid = setCell(state.grid, pos, newCell);
      const key = posToKey(pos);
      const newBulbs = new Set(state.bulbs);
      newBulbs.delete(key);
      const newCrosses = new Set(state.crosses);
      newCrosses.delete(key);
      return { ...state, grid: newGrid, bulbs: newBulbs, crosses: newCrosses };
    }
    case "CLEAR_CELL": {
      const { pos } = action;
      if (state.grid.cells[pos.row][pos.col].kind === "white") return null;
      const newGrid = setCell(state.grid, pos, { kind: "white" });
      return { ...state, grid: newGrid };
    }
    case "SET_BLACK": {
      const { pos } = action;
      if (state.grid.cells[pos.row][pos.col].kind === "black") return null;
      const newGrid = setCell(state.grid, pos, { kind: "black", number: null });
      const key = posToKey(pos);
      const newBulbs = new Set(state.bulbs);
      newBulbs.delete(key);
      const newCrosses = new Set(state.crosses);
      newCrosses.delete(key);
      return { ...state, grid: newGrid, bulbs: newBulbs, crosses: newCrosses };
    }
    case "TOGGLE_BULB": {
      const { pos } = action;
      if (isBlack(state.grid, pos)) return null;
      const key = posToKey(pos);
      // バツがある場合 → バツ除去のみ（電球は置かない）
      if (state.crosses.has(key)) {
        const newCrosses = new Set(state.crosses);
        newCrosses.delete(key);
        return { ...state, crosses: newCrosses };
      }
      const newBulbs = new Set(state.bulbs);
      if (newBulbs.has(key)) {
        newBulbs.delete(key);
      } else {
        // 隣接する数字制約が飽和した黒マスがあればバツを配置
        if (hasAdjacentSaturatedNumber(state.grid, pos, state.bulbs)) {
          const newCrosses = new Set(state.crosses);
          newCrosses.add(key);
          return { ...state, crosses: newCrosses };
        }
        newBulbs.add(key);
      }
      return { ...state, bulbs: newBulbs };
    }
    case "TOGGLE_CROSS": {
      const { pos } = action;
      if (isBlack(state.grid, pos)) return null;
      const key = posToKey(pos);
      // 電球がある場合 → 何もしない
      if (state.bulbs.has(key)) return null;
      const newCrosses = new Set(state.crosses);
      if (newCrosses.has(key)) {
        newCrosses.delete(key);
      } else {
        newCrosses.add(key);
      }
      return { ...state, crosses: newCrosses };
    }
    case "CLEAR_BULBS":
      return { ...state, bulbs: new Set(), crosses: new Set() };
    case "RESET":
      return {
        ...state,
        grid: createEmptyGrid(state.grid.rows, state.grid.cols),
        bulbs: new Set(),
        crosses: new Set(),
      };
    default:
      return null;
  }
}

const NO_HISTORY_ACTIONS = new Set(["SET_MODE", "SET_BLACK"]);
const MAX_HISTORY = 100;

export function createInitialHistory(rows = 10, cols = 10): HistoryState {
  return {
    current: {
      grid: createEmptyGrid(rows, cols),
      bulbs: new Set<string>(),
      crosses: new Set<string>(),
      mode: "edit",
    },
    past: [],
    future: [],
    batchSnapshot: null,
  };
}

export function historyReducer(
  history: HistoryState,
  action: Action,
): HistoryState {
  if (action.type === "RESTORE_HISTORY") {
    return action.history;
  }
  if (action.type === "UNDO") {
    if (history.past.length === 0) return history;
    const prev = history.past[history.past.length - 1];
    return {
      current: prev,
      past: history.past.slice(0, -1),
      future: [history.current, ...history.future],
      batchSnapshot: null,
    };
  }
  if (action.type === "REDO") {
    if (history.future.length === 0) return history;
    const next = history.future[0];
    return {
      current: next,
      past: [...history.past, history.current],
      future: history.future.slice(1),
      batchSnapshot: null,
    };
  }
  if (action.type === "BATCH_START") {
    return { ...history, batchSnapshot: history.current };
  }
  if (action.type === "BATCH_END") {
    if (!history.batchSnapshot) return history;
    // 変更がなければ履歴に積まない
    if (history.batchSnapshot === history.current) {
      return { ...history, batchSnapshot: null };
    }
    return {
      current: history.current,
      past: [...history.past.slice(-MAX_HISTORY), history.batchSnapshot],
      future: [],
      batchSnapshot: null,
    };
  }

  const newState = applyAction(history.current, action);
  if (newState === null) return history;

  if (NO_HISTORY_ACTIONS.has(action.type)) {
    return { ...history, current: newState };
  }

  return {
    current: newState,
    past: [...history.past.slice(-MAX_HISTORY), history.current],
    future: [],
    batchSnapshot: null,
  };
}

export function useLightUpGrid(initialRows: number, initialCols: number) {
  const [history, dispatch] = useReducer(historyReducer, {
    current: {
      grid: createEmptyGrid(initialRows, initialCols),
      bulbs: new Set<string>(),
      crosses: new Set<string>(),
      mode: "edit",
    },
    past: [],
    future: [],
    batchSnapshot: null,
  });

  const { current: state } = history;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  // Ctrl+Z / Ctrl+Shift+Z キーボードショートカット
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const illuminated = useMemo(
    () => getIlluminatedCells(state.grid, state.bulbs),
    [state.grid, state.bulbs],
  );

  const conflicts = useMemo(() => {
    const set = new Set<string>();
    for (const key of state.bulbs) {
      const [row, col] = key.split(",").map(Number);
      const visible = getVisibleCells(state.grid, { row, col });
      for (const v of visible) {
        const vKey = posToKey(v);
        if (state.bulbs.has(vKey)) {
          set.add(key);
          set.add(vKey);
        }
      }
    }
    return set;
  }, [state.grid, state.bulbs]);

  return {
    state,
    dispatch,
    illuminated,
    conflicts,
    canUndo,
    canRedo,
    undo,
    redo,
    history,
  };
}
