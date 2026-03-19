import { useState, useCallback, useRef, useEffect } from "react";
import type { PuzzleDef, SolveResult } from "../lib/akari/types";

export function useSolver() {
  const [result, setResult] = useState<SolveResult | null>(null);
  const [solving, setSolving] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const runSolver = useCallback((grid: PuzzleDef) => {
    workerRef.current?.terminate();
    setSolving(true);
    setResult(null);

    const worker = new Worker(new URL("../workers/solver.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<SolveResult | { kind: "unique"; solution: string[] }>) => {
      const data = e.data;
      if (data.kind === "unique" && Array.isArray(data.solution)) {
        setResult({ kind: "unique", solution: new Set(data.solution) });
      } else {
        setResult(data as SolveResult);
      }
      setSolving(false);
    };

    worker.onerror = () => {
      setSolving(false);
    };

    worker.postMessage(grid);
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    workerRef.current?.terminate();
    setSolving(false);
  }, []);

  return { result, solving, runSolver, clear };
}
