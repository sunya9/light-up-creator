import { useCallback, useEffect } from "react";
import { AkariBoard } from "./components/AkariBoard";
import { Toolbar } from "./components/Toolbar";
import { useAkariGrid } from "./hooks/useAkariGrid";
import { useSolver } from "./hooks/useSolver";
import { toUrlHash, fromUrlHash } from "./lib/akari/serializer";
import type { SolveResult } from "./lib/akari/types";

function App() {
  const { state, dispatch, illuminated, conflicts } = useAkariGrid(7, 7);
  const { result, solving, runSolver, clear } = useSolver();

  // URL hash からパズル復元
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const grid = fromUrlHash(hash);
        dispatch({ type: "SET_GRID", grid });
      } catch {
        // ignore invalid hash
      }
    }
  }, [dispatch]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (state.mode === "edit") {
        dispatch({ type: "TOGGLE_CELL", pos: { row, col } });
      } else {
        dispatch({ type: "TOGGLE_BULB", pos: { row, col } });
      }
      clear();
    },
    [state.mode, dispatch, clear],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (state.mode !== "edit") return;

      // Konva の Stage から座標を取得するのが難しいため、
      // DOM のマウス座標からセルを逆算
      const rect = (e.target as HTMLElement).closest(".konvajs-content")?.getBoundingClientRect();
      if (!rect) return;
      const cellSize = 48;
      const col = Math.floor((e.clientX - rect.left - 1) / cellSize);
      const row = Math.floor((e.clientY - rect.top - 1) / cellSize);

      if (row < 0 || row >= state.grid.rows || col < 0 || col >= state.grid.cols) return;
      const cell = state.grid.cells[row][col];
      if (cell.kind !== "black") return;

      // 数字サイクル: null → 0 → 1 → 2 → 3 → 4 → null
      const next = cell.number === null ? 0 : cell.number >= 4 ? null : cell.number + 1;
      dispatch({ type: "SET_NUMBER", pos: { row, col }, number: next });
      clear();
    },
    [state.mode, state.grid, dispatch, clear],
  );

  const handleApplySolution = useCallback(() => {
    if (result?.kind === "unique") {
      dispatch({ type: "CLEAR_BULBS" });
      for (const key of result.solution) {
        const [row, col] = key.split(",").map(Number);
        dispatch({ type: "TOGGLE_BULB", pos: { row, col } });
      }
    }
  }, [result, dispatch]);

  const handleExportUrl = useCallback(() => {
    const hash = toUrlHash(state.grid);
    window.location.hash = hash;
    navigator.clipboard.writeText(window.location.href).catch(() => {
      // clipboard not available
    });
  }, [state.grid]);

  // Worker の結果を SolveResult に変換（solution が string[] の場合）
  const solveResult: SolveResult | null = result;

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
      }}
    >
      <div>
        <h1 style={{ margin: "0 0 16px", fontSize: 24 }}>Akari Puzzle Creator</h1>
        <div onContextMenu={handleContextMenu}>
          <AkariBoard
            grid={state.grid}
            bulbs={state.bulbs}
            illuminated={illuminated}
            conflicts={conflicts}
            mode={state.mode}
            onCellClick={handleCellClick}
          />
        </div>
      </div>
      <Toolbar
        rows={state.grid.rows}
        cols={state.grid.cols}
        mode={state.mode}
        solveResult={solveResult}
        solving={solving}
        onResize={(rows, cols) => {
          dispatch({ type: "RESIZE", rows, cols });
          clear();
        }}
        onModeChange={(mode) => dispatch({ type: "SET_MODE", mode })}
        onSolve={() => runSolver(state.grid)}
        onClearBulbs={() => {
          dispatch({ type: "CLEAR_BULBS" });
          clear();
        }}
        onReset={() => {
          dispatch({ type: "RESET" });
          clear();
        }}
        onApplySolution={handleApplySolution}
        onExportUrl={handleExportUrl}
      />
    </div>
  );
}

export default App;
