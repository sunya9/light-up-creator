import { useEffect, useRef, useState } from "react";
import type { PuzzleDef } from "../lib/lightup/types";
import type {
  PlayStateRequest,
  PlayStateResponse,
} from "../workers/playState.worker";

export interface PlayStateResult {
  conflicts: Set<string>;
  numberErrors: Set<string>;
  isSolved: boolean;
}

const EMPTY: PlayStateResult = {
  conflicts: new Set(),
  numberErrors: new Set(),
  isSolved: false,
};

const DEBOUNCE_MS = 100;

function createWorker() {
  return new Worker(
    new URL("../workers/playState.worker.ts", import.meta.url),
    { type: "module" },
  );
}

export function usePlayState(
  grid: PuzzleDef,
  bulbs: Set<string>,
): PlayStateResult {
  const [state, setState] = useState<PlayStateResult>(EMPTY);
  const workerRef = useRef<Worker>(undefined);
  const timerRef = useRef<number>(undefined);

  useEffect(() => {
    clearTimeout(timerRef.current);
    workerRef.current?.terminate();

    timerRef.current = setTimeout(() => {
      if (bulbs.size === 0) return;
      const worker = createWorker();
      workerRef.current = worker;

      worker.addEventListener(
        "message",
        (e: MessageEvent<PlayStateResponse>) => {
          setState({
            conflicts: new Set(e.data.conflicts),
            numberErrors: new Set(e.data.numberErrors),
            isSolved: e.data.isSolved,
          });
        },
      );

      worker.addEventListener("error", () => {
        setState(EMPTY);
      });

      const request: PlayStateRequest = {
        grid,
        bulbs: Array.from(bulbs),
      };
      worker.postMessage(request);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timerRef.current);
      workerRef.current?.terminate();
    };
  }, [grid, bulbs]);

  return state;
}
