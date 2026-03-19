import { useReducer, useMemo } from "react";
import type { CellType, Pos, PuzzleDef } from "../lib/akari/types";
import { posToKey } from "../lib/akari/types";
import { createEmptyGrid, setCell, isBlack } from "../lib/akari/grid";
import { getIlluminatedCells, getVisibleCells } from "../lib/akari/illumination";

export type EditMode = "play" | "edit";

type State = {
  grid: PuzzleDef;
  bulbs: Set<string>;
  mode: EditMode;
};

type Action =
  | { type: "SET_GRID"; grid: PuzzleDef }
  | { type: "SET_MODE"; mode: EditMode }
  | { type: "RESIZE"; rows: number; cols: number }
  | { type: "TOGGLE_CELL"; pos: Pos }
  | { type: "SET_NUMBER"; pos: Pos; number: number | null }
  | { type: "TOGGLE_BULB"; pos: Pos }
  | { type: "CLEAR_BULBS" }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_GRID":
      return { ...state, grid: action.grid, bulbs: new Set() };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "RESIZE":
      return {
        ...state,
        grid: createEmptyGrid(action.rows, action.cols),
        bulbs: new Set(),
      };
    case "TOGGLE_CELL": {
      const { pos } = action;
      const cell = state.grid.cells[pos.row][pos.col];
      const newCell: CellType =
        cell.kind === "white" ? { kind: "black", number: null } : { kind: "white" };
      const newGrid = setCell(state.grid, pos, newCell);
      // 黒マスにした場合、その位置のbulbを除去
      const key = posToKey(pos);
      const newBulbs = new Set(state.bulbs);
      newBulbs.delete(key);
      return { ...state, grid: newGrid, bulbs: newBulbs };
    }
    case "SET_NUMBER": {
      const { pos, number } = action;
      const cell = state.grid.cells[pos.row][pos.col];
      if (cell.kind !== "black") return state;
      return {
        ...state,
        grid: setCell(state.grid, pos, { kind: "black", number }),
      };
    }
    case "TOGGLE_BULB": {
      const { pos } = action;
      if (isBlack(state.grid, pos)) return state;
      const key = posToKey(pos);
      const newBulbs = new Set(state.bulbs);
      if (newBulbs.has(key)) {
        newBulbs.delete(key);
      } else {
        newBulbs.add(key);
      }
      return { ...state, bulbs: newBulbs };
    }
    case "CLEAR_BULBS":
      return { ...state, bulbs: new Set() };
    case "RESET":
      return {
        ...state,
        grid: createEmptyGrid(state.grid.rows, state.grid.cols),
        bulbs: new Set(),
      };
  }
}

export function useAkariGrid(initialRows = 7, initialCols = 7) {
  const [state, dispatch] = useReducer(reducer, {
    grid: createEmptyGrid(initialRows, initialCols),
    bulbs: new Set<string>(),
    mode: "edit" as EditMode,
  });

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

  return { state, dispatch, illuminated, conflicts };
}
