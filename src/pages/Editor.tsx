import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { LightUpBoard } from "@/components/LightUpBoard";
import { Toolbar } from "@/components/Toolbar";
import { PuzzleStock } from "@/components/PuzzleStock";
import { usePuzzleManager } from "@/hooks/usePuzzleManager";
import { useSolver } from "@/hooks/useSolver";
import { toUrlHash } from "@/lib/lightup/serializer";
import { hasContentOutsideBounds } from "@/lib/lightup/grid";
import { posToKey } from "@/lib/lightup/types";
import type { SolveResult } from "@/lib/lightup/types";
import { usePlayState } from "@/hooks/usePlayState";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { match } from "ts-pattern";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AboutDialog } from "@/components/AboutDialog";
import { Header } from "@/components/Header";

interface Props {
  routeId?: string;
}

export function Editor({ routeId }: Props) {
  const {
    state,
    dispatch,
    illuminated,
    conflicts,
    canUndo,
    canRedo,
    undo,
    redo,
    currentPuzzleId,
    stock,
    newPuzzle,
    copyPuzzle,
    removePuzzle,
  } = usePuzzleManager(routeId);
  const [, navigate] = useLocation();
  const { result, solving } = useSolver(state.grid);

  // Sync URL when currentPuzzleId changes (e.g. auto_assign on first edit, newPuzzle)
  useEffect(() => {
    const target = currentPuzzleId ? `/edit/${currentPuzzleId}` : "/";
    const current = routeId ? `/edit/${routeId}` : "/";
    if (target !== current) {
      navigate(target, { replace: true });
    }
  }, [currentPuzzleId, routeId, navigate]);

  const [rejectedCells, setRejectedCells] = useState<Set<string>>(new Set());
  const rejectTimerRef = useRef<number>(undefined);

  const rejectCell = useCallback((key: string) => {
    clearTimeout(rejectTimerRef.current);
    setRejectedCells(new Set([key]));
    rejectTimerRef.current = setTimeout(() => setRejectedCells(new Set()), 300);
  }, []);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (state.mode === "edit") {
        dispatch({ type: "TOGGLE_CELL", pos: { row, col } });
      } else {
        const key = posToKey({ row, col });
        if (
          !state.bulbs.has(key) &&
          !state.crosses.has(key) &&
          illuminated.has(key) &&
          state.grid.cells[row][col].kind === "white"
        ) {
          rejectCell(key);
          return;
        }
        dispatch({ type: "TOGGLE_BULB", pos: { row, col } });
      }
    },
    [
      state.mode,
      state.bulbs,
      state.crosses,
      state.grid,
      illuminated,
      dispatch,
      rejectCell,
    ],
  );

  const handleCellDrag = useCallback(
    (row: number, col: number) => {
      dispatch({ type: "SET_BLACK", pos: { row, col } });
    },
    [dispatch],
  );

  const handleCellRightClick = useCallback(
    (row: number, col: number) => {
      if (state.mode === "edit") {
        dispatch({ type: "CLEAR_CELL", pos: { row, col } });
      } else {
        dispatch({ type: "TOGGLE_CROSS", pos: { row, col } });
      }
    },
    [state.mode, dispatch],
  );

  const [showSolution, setShowSolution] = useState(false);

  const shareUrl = useMemo(() => {
    const hash = toUrlHash(state.grid);
    return `${window.location.origin}${window.location.pathname}#/play/${hash}`;
  }, [state.grid]);

  const playState = usePlayState(state.grid, state.bulbs);
  const numberErrors =
    state.mode === "play" ? playState.numberErrors : new Set<string>();

  const solveResult: SolveResult | null = result;
  const diffCells =
    solveResult?.kind === "multiple" ? solveResult.diff : new Set<string>();
  const solutionOverlay =
    showSolution && !solving && solveResult?.kind === "unique"
      ? solveResult.solution
      : null;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <PuzzleStock
          puzzles={stock.puzzles}
          currentPuzzleId={currentPuzzleId}
          onRemove={removePuzzle}
          onTogglePosted={stock.togglePosted}
          onNewPuzzle={newPuzzle}
          onCopy={copyPuzzle}
          onRename={stock.rename}
        />
        <SidebarInset className="min-w-0">
          <Header sidebarButton>
            <AboutDialog />
          </Header>
          <div className="mx-auto flex h-full max-h-full w-full max-w-5xl flex-col gap-6 p-6 lg:flex-row">
            <div className="mx-auto w-full min-w-0 space-y-4 lg:h-full lg:max-h-full lg:flex-1">
              <LightUpBoard
                key={currentPuzzleId}
                grid={state.grid}
                bulbs={state.bulbs}
                crosses={state.crosses}
                illuminated={illuminated}
                conflicts={conflicts}
                numberErrors={numberErrors}
                rejectedCells={rejectedCells}
                diffCells={diffCells}
                solutionOverlay={solutionOverlay}
                mode={state.mode}
                onCellClick={handleCellClick}
                onCellRightClick={handleCellRightClick}
                onCellDrag={handleCellDrag}
                onDragStart={() => dispatch({ type: "BATCH_START" })}
                onDragEnd={() => dispatch({ type: "BATCH_END" })}
                className="min-w-0"
              />
              <div className="text-center">
                {match({ solving, solveResult })
                  .with({ solving: true }, () => (
                    <Badge variant="outline">
                      <Spinner />
                      Checking
                    </Badge>
                  ))
                  .with(
                    { solving: false, solveResult: { kind: "unique" } },
                    () => <Badge>Unique solution!</Badge>,
                  )
                  .with(
                    { solving: false, solveResult: { kind: "none" } },
                    () => <Badge variant="destructive">No solution</Badge>,
                  )
                  .with(
                    { solving: false, solveResult: { kind: "multiple" } },
                    ({ solveResult: r }) => (
                      <Badge variant="secondary">
                        Multiple solutions ({r.diff.size} cells differ)
                      </Badge>
                    ),
                  )
                  .with({ solving: false, solveResult: null }, () => null)
                  .exhaustive()}
              </div>
            </div>
            <Toolbar
              rows={state.grid.rows}
              cols={state.grid.cols}
              mode={state.mode}
              solveResult={solveResult}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              onResize={(rows, cols) => {
                dispatch({ type: "RESIZE", rows, cols });
              }}
              willLoseContent={(rows, cols) =>
                hasContentOutsideBounds(state.grid, rows, cols)
              }
              onModeChange={(mode) => dispatch({ type: "SET_MODE", mode })}
              onClearBulbs={() => dispatch({ type: "CLEAR_BULBS" })}
              onReset={() => dispatch({ type: "RESET" })}
              hasContent={
                state.bulbs.size > 0 ||
                state.grid.cells.some((row) =>
                  row.some((cell) => cell.kind === "black"),
                )
              }
              showSolution={showSolution}
              onToggleSolution={() => setShowSolution((s) => !s)}
              shareUrl={shareUrl}
              className="min-w-0 lg:flex-none"
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
