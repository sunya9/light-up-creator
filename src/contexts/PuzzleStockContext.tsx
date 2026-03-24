import { useMemo } from "react";
import type { ReactNode } from "react";
import { PuzzleStockStore } from "./PuzzleStockStore";
import { PuzzleStockContext } from "./usePuzzleStockStore";

export function PuzzleStockProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => new PuzzleStockStore(), []);
  return <PuzzleStockContext value={store}>{children}</PuzzleStockContext>;
}
