import { deserialize } from "../lib/lightup/serializer";

const CELL_PX = 2;

export function drawPuzzlePreview(
  canvas: HTMLCanvasElement,
  data: string,
  cellPx: number = CELL_PX,
) {
  const grid = deserialize(data);
  if (!grid) return;
  const { rows, cols } = grid;

  canvas.width = cols * cellPx;
  canvas.height = rows * cellPx;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid.cells[r][c].kind === "black") {
        ctx.fillRect(c * cellPx, r * cellPx, cellPx, cellPx);
      }
    }
  }
}
