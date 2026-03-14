import type { DrawOperation } from "@/utils/canvas-tools";
import { KonvaArrow } from "./KonvaArrow";
import { KonvaRect } from "./KonvaRect";
import { KonvaCircle } from "./KonvaCircle";
import { KonvaFreehand } from "./KonvaFreehand";
import { KonvaText } from "./KonvaText";

export function OperationShape({ op }: { op: DrawOperation }) {
  switch (op.tool) {
    case "arrow":
      return <KonvaArrow op={op} />;
    case "rect":
      return <KonvaRect op={op} />;
    case "circle":
      return <KonvaCircle op={op} />;
    case "freehand":
      return <KonvaFreehand op={op} />;
    case "text":
      return <KonvaText op={op} />;
  }
}
