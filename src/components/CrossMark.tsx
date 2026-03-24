import { Line, Group } from "react-konva";

interface Props {
  x: number;
  y: number;
  size: number;
}

/** バツマーク（消去法用、Konva Group） */
export function CrossMark({ x, y, size }: Props) {
  const half = size * 0.22;
  return (
    <Group x={x} y={y} listening={false}>
      <Line
        points={[-half, -half, half, half]}
        stroke="#94a3b8"
        strokeWidth={2.5}
        lineCap="round"
      />
      <Line
        points={[half, -half, -half, half]}
        stroke="#94a3b8"
        strokeWidth={2.5}
        lineCap="round"
      />
    </Group>
  );
}
