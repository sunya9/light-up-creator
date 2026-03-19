import { Stage, Layer } from "react-konva";
import { Cell } from "./Cell";
import { BulbIcon } from "./BulbIcon";
import { NumberOverlay } from "./NumberOverlay";
import type { PuzzleDef } from "../lib/akari/types";
import { posToKey } from "../lib/akari/types";
import type { EditMode } from "../hooks/useAkariGrid";

type Props = {
  grid: PuzzleDef;
  bulbs: Set<string>;
  illuminated: Set<string>;
  conflicts: Set<string>;
  mode: EditMode;
  onCellClick: (row: number, col: number) => void;
  cellSize?: number;
};

export function AkariBoard({
  grid,
  bulbs,
  illuminated,
  conflicts,
  mode,
  onCellClick,
  cellSize = 48,
}: Props) {
  const width = grid.cols * cellSize + 2;
  const height = grid.rows * cellSize + 2;

  return (
    <Stage width={width} height={height}>
      <Layer>
        {grid.cells.map((row, r) =>
          row.map((cell, c) => {
            const key = posToKey({ row: r, col: c });
            const x = c * cellSize + 1;
            const y = r * cellSize + 1;
            const isLit = illuminated.has(key);
            const hasConflict = conflicts.has(key);

            return (
              <Cell
                key={key}
                x={x}
                y={y}
                size={cellSize}
                kind={cell.kind === "white" ? "white" : "black"}
                isLit={mode === "play" ? isLit : false}
                hasConflict={mode === "play" ? hasConflict : false}
                onClick={() => onCellClick(r, c)}
              />
            );
          }),
        )}
        {/* 数字オーバーレイ */}
        {grid.cells.flatMap((row, r) =>
          row.map((cell, c) => {
            if (cell.kind !== "black" || cell.number === null) return null;
            const x = c * cellSize + 1 + cellSize / 2;
            const y = r * cellSize + 1 + cellSize / 2;
            return (
              <NumberOverlay
                key={`num-${r},${c}`}
                x={x}
                y={y}
                size={cellSize}
                number={cell.number}
              />
            );
          }),
        )}
        {/* 電球 */}
        {Array.from(bulbs).map((key) => {
          const [r, c] = key.split(",").map(Number);
          const x = c * cellSize + 1 + cellSize / 2;
          const y = r * cellSize + 1 + cellSize / 2;
          return <BulbIcon key={`bulb-${key}`} x={x} y={y} size={cellSize} />;
        })}
      </Layer>
    </Stage>
  );
}
