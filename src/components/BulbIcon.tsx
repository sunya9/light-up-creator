import { Circle, Line, Group } from "react-konva";

type Props = {
  x: number;
  y: number;
  size: number;
  opacity?: number;
};

/** 電球アイコン（Konva Group） */
export function BulbIcon({ x, y, size, opacity = 1 }: Props) {
  const r = size * 0.25;
  const rayLen = size * 0.12;
  const rayOffset = r + rayLen * 0.4;
  const rays = 8;

  return (
    <Group x={x} y={y} listening={false} opacity={opacity}>
      <Circle radius={r} fill="#fbbf24" stroke="#f59e0b" strokeWidth={1.5} />
      {Array.from({ length: rays }, (_, i) => {
        const angle = (i * Math.PI * 2) / rays;
        const x1 = Math.cos(angle) * rayOffset;
        const y1 = Math.sin(angle) * rayOffset;
        const x2 = Math.cos(angle) * (rayOffset + rayLen);
        const y2 = Math.sin(angle) * (rayOffset + rayLen);
        return (
          <Line
            key={i}
            points={[x1, y1, x2, y2]}
            stroke="#f59e0b"
            strokeWidth={1.5}
            lineCap="round"
          />
        );
      })}
    </Group>
  );
}
