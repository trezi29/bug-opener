import { Line } from "react-konva";
import type { DrawOperation } from "@/utils/canvas-tools";

export function KonvaFreehand({ op }: { op: DrawOperation }) {
  if (op.points.length < 2) return null;
  const flatPoints = op.points.flatMap((p) => [p.x, p.y]);

  return (
    <Line
      points={flatPoints}
      stroke={op.color}
      strokeWidth={op.strokeWidth}
      lineCap="round"
      lineJoin="round"
    />
  );
}
