import { useRef, useEffect } from "react";
import { drawPuzzlePreview } from "./puzzlePreviewRenderer";

interface PuzzlePreviewProps {
  data: string;
}

export function PuzzlePreview({ data }: PuzzlePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawPuzzlePreview(canvasRef.current, data);
    }
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      className="size-8 rounded-xs border border-foreground object-cover"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
