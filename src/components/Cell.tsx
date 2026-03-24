import { useRef, useEffect } from "react";
import { Rect } from "react-konva";
import type Konva from "konva";
import { match } from "ts-pattern";

interface Props {
  x: number;
  y: number;
  size: number;
  kind: "white" | "black";
  isLit: boolean;
  hasConflict: boolean;
  hasNumberError: boolean;
  isRejected: boolean;
  isDiff: boolean;
  onClick: () => void;
}

/** 単一セル描画 */
export function Cell({
  x,
  y,
  size,
  kind,
  isLit,
  hasConflict,
  hasNumberError,
  isRejected,
  isDiff,
  onClick,
}: Props) {
  const rectRef = useRef<Konva.Rect>(null);

  useEffect(() => {
    if (!isRejected || !rectRef.current) return;
    const node = rectRef.current;
    node.to({
      fill: "#fca5a5",
      duration: 0.05,
      onFinish: () => node.to({ fill: "#fef9c3", duration: 0.25 }),
    });
  }, [isRejected]);

  const fill = match({ kind, hasNumberError, hasConflict, isDiff, isLit })
    .with({ kind: "black", hasNumberError: true }, () => "#D92B04")
    .with({ kind: "black" }, () => "#333335")
    .with({ hasConflict: true }, () => "#D92B04")
    .with({ isDiff: true }, () => "#BF9765")
    .with({ isLit: true }, () => "#AfDcDc")
    .otherwise(() => "#eee");

  return (
    <Rect
      ref={rectRef}
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
