import * as v from "valibot";
import { StockArraySchema, type StockedPuzzle } from "@/lib/stockSchema";

export const STORAGE_KEY = "lightup-puzzle-stock";

export class PuzzleStockStore {
  #cache: StockedPuzzle[] = [];
  #raw: string | undefined;

  getSnapshot = (): StockedPuzzle[] => {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "";
    if (raw !== this.#raw) {
      this.#raw = raw;
      if (raw) {
        const result = v.safeParse(StockArraySchema, JSON.parse(raw));
        this.#cache = result.success ? result.output : [];
      } else {
        this.#cache = [];
      }
    }
    return this.#cache;
  };
}
