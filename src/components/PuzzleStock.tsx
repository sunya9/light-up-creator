import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getDimensions } from "@/lib/lightup/serializer";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Check,
  Copy,
  Pencil,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PuzzlePreview } from "./PuzzlePreview";
import type { StockedPuzzle } from "../hooks/usePuzzleStock";
import { Link } from "wouter";

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function PuzzleItemLabel({ puzzle: p }: { puzzle: StockedPuzzle }) {
  const dims = useMemo(() => getDimensions(p.data), [p.data]);
  if (!dims) return null;
  const { rows, cols } = dims;
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span
        className={cn("truncate text-sm font-medium", {
          "line-through": p.posted,
        })}
      >
        {p.name}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {rows}×{cols} · {formatDate(p.createdAt)}
      </span>
    </div>
  );
}

interface Props {
  puzzles: StockedPuzzle[];
  currentPuzzleId?: string;
  onRemove: (id: string) => void;
  onTogglePosted: (id: string) => void;
  onNewPuzzle: () => void;
  onCopy: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function PuzzleStock({
  puzzles,
  currentPuzzleId,
  onRemove,
  onTogglePosted,
  onNewPuzzle,
  onCopy,
  onRename,
}: Props) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    currentName: string;
  } | null>(null);
  const [renameName, setRenameName] = useState("");

  const handleRenameOpen = useCallback((id: string, currentName: string) => {
    setRenameTarget({ id, currentName });
    setRenameName(currentName);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (renameTarget && renameName.trim()) {
      onRename(renameTarget.id, renameName.trim());
    }
    setRenameTarget(null);
  }, [renameTarget, renameName, onRename]);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Puzzles</SidebarGroupLabel>
          <SidebarGroupAction title="New Puzzle" onClick={onNewPuzzle}>
            <Plus />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {puzzles.map((p) => (
                <SidebarMenuItem key={p.id}>
                  <SidebarMenuButton
                    size="lg"
                    onDoubleClick={() => handleRenameOpen(p.id, p.name)}
                    data-active={p.id === currentPuzzleId}
                    className={cn({ "text-muted-foreground": p.posted })}
                    render={
                      <Link href={`/edit/${p.id}`}>
                        <PuzzlePreview data={p.data} />
                        <PuzzleItemLabel puzzle={p} />
                      </Link>
                    }
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <SidebarMenuAction>
                          <MoreHorizontal />
                        </SidebarMenuAction>
                      }
                    />
                    <DropdownMenuContent
                      side="right"
                      align="start"
                      className="w-auto"
                    >
                      <DropdownMenuItem
                        onClick={() => handleRenameOpen(p.id, p.name)}
                      >
                        <Pencil />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onCopy(p.id)}>
                        <Copy />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTogglePosted(p.id)}>
                        <Check />
                        {p.posted ? "Unmark posted" : "Mark as posted"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(p.id)}
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
              {puzzles.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  No saved puzzles yet.
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Puzzle</AlertDialogTitle>
            <AlertDialogDescription>
              このパズルをストックから削除しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) onRemove(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Puzzle</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRenameSubmit();
            }}
          >
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              autoFocus
            />
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
