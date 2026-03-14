import { Arrow } from "react-konva";
import type { DrawOperation } from "@/utils/canvas-tools";

export function KonvaArrow({ op }: { op: DrawOperation }) {
  if (op.points.length < 2) return null;
  const start = op.points[0];
  const end = op.points[op.points.length - 1];
  const pointerSize = Math.max(op.strokeWidth * 4, 16);

  return (
    <Arrow
      points={[start.x, start.y, end.x, end.y]}
      stroke={op.color}
      strokeWidth={op.strokeWidth}
      pointerLength={pointerSize}
      pointerWidth={pointerSize}
      fill={op.color}
      lineCap="round"
      lineJoin="round"
    />
  );
}
