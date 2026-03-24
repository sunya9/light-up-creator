import { useRef, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Stage, Layer } from "react-konva";
import { Cell } from "./Cell";
import { BulbIcon } from "./BulbIcon";
import { CrossMark } from "./CrossMark";
import { NumberOverlay } from "./NumberOverlay";
import type { PuzzleDef } from "../lib/lightup/types";
import { posToKey } from "../lib/lightup/types";
import type { EditMode } from "../hooks/useLightUpGrid";
import type { KonvaEventObject } from "konva/lib/Node";

interface Props {
  grid: PuzzleDef;
  bulbs: Set<string>;
  crosses: Set<string>;
  illuminated: Set<string>;
  conflicts: Set<string>;
  numberErrors: Set<string>;
  rejectedCells: Set<string>;
  diffCells: Set<string>;
  solutionOverlay: Set<string> | null;
  mode: EditMode;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick?: (row: number, col: number) => void;
  onCellDrag?: (row: number, col: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  className?: string;
}

const cellSize = 48;
const borderWidth = 2;

export function LightUpBoard({
  grid,
  bulbs,
  crosses,
  illuminated,
  conflicts,
  numberErrors,
  rejectedCells,
  diffCells,
  solutionOverlay,
  mode,
  onCellClick,
  onCellRightClick,
  onCellDrag,
  onDragStart,
  onDragEnd,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneWidth = cellSize * grid.cols + borderWidth;
  const sceneHeight = cellSize * grid.rows + borderWidth;
  const [stageSize, setStageSize] = useState({
    width: sceneWidth,
    height: sceneHeight,
    scale: 0, // invisible
  });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = (el: HTMLDivElement) => {
      const containerWidth = el.offsetWidth;
      const containerHeight = el.offsetHeight;
      const fitHeight = sceneWidth < sceneHeight;
      // Calculate scale — fit to width, and also to height when fitHeight is set
      const scaleX = containerWidth / sceneWidth;
      const scaleY = containerHeight / sceneHeight;
      // const scale = Math.min(scaleX, scaleY);
      const scale = fitHeight ? scaleY : scaleX;
      // Update state with new dimensions
      setStageSize({
        width: sceneWidth * scale,
        height: sceneHeight * scale,
        scale,
      });
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // Get container width
        updateSize(el);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [sceneHeight, sceneWidth]);

  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startCellRef = useRef<{ row: number; col: number } | null>(null);
  const paintedRef = useRef(new Set<string>());

  const posFromPointer = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return null;
      const pos = stage.getPointerPosition();
      if (!pos) return null;
      const scale = stageSize.scale || 1;
      const col = Math.floor((pos.x / scale - 1) / cellSize);
      const row = Math.floor((pos.y / scale - 1) / cellSize);
      if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols)
        return null;
      return { row, col };
    },
    [grid.rows, grid.cols, stageSize.scale],
  );

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.evt.button !== 0) return;
      const pos = posFromPointer(e);
      if (!pos) return;
      startCellRef.current = pos;
      movedRef.current = false;
      if (mode === "edit" && onCellDrag) {
        draggingRef.current = true;
        paintedRef.current = new Set();
        onDragStart?.();
      }
    },
    [mode, onCellDrag, onDragStart, posFromPointer],
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!draggingRef.current || !onCellDrag) return;
      const pos = posFromPointer(e);
      if (!pos) return;
      const key = `${pos.row},${pos.col}`;
      const startKey = startCellRef.current
        ? `${startCellRef.current.row},${startCellRef.current.col}`
        : null;

      // 別セルに移動した時点でドラッグ確定
      if (!movedRef.current && key !== startKey) {
        movedRef.current = true;
        // 開始セルも黒塗り対象
        if (
          startCellRef.current &&
          grid.cells[startCellRef.current.row][startCellRef.current.col]
            .kind === "white"
        ) {
          paintedRef.current.add(startKey!);
          onCellDrag(startCellRef.current.row, startCellRef.current.col);
        }
      }

      if (!movedRef.current) return;
      if (paintedRef.current.has(key)) return;
      if (grid.cells[pos.row][pos.col].kind === "white") {
        paintedRef.current.add(key);
        onCellDrag(pos.row, pos.col);
      }
    },
    [onCellDrag, posFromPointer, grid.cells],
  );

  const handleMouseUp = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.evt.button !== 0) return;
      if (!startCellRef.current) return; // mousedown がキャンバス内で起きていない
      if (draggingRef.current) {
        draggingRef.current = false;
        if (!movedRef.current) {
          const pos = posFromPointer(e) ?? startCellRef.current;
          if (pos) onCellClick(pos.row, pos.col);
        }
        onDragEnd?.();
      } else {
        const pos = posFromPointer(e);
        if (pos) onCellClick(pos.row, pos.col);
      }
      startCellRef.current = null;
    },
    [onCellClick, onDragEnd, posFromPointer],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!onCellRightClick) return;
      const el = containerRef.current?.querySelector(".konvajs-content");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scale = stageSize.scale || 1;
      const col = Math.floor(((e.clientX - rect.left) / scale - 1) / cellSize);
      const row = Math.floor(((e.clientY - rect.top) / scale - 1) / cellSize);
      if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) return;
      onCellRightClick(row, col);
    },
    [onCellRightClick, grid.rows, grid.cols, stageSize.scale],
  );

  return (
    <div
      ref={containerRef}
      className={cn("max-h-full w-full space-y-4", className)}
      onContextMenu={handleContextMenu}
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        scaleX={stageSize.scale}
        scaleY={stageSize.scale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="[&>.konvajs-content]:mx-auto"
      >
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
                  hasNumberError={
                    mode === "play" ? numberErrors.has(key) : false
                  }
                  isRejected={rejectedCells.has(key)}
                  isDiff={diffCells.has(key)}
                  onClick={() => {}}
                />
              );
            }),
          )}
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
          {Array.from(crosses).map((key) => {
            const [r, c] = key.split(",").map(Number);
            const x = c * cellSize + 1 + cellSize / 2;
            const y = r * cellSize + 1 + cellSize / 2;
            return (
              <CrossMark key={`cross-${key}`} x={x} y={y} size={cellSize} />
            );
          })}
          {Array.from(bulbs).map((key) => {
            const [r, c] = key.split(",").map(Number);
            const x = c * cellSize + 1 + cellSize / 2;
            const y = r * cellSize + 1 + cellSize / 2;
            return <BulbIcon key={`bulb-${key}`} x={x} y={y} size={cellSize} />;
          })}
          {solutionOverlay &&
            Array.from(solutionOverlay)
              .filter((key) => !bulbs.has(key))
              .map((key) => {
                const [r, c] = key.split(",").map(Number);
                const x = c * cellSize + 1 + cellSize / 2;
                const y = r * cellSize + 1 + cellSize / 2;
                return (
                  <BulbIcon
                    key={`sol-${key}`}
                    x={x}
                    y={y}
                    size={cellSize}
                    opacity={0.35}
                  />
                );
              })}
        </Layer>
      </Stage>
    </div>
  );
}
