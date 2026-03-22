import { Line } from "react-konva";
import type { DrawOperation } from "@/utils/canvas-tools";

export function KonvaFreehand({ op, local }: { op: DrawOperation; local?: boolean }) {
  if (op.points.length < 2) return null;

  let flatPoints: number[];
  if (local) {
    const minX = Math.min(...op.points.map((p) => p.x));
    const minY = Math.min(...op.points.map((p) => p.y));
    flatPoints = op.points.flatMap((p) => [p.x - minX, p.y - minY]);
  } else {
    flatPoints = op.points.flatMap((p) => [p.x, p.y]);
  }

  return (
    <Line
      points={flatPoints}
      stroke={op.color}
      strokeWidth={op.strokeWidth}
      strokeScaleEnabled={false}
      lineCap="round"
      lineJoin="round"
      hitStrokeWidth={20}
    />
  );
}
