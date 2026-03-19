import { Rect } from "react-konva";

type Props = {
  x: number;
  y: number;
  size: number;
  kind: "white" | "black";
  isLit: boolean;
  hasConflict: boolean;
  onClick: () => void;
};

/** 単一セル描画 */
export function Cell({ x, y, size, kind, isLit, hasConflict, onClick }: Props) {
  let fill: string;
  if (kind === "black") {
    fill = "#1e293b";
  } else if (hasConflict) {
    fill = "#fca5a5";
  } else if (isLit) {
    fill = "#fef9c3";
  } else {
    fill = "#f8fafc";
  }

  return (
    <Rect
      x={x}
      y={y}
      width={size}
      height={size}
      fill={fill}
      stroke="#94a3b8"
      strokeWidth={1}
      onClick={onClick}
      onTap={onClick}
    />
  );
}
