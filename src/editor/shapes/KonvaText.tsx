import { Text } from "react-konva";
import type { DrawOperation } from "@/utils/canvas-tools";

export function KonvaText({ op, local }: { op: DrawOperation; local?: boolean }) {
  if (!op.text || op.points.length === 0) return null;

  return (
    <Text
      x={local ? 0 : op.points[0].x}
      y={local ? 0 : op.points[0].y}
      text={op.text}
      fontSize={Math.max(op.strokeWidth * 4, 16)}
      fontFamily="sans-serif"
      fill={op.color}
    />
  );
}
