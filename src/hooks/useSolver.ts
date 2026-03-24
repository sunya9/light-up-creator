import { useReducer, useRef, useEffect } from "react";
import type { PuzzleDef, SolveResult } from "../lib/lightup/types";

const DEBOUNCE_MS = 200;

interface SolverState {
  result: SolveResult | null;
  solving: boolean;
}

type SolverAction =
  | { type: "start" }
  | { type: "done"; result: SolveResult }
  | { type: "error" };

function solverReducer(_state: SolverState, action: SolverAction): SolverState {
  switch (action.type) {
    case "start":
      return { result: null, solving: true };
    case "done":
      return { result: action.result, solving: false };
    case "error":
      return { result: null, solving: false };
    default:
      return _state;
  }
}

function createWorker() {
  return new Worker(new URL("../workers/solver.worker.ts", import.meta.url), {
    type: "module",
  });
}

export function useSolver(grid: PuzzleDef) {
  const [state, dispatch] = useReducer(solverReducer, {
    result: null,
    solving: false,
  });
  const workerRef = useRef<Worker>(undefined);
  const timerRef = useRef<number>(undefined);

  useEffect(() => {
    dispatch({ type: "start" });

    timerRef.current = setTimeout(() => {
      const worker = createWorker();
      workerRef.current = worker;
      worker.addEventListener("message", (e: MessageEvent<SolveResult>) => {
        dispatch({ type: "done", result: e.data });
      });

      worker.addEventListener("error", () => {
        dispatch({ type: "error" });
      });

      worker.postMessage(grid);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timerRef.current);
      workerRef.current?.terminate();
    };
  }, [grid]);

  return state;
}
