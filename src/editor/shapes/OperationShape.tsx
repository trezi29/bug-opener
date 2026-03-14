import type { DrawOperation } from "@/utils/canvas-tools";
import { KonvaArrow } from "./KonvaArrow";
import { KonvaRect } from "./KonvaRect";
import { KonvaCircle } from "./KonvaCircle";
import { KonvaFreehand } from "./KonvaFreehand";
import { KonvaText } from "./KonvaText";

export function OperationShape({ op, local }: { op: DrawOperation; local?: boolean }) {
  switch (op.tool) {
    case "arrow":
      return <KonvaArrow op={op} local={local} />;
    case "rect":
      return <KonvaRect op={op} local={local} />;
    case "circle":
      return <KonvaCircle op={op} local={local} />;
    case "freehand":
      return <KonvaFreehand op={op} local={local} />;
    case "text":
      return <KonvaText op={op} local={local} />;
  }
}
