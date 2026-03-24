import {
  useCallback,
  useReducer,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import { historyReducer, createInitialHistory } from "./useLightUpGrid";
import type { HistoryState, Action } from "./useLightUpGrid";
import { usePuzzleStock } from "./usePuzzleStock";
import { createEmptyGrid } from "../lib/lightup/grid";
import {
  getIlluminatedCells,
  getVisibleCells,
} from "../lib/lightup/illumination";
import { posToKey } from "../lib/lightup/types";

// Actions that should NOT auto-assign a puzzle ID
const NO_ID_ASSIGN_ACTIONS = new Set([
  "SET_MODE",
  "SET_GRID",
  "UNDO",
  "REDO",
  "BATCH_START",
  "BATCH_END",
]);

// --- Combined reducer: manages multiple puzzle histories + current ID ---

interface PuzzlesState {
  currentId: string | undefined;
  histories: Record<string, HistoryState>;
}

type PuzzlesAction =
  | { type: "grid"; action: Action; autoAssign?: boolean }
  | { type: "switch"; id: string }
  | { type: "create"; id: string; history: HistoryState }
  | { type: "load"; id: string; fallbackHistory: HistoryState }
  | { type: "remove"; id: string }
  | { type: "clear_id" };

function puzzlesReducer(
  state: PuzzlesState,
  action: PuzzlesAction,
): PuzzlesState {
  switch (action.type) {
    case "grid": {
      let { currentId } = state;
      let histories = state.histories;

      // Auto-assign ID on first meaningful edit
      if (action.autoAssign && !currentId) {
        currentId = crypto.randomUUID();
        histories = {
          ...histories,
          [currentId]: histories[""] ?? createInitialHistory(),
        };
      }

      if (!currentId) return state;
      const current = histories[currentId];
      if (!current) return state;
      const next = historyReducer(current, action.action);
      if (next === current && histories === state.histories) return state;
      return { currentId, histories: { ...histories, [currentId]: next } };
    }
    case "switch":
      return { ...state, currentId: action.id };
    case "create":
      return {
        currentId: action.id,
        histories: { ...state.histories, [action.id]: action.history },
      };
    case "load":
      return {
        ...state,
        currentId: action.id,
        histories: state.histories[action.id]
          ? state.histories
          : { ...state.histories, [action.id]: action.fallbackHistory },
      };
    case "remove": {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [action.id]: _, ...rest } = state.histories;
      return { ...state, histories: rest };
    }
    case "clear_id":
      return { ...state, currentId: undefined };
  }
}

function initPuzzlesState(): PuzzlesState {
  return { currentId: undefined, histories: { "": createInitialHistory() } };
}

// --- Hook ---

export function usePuzzleManager(routeId?: string) {
  const stock = usePuzzleStock();
  const [puzzlesState, puzzlesDispatch] = useReducer(
    puzzlesReducer,
    undefined,
    initPuzzlesState,
  );

  const { currentId: currentPuzzleId, histories } = puzzlesState;

  // Current puzzle's history (unsaved puzzle uses "" key)
  const currentHistory =
    histories[currentPuzzleId ?? ""] ?? createInitialHistory();
  const { current: state } = currentHistory;
  const canUndo = currentHistory.past.length > 0;
  const canRedo = currentHistory.future.length > 0;

  // --- Dispatch: routes grid actions + auto-assigns ID in one reducer call ---
  const dispatch = useCallback((action: Action) => {
    const autoAssign = !NO_ID_ASSIGN_ACTIONS.has(action.type);
    puzzlesDispatch({ type: "grid", action, autoAssign });
  }, []);

  const undo = useCallback(() => dispatch({ type: "UNDO" }), [dispatch]);
  const redo = useCallback(() => dispatch({ type: "REDO" }), [dispatch]);

  // Keyboard shortcuts
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

  // Derived state
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

  // --- Auto-save (immediate) ---
  const onGridChange = useEffectEvent(() => {
    if (currentPuzzleId) {
      stock.upsert(currentPuzzleId, state.grid);
    }
  });

  useEffect(() => {
    onGridChange();
  }, [state.grid, currentPuzzleId]);

  // --- Load puzzle (switch to existing) ---
  const loadPuzzle = useCallback(
    (id: string) => {
      const grid = stock.load(id);
      const fallbackHistory: HistoryState = grid
        ? {
            current: {
              grid,
              bulbs: new Set(),
              crosses: new Set(),
              mode: "edit",
            },
            past: [],
            future: [],
            batchSnapshot: null,
          }
        : createInitialHistory();

      puzzlesDispatch({ type: "load", id, fallbackHistory });
    },
    [stock],
  );

  // --- Sync with route ID during render ---
  const [prevRouteId, setPrevRouteId] = useState<string | undefined>(undefined);
  if (routeId !== prevRouteId) {
    setPrevRouteId(routeId);
    if (routeId && routeId !== currentPuzzleId) {
      loadPuzzle(routeId);
    }
  }

  // --- New puzzle ---
  const newPuzzle = useCallback(() => {
    const newId = crypto.randomUUID();
    const emptyGrid = createEmptyGrid(7, 7);
    puzzlesDispatch({
      type: "create",
      id: newId,
      history: createInitialHistory(),
    });
    stock.upsert(newId, emptyGrid);
  }, [stock]);

  // --- Copy puzzle ---
  const copyPuzzle = useCallback(
    (id: string) => {
      stock.copy(id);
    },
    [stock],
  );

  // --- Remove puzzle ---
  const removePuzzle = useCallback(
    (id: string) => {
      if (currentPuzzleId === id) {
        const idx = stock.puzzles.findIndex((p) => p.id === id);
        const next = stock.puzzles[idx + 1] ?? stock.puzzles[idx - 1];

        puzzlesDispatch({ type: "clear_id" });

        if (next) {
          loadPuzzle(next.id);
        } else {
          newPuzzle();
        }
      }

      puzzlesDispatch({ type: "remove", id });
      stock.remove(id);
    },
    [stock, currentPuzzleId, loadPuzzle, newPuzzle],
  );

  return {
    state,
    dispatch,
    illuminated,
    conflicts,
    canUndo,
    canRedo,
    undo,
    redo,
    currentPuzzleId,
    stock,
    loadPuzzle,
    newPuzzle,
    copyPuzzle,
    removePuzzle,
  };
}
