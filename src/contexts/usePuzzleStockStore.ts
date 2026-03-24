import { createContext, useContext } from "react";
import { PuzzleStockStore } from "./PuzzleStockStore";

export const PuzzleStockContext = createContext<PuzzleStockStore | null>(null);

export function usePuzzleStockStore(): PuzzleStockStore {
  const store = useContext(PuzzleStockContext);
  if (!store) {
    throw new Error("usePuzzleStock must be used within a PuzzleStockProvider");
  }
  return store;
}
