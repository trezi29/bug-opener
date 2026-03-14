import { Ellipse } from "react-konva";
import type { DrawOperation } from "@/utils/canvas-tools";

export function KonvaCircle({ op }: { op: DrawOperation }) {
  if (op.points.length < 2) return null;
  const start = op.points[0];
  const end = op.points[op.points.length - 1];

  return (
    <Ellipse
      x={(start.x + end.x) / 2}
      y={(start.y + end.y) / 2}
      radiusX={Math.abs(end.x - start.x) / 2}
      radiusY={Math.abs(end.y - start.y) / 2}
      stroke={op.color}
      strokeWidth={op.strokeWidth}
    />
  );
}
