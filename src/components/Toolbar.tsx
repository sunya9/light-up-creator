import { useState } from "react";
import type { EditMode } from "../hooks/useAkariGrid";
import type { SolveResult } from "../lib/akari/types";

type Props = {
  rows: number;
  cols: number;
  mode: EditMode;
  solveResult: SolveResult | null;
  solving: boolean;
  onResize: (rows: number, cols: number) => void;
  onModeChange: (mode: EditMode) => void;
  onSolve: () => void;
  onClearBulbs: () => void;
  onReset: () => void;
  onApplySolution: () => void;
  onExportUrl: () => void;
};

export function Toolbar({
  rows,
  cols,
  mode,
  solveResult,
  solving,
  onResize,
  onModeChange,
  onSolve,
  onClearBulbs,
  onReset,
  onApplySolution,
  onExportUrl,
}: Props) {
  const [inputRows, setInputRows] = useState(String(rows));
  const [inputCols, setInputCols] = useState(String(cols));

  const handleResize = () => {
    const r = parseInt(inputRows, 10);
    const c = parseInt(inputCols, 10);
    if (r > 0 && r <= 30 && c > 0 && c <= 30) {
      onResize(r, c);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 220 }}>
      <div>
        <h3 style={{ margin: "0 0 8px" }}>Grid Size</h3>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <label>
            Rows:
            <input
              type="number"
              min={1}
              max={30}
              value={inputRows}
              onChange={(e) => setInputRows(e.target.value)}
              style={{ width: 50, marginLeft: 4 }}
            />
          </label>
          <label>
            Cols:
            <input
              type="number"
              min={1}
              max={30}
              value={inputCols}
              onChange={(e) => setInputCols(e.target.value)}
              style={{ width: 50, marginLeft: 4 }}
            />
          </label>
          <button onClick={handleResize}>Apply</button>
        </div>
      </div>

      <div>
        <h3 style={{ margin: "0 0 8px" }}>Mode</h3>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onModeChange("edit")}
            style={{ fontWeight: mode === "edit" ? "bold" : "normal" }}
          >
            Edit
          </button>
          <button
            onClick={() => onModeChange("play")}
            style={{ fontWeight: mode === "play" ? "bold" : "normal" }}
          >
            Play
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
          {mode === "edit"
            ? "Click: toggle black/white. Right-click black: cycle number."
            : "Click white cell: toggle bulb."}
        </p>
      </div>

      <div>
        <h3 style={{ margin: "0 0 8px" }}>Solver</h3>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button onClick={onSolve} disabled={solving}>
            {solving ? "Solving..." : "Check / Solve"}
          </button>
          {solveResult?.kind === "unique" && (
            <button onClick={onApplySolution}>Show Solution</button>
          )}
        </div>
        {solveResult && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              fontWeight: "bold",
              color:
                solveResult.kind === "unique"
                  ? "#16a34a"
                  : solveResult.kind === "none"
                    ? "#dc2626"
                    : "#d97706",
            }}
          >
            {solveResult.kind === "unique"
              ? "Unique solution exists!"
              : solveResult.kind === "none"
                ? "No solution."
                : "Multiple solutions."}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <button onClick={onClearBulbs}>Clear Bulbs</button>
        <button onClick={onReset}>Reset Grid</button>
        <button onClick={onExportUrl}>Share URL</button>
      </div>
    </div>
  );
}
