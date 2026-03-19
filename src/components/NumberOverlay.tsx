import { Text } from "react-konva";

type Props = {
  x: number;
  y: number;
  size: number;
  number: number;
};

/** 黒マス上の数字表示 */
export function NumberOverlay({ x, y, size, number }: Props) {
  return (
    <Text
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      text={String(number)}
      fontSize={size * 0.55}
      fontFamily="monospace"
      fontStyle="bold"
      fill="#ffffff"
      align="center"
      verticalAlign="middle"
    />
  );
}
