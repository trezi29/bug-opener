import { Rect } from "react-konva";
import type { DrawOperation } from "@/utils/canvas-tools";

export function KonvaRect({ op, local }: { op: DrawOperation; local?: boolean }) {
  if (op.points.length < 2) return null;
  const start = op.points[0];
  const end = op.points[op.points.length - 1];

  if (local) {
    return (
      <Rect
        x={0}
        y={0}
        width={Math.abs(end.x - start.x)}
        height={Math.abs(end.y - start.y)}
        stroke={op.color}
        strokeWidth={op.strokeWidth}
        strokeScaleEnabled={false}
      />
    );
  }

  return (
    <Rect
      x={Math.min(start.x, end.x)}
      y={Math.min(start.y, end.y)}
      width={Math.abs(end.x - start.x)}
      height={Math.abs(end.y - start.y)}
      stroke={op.color}
      strokeWidth={op.strokeWidth}
      strokeScaleEnabled={false}
    />
  );
}
