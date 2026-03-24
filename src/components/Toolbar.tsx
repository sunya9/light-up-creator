import { useCallback, useState, type MouseEvent } from "react";
import {
  Pencil,
  Play,
  Trash2,
  RotateCcw,
  Copy,
  Eye,
  Undo2,
  Redo2,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EditMode } from "../hooks/useLightUpGrid";
import type { SolveResult } from "../lib/lightup/types";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";

type Props = {
  rows: number;
  cols: number;
  mode: EditMode;
  solveResult: SolveResult | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResize: (rows: number, cols: number) => void;
  willLoseContent: (rows: number, cols: number) => boolean;
  onModeChange: (mode: EditMode) => void;
  onClearBulbs: () => void;
  onReset: () => void;
  hasContent: boolean;
  showSolution: boolean;
  onToggleSolution: () => void;
  shareUrl: string;
  className?: string;
};

export function Toolbar({
  rows,
  cols,
  mode,
  solveResult,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResize,
  willLoseContent,
  onModeChange,
  onClearBulbs,
  onReset,
  hasContent,
  showSolution,
  onToggleSolution,
  shareUrl,
  className,
}: Props) {
  const gridKey = `${rows}x${cols}`;
  const [inputRows, setInputRows] = useState(String(rows));
  const [inputCols, setInputCols] = useState(String(cols));
  const [prevKey, setPrevKey] = useState(gridKey);
  if (prevKey !== gridKey) {
    setPrevKey(gridKey);
    setInputRows(String(rows));
    setInputCols(String(cols));
  }
  const [showResizeAlert, setShowResizeAlert] = useState(false);
  const [showResetAlert, setShowResetAlert] = useState(false);
  const [pendingResize, setPendingResize] = useState<{
    rows: number;
    cols: number;
  } | null>(null);

  const handleResize = useCallback(() => {
    const r = parseInt(inputRows, 10);
    const c = parseInt(inputCols, 10);
    if (r <= 0 || r > 30 || c <= 0 || c > 30) return;
    if (willLoseContent(r, c)) {
      setPendingResize({ rows: r, cols: c });
      setShowResizeAlert(true);
    } else {
      onResize(r, c);
    }
  }, [inputCols, inputRows, onResize, willLoseContent]);

  const confirmResize = useCallback(() => {
    if (pendingResize) {
      onResize(pendingResize.rows, pendingResize.cols);
      setPendingResize(null);
    }
    setShowResizeAlert(false);
  }, [onResize, pendingResize]);

  const selectShareUrl = useCallback((e: MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  }, []);

  return (
    <div
      className={cn("flex w-full shrink-0 flex-col gap-3 lg:w-64", className)}
    >
      {/* Mode */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Mode</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <ToggleGroup
            value={[mode]}
            onValueChange={(val) => {
              const v = val[val.length - 1];
              if (v === "edit" || v === "play") onModeChange(v);
            }}
            className="w-full"
          >
            <ToggleGroupItem
              value="edit"
              variant="outline"
              className="flex-1 gap-1.5"
            >
              <Pencil />
              Edit
            </ToggleGroupItem>
            <ToggleGroupItem
              value="play"
              variant="outline"
              className="flex-1 gap-1.5"
            >
              <Play />
              Play
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">
            {mode === "edit"
              ? "Click: toggle black/white. Right-click black: cycle number."
              : "Click: toggle bulb (✕ → remove ✕). Right-click: toggle ✕ mark."}
          </p>
        </CardContent>
      </Card>

      {/* Grid Size */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Grid Size</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleResize();
            }}
          >
            <fieldset disabled={mode === "play"}>
              <FieldGroup className="flex-row items-end gap-2">
                <Field className="w-16">
                  <FieldLabel>Rows</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={inputRows}
                    onChange={(e) => setInputRows(e.target.value)}
                  />
                </Field>
                <Field className="w-16">
                  <FieldLabel>Cols</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={inputCols}
                    onChange={(e) => setInputCols(e.target.value)}
                  />
                </Field>
                <Button type="submit" variant="outline" size="sm">
                  Apply
                </Button>
              </FieldGroup>
            </fieldset>
          </form>
        </CardContent>
      </Card>

      {/* Undo / Redo */}
      <ButtonGroup className="w-full">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onUndo}
          disabled={!canUndo}
        >
          <Undo2 />
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onRedo}
          disabled={!canRedo}
        >
          <Redo2 />
          Redo
        </Button>
      </ButtonGroup>

      {/* Solver */}
      <Button
        variant={showSolution ? "default" : "outline"}
        size="sm"
        disabled={solveResult?.kind !== "unique"}
        onClick={onToggleSolution}
      >
        <Eye />
        {showSolution ? "Hide Solution" : "Show Solution"}
      </Button>

      {/* Actions */}
      <div className="flex flex-col gap-1.5">
        <Button variant="outline" size="sm" onClick={onClearBulbs}>
          <Trash2 />
          Clear Bulbs
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (hasContent) {
              setShowResetAlert(true);
            } else {
              onReset();
            }
          }}
        >
          <RotateCcw />
          Reset Grid
        </Button>
        <Field>
          <FieldLabel>Share URL</FieldLabel>
          <InputGroup>
            <InputGroupInput
              readOnly
              value={shareUrl}
              onClick={selectShareUrl}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Copy URL"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl).catch(() => {});
                }}
              >
                <Copy />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Button
          variant="link"
          size="sm"
          className="self-start"
          nativeButton={false}
          render={<Link href={`/play/${shareUrl.split("#/play/")[1] ?? ""}`} />}
        >
          Go to Play page
        </Button>
      </div>

      <AlertDialog open={showResetAlert} onOpenChange={setShowResetAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Grid</AlertDialogTitle>
            <AlertDialogDescription>
              盤面の内容がすべて消えます。続行しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowResetAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              onClick={() => {
                onReset();
                setShowResetAlert(false);
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResizeAlert} onOpenChange={setShowResizeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resize Grid</AlertDialogTitle>
            <AlertDialogDescription>
              縮小により範囲外のマスが消えます。続行しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowResizeAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction variant="default" onClick={confirmResize}>
              Resize
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
