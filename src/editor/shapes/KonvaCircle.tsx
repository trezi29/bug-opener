import { Ellipse } from "react-konva";
import type { DrawOperation } from "@/utils/canvas-tools";

export function KonvaCircle({ op, local }: { op: DrawOperation; local?: boolean }) {
  if (op.points.length < 2) return null;
  const start = op.points[0];
  const end = op.points[op.points.length - 1];
  const rx = Math.abs(end.x - start.x) / 2;
  const ry = Math.abs(end.y - start.y) / 2;

  if (local) {
    // Group is at (min(p0.x,p1.x), min(p0.y,p1.y)); center at (rx, ry) local
    return (
      <Ellipse
        x={rx}
        y={ry}
        radiusX={rx}
        radiusY={ry}
        stroke={op.color}
        strokeWidth={op.strokeWidth}
        strokeScaleEnabled={false}
      />
    );
  }

  return (
    <Ellipse
      x={(start.x + end.x) / 2}
      y={(start.y + end.y) / 2}
      radiusX={rx}
      radiusY={ry}
      stroke={op.color}
      strokeWidth={op.strokeWidth}
      strokeScaleEnabled={false}
    />
  );
}
