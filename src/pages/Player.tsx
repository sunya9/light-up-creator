import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LightUpBoard } from "../components/LightUpBoard";
import { fromUrlHash } from "../lib/lightup/serializer";
import { getIlluminatedCells } from "../lib/lightup/illumination";
import { toggleBulb } from "../lib/lightup/bulbToggle";
import { posToKey } from "../lib/lightup/types";
import type { PuzzleDef } from "../lib/lightup/types";
import { usePlayState } from "../hooks/usePlayState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Import, TriangleAlert, Home } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { AboutDialog } from "../components/AboutDialog";
import { Header } from "@/components/Header";

interface Props {
  hash: string;
}

export function Player({ hash }: Props) {
  const grid = useMemo(() => {
    try {
      return fromUrlHash(hash);
    } catch {
      return null;
    }
  }, [hash]);

  if (!grid) {
    return (
      <Empty className="min-h-screen">
        <EmptyHeader>
          <EmptyMedia>
            <TriangleAlert />
          </EmptyMedia>
          <EmptyTitle>Invalid puzzle URL</EmptyTitle>
          <EmptyDescription>
            パズルデータを読み込めませんでした。URLが正しいか確認してください。
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="ghost" nativeButton={false} render={<Link to="/" />}>
          <Home />
          Home
        </Button>
      </Empty>
    );
  }

  return <PlayerInternal hash={hash} grid={grid} />;
}

function PlayerInternal({ hash, grid }: { hash: string; grid: PuzzleDef }) {
  const [, navigate] = useLocation();

  const [bulbs, setBulbs] = useState<Set<string>>(new Set());
  const [crosses, setCrosses] = useState<Set<string>>(new Set());
  const [rejectedCells, setRejectedCells] = useState<Set<string>>(new Set());
  const rejectTimerRef = useRef<number>(undefined);

  const illuminated = useMemo(
    () => getIlluminatedCells(grid, bulbs),
    [grid, bulbs],
  );

  const { conflicts, numberErrors, isSolved } = usePlayState(grid, bulbs);

  const rejectCell = useCallback((key: string) => {
    clearTimeout(rejectTimerRef.current);
    setRejectedCells(new Set([key]));
    rejectTimerRef.current = setTimeout(() => setRejectedCells(new Set()), 300);
  }, []);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      const pos = { row, col };
      const key = posToKey(pos);
      const result = toggleBulb(grid, pos, bulbs, crosses, illuminated);

      switch (result.action) {
        case "remove_cross":
          setCrosses((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          break;
        case "remove_bulb":
          setBulbs((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          break;
        case "place_cross":
          setCrosses((prev) => new Set(prev).add(key));
          break;
        case "place_bulb":
          setBulbs((prev) => new Set(prev).add(key));
          break;
        case "reject":
          rejectCell(key);
          break;
        case "none":
          break;
      }
    },
    [grid, bulbs, crosses, illuminated, rejectCell],
  );

  const handleCellRightClick = useCallback(
    (row: number, col: number) => {
      const key = posToKey({ row, col });
      if (grid.cells[row][col].kind === "black") return;
      if (bulbs.has(key)) return;

      setCrosses((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    },
    [grid, bulbs],
  );

  return (
    <div className="flex h-svh flex-col">
      <Header>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/import/${hash}`)}>
            <Import />
            Import Puzzle
          </Button>
          <AboutDialog />
        </div>
      </Header>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-1 flex-col justify-center p-4">
        <div className="flex h-full min-h-0 w-full flex-col items-center gap-4">
          <LightUpBoard
            grid={grid}
            bulbs={bulbs}
            crosses={crosses}
            illuminated={illuminated}
            conflicts={conflicts}
            numberErrors={numberErrors}
            rejectedCells={rejectedCells}
            diffCells={new Set()}
            solutionOverlay={null}
            mode="play"
            onCellClick={handleCellClick}
            onCellRightClick={handleCellRightClick}
            onCellDrag={() => {}}
            onDragStart={() => {}}
            onDragEnd={() => {}}
          />
          <Badge className={cn({ invisible: !isSolved })}>Solved!</Badge>
        </div>
      </div>
    </div>
  );
}
