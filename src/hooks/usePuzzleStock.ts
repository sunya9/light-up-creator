import { useCallback, useSyncExternalStore } from "react";
import * as v from "valibot";
import type { PuzzleDef } from "../lib/lightup/types";
import { serialize, deserialize } from "../lib/lightup/serializer";
import { usePuzzleStockStore } from "../contexts/usePuzzleStockStore";
import { STORAGE_KEY } from "../contexts/PuzzleStockStore";
import { StockArraySchema } from "../lib/stockSchema";
import type { StockedPuzzle } from "../lib/stockSchema";

export { PuzzleStockProvider } from "../contexts/PuzzleStockContext";
export type { StockedPuzzle } from "../lib/stockSchema";

function readStock(): StockedPuzzle[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const result = v.safeParse(StockArraySchema, JSON.parse(raw));
  return result.success ? result.output : [];
}

function writeStock(puzzles: StockedPuzzle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function usePuzzleStock() {
  const store = usePuzzleStockStore();
  const puzzles = useSyncExternalStore(subscribe, store.getSnapshot);

  const upsert = useCallback((id: string, grid: PuzzleDef, name?: string) => {
    const stock = readStock();
    const serialized = serialize(grid);
    const existing = stock.find((p) => p.id === id);
    if (existing) {
      writeStock(
        stock.map((p) =>
          p.id === id
            ? {
                ...p,
                data: serialized,
                ...(name != null ? { name } : {}),
              }
            : p,
        ),
      );
    } else {
      const entry: StockedPuzzle = {
        id,
        name: name ?? "New Puzzle",
        data: serialize(grid),
        posted: false,
        createdAt: Date.now(),
      };
      writeStock([entry, ...stock]);
    }
  }, []);

  const copy = useCallback((id: string): string | null => {
    const stock = readStock();
    const source = stock.find((p) => p.id === id);
    if (!source) return null;
    const newId = crypto.randomUUID();
    const entry: StockedPuzzle = {
      ...source,
      id: newId,
      name: `${source.name} (copy)`,
      createdAt: Date.now(),
    };
    writeStock([entry, ...stock]);
    return newId;
  }, []);

  const load = useCallback((id: string): PuzzleDef | null => {
    const stock = readStock();
    const entry = stock.find((p) => p.id === id);
    if (!entry) return null;
    return deserialize(entry.data);
  }, []);

  const remove = useCallback((id: string) => {
    const stock = readStock();
    writeStock(stock.filter((p) => p.id !== id));
  }, []);

  const togglePosted = useCallback((id: string) => {
    const stock = readStock();
    writeStock(
      stock.map((p) => (p.id === id ? { ...p, posted: !p.posted } : p)),
    );
  }, []);

  const rename = useCallback((id: string, name: string) => {
    const stock = readStock();
    writeStock(stock.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  return { puzzles, upsert, copy, load, remove, togglePosted, rename };
}
