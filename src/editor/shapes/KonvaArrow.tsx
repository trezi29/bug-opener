import { Arrow } from "react-konva";
import type { DrawOperation } from "@/utils/canvas-tools";

export function KonvaArrow({ op, local }: { op: DrawOperation; local?: boolean }) {
  if (op.points.length < 2) return null;
  const start = op.points[0];
  const end = op.points[op.points.length - 1];
  const pointerSize = Math.max(op.strokeWidth * 4, 16);

  const pts = local
    ? [0, 0, end.x - start.x, end.y - start.y]
    : [start.x, start.y, end.x, end.y];

  return (
    <Arrow
      points={pts}
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
