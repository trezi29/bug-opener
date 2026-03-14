import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
} from "react";
import { Stage, Layer, Image as KonvaImage, Line, Group, Transformer } from "react-konva";
import type Konva from "konva";
import type { ToolType, DrawOperation } from "@/utils/canvas-tools";
import { OperationShape } from "./shapes/OperationShape";
import { KonvaArrow } from "./shapes/KonvaArrow";
import { KonvaRect } from "./shapes/KonvaRect";
import { KonvaCircle } from "./shapes/KonvaCircle";

function getGroupOrigin(op: DrawOperation): { x: number; y: number } {
  switch (op.tool) {
    case "rect":
    case "circle": {
      const p0 = op.points[0], p1 = op.points[op.points.length - 1];
      return { x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y) };
    }
    case "freehand": {
      const xs = op.points.map((p) => p.x), ys = op.points.map((p) => p.y);
      return { x: Math.min(...xs), y: Math.min(...ys) };
    }
    default: // arrow, text
      return { x: op.points[0].x, y: op.points[0].y };
  }
}

function applyLocalTransform(
  op: DrawOperation,
  newGx: number,
  newGy: number,
  sx: number,
  sy: number
): DrawOperation {
  switch (op.tool) {
    case "rect":
    case "circle": {
      const p0 = op.points[0], p1 = op.points[op.points.length - 1];
      const w = Math.abs(p1.x - p0.x), h = Math.abs(p1.y - p0.y);
      return { ...op, points: [{ x: newGx, y: newGy }, { x: newGx + w * sx, y: newGy + h * sy }] };
    }
    case "arrow": {
      const p0 = op.points[0], p1 = op.points[op.points.length - 1];
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      return { ...op, points: [{ x: newGx, y: newGy }, { x: newGx + dx * sx, y: newGy + dy * sy }] };
    }
    case "freehand": {
      const origGx = Math.min(...op.points.map((p) => p.x));
      const origGy = Math.min(...op.points.map((p) => p.y));
      return {
        ...op,
        points: op.points.map((p) => ({
          x: newGx + (p.x - origGx) * sx,
          y: newGy + (p.y - origGy) * sy,
        })),
      };
    }
    case "text":
      return { ...op, points: [{ x: newGx, y: newGy }], strokeWidth: op.strokeWidth * Math.max(sx, sy) };
    default:
      return op;
  }
}

export interface AnnotationCanvasHandle {
  exportImage: () => string;
}

interface AnnotationCanvasProps {
  screenshotUrl: string;
  activeTool: ToolType;
  color: string;
  strokeWidth: number;
  operations: DrawOperation[];
  onAddOperation: (op: DrawOperation) => void;
  onUpdateOperation: (id: string, op: DrawOperation) => void;
  selectedId: string | null;
  onSetSelectedId: (id: string | null) => void;
  onDeleteOperation: (id: string) => void;
}

export const AnnotationCanvas = forwardRef<
  AnnotationCanvasHandle,
  AnnotationCanvasProps
>(function AnnotationCanvas(
  { screenshotUrl, activeTool, color, strokeWidth, operations, onAddOperation, onUpdateOperation, selectedId, onSetSelectedId, onDeleteOperation },
  ref
) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Map<string, Konva.Group>>(new Map());
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<
    { x: number; y: number }[]
  >([]);

  // Load base image
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setBaseImage(img);
    img.src = screenshotUrl;
  }, [screenshotUrl]);

  // Observe container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Deselect when switching away from move tool
  useEffect(() => {
    if (activeTool !== "move") onSetSelectedId(null);
  }, [activeTool]);

  // Keyboard delete shortcut
  useEffect(() => {
    if (!selectedId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        onDeleteOperation(selectedId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, onDeleteOperation]);

  // Attach Transformer to the selected shape
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (selectedId) {
      const node = shapeRefs.current.get(selectedId);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
  }, [selectedId, operations]);

  // Compute scale
  const imgW = baseImage?.naturalWidth ?? 1;
  const imgH = baseImage?.naturalHeight ?? 1;
  const scale = Math.min(
    containerSize.width / imgW,
    containerSize.height / imgH,
    1
  );

  // Export at full resolution
  useImperativeHandle(ref, () => ({
    exportImage() {
      const stage = stageRef.current;
      if (!stage) throw new Error("Stage not available");
      const tr = transformerRef.current;
      if (tr) tr.visible(false);
      const url = stage.toDataURL({ pixelRatio: 1 / scale });
      if (tr) tr.visible(true);
      return url;
    },
  }));

  const getImagePoint = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };
      const pos = stage.getPointerPosition();
      if (!pos) return { x: 0, y: 0 };
      return { x: pos.x / scale, y: pos.y / scale };
    },
    [scale]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === "move") {
        if (e.target === stageRef.current) {
          onSetSelectedId(null); // clicking background deselects
        }
        return;
      }
      if (activeTool === "text") {
        const point = getImagePoint(e);
        const text = prompt("Enter text:");
        if (text) {
          onAddOperation({
            id: crypto.randomUUID(),
            tool: "text",
            color,
            strokeWidth,
            points: [point],
            text,
          });
        }
        return;
      }
      setIsDrawing(true);
      setCurrentPoints([getImagePoint(e)]);
    },
    [activeTool, color, strokeWidth, getImagePoint, onAddOperation]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawing) return;
      const point = getImagePoint(e);
      setCurrentPoints((prev) => [...prev, point]);
    },
    [isDrawing, getImagePoint]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPoints.length >= 2) {
      onAddOperation({
        id: crypto.randomUUID(),
        tool: activeTool,
        color,
        strokeWidth,
        points: currentPoints,
      });
    }
    setCurrentPoints([]);
  }, [isDrawing, activeTool, color, strokeWidth, currentPoints, onAddOperation]);

  // Render preview shape for current drawing
  const previewOp: DrawOperation | null =
    isDrawing && currentPoints.length >= 2
      ? {
          id: "__preview__",
          tool: activeTool,
          color,
          strokeWidth,
          points: currentPoints,
        }
      : null;

  return (
    <div
      ref={containerRef}
      className={`w-full border border-gray-300 rounded-lg shadow-sm overflow-hidden ${activeTool === "move" ? "cursor-default" : "cursor-crosshair"}`}
      style={{ maxHeight: "calc(100vh - 80px)", aspectRatio: `${imgW}/${imgH}` }}
    >
      {baseImage && containerSize.width > 0 && (
        <Stage
          ref={stageRef}
          width={imgW * scale}
          height={imgH * scale}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <Layer>
            <KonvaImage
              image={baseImage}
              width={imgW}
              height={imgH}
              onMouseDown={() => {
                if (activeTool === "move") onSetSelectedId(null);
              }}
            />
            {operations.map((op) => {
              const origin = getGroupOrigin(op);
              return (
                <Group
                  key={op.id}
                  x={origin.x}
                  y={origin.y}
                  ref={(node) => {
                    if (node) shapeRefs.current.set(op.id, node);
                    else shapeRefs.current.delete(op.id);
                  }}
                  draggable={activeTool === "move"}
                  onMouseDown={(e) => {
                    if (activeTool === "move") {
                      onSetSelectedId(op.id);
                      e.cancelBubble = true;
                    }
                  }}
                  onDragStart={() => onSetSelectedId(op.id)}
                  onDragEnd={(e) => {
                    const node = e.target as Konva.Group;
                    const newGx = node.x(), newGy = node.y();
                    const { x: oldGx, y: oldGy } = getGroupOrigin(op);
                    const dx = newGx - oldGx, dy = newGy - oldGy;
                    onUpdateOperation(op.id, {
                      ...op,
                      points: op.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
                    });
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target as Konva.Group;
                    const newGx = node.x(), newGy = node.y();
                    const sx = node.scaleX(), sy = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onUpdateOperation(op.id, applyLocalTransform(op, newGx, newGy, sx, sy));
                  }}
                  onMouseEnter={(e) => {
                    if (activeTool === "move") {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = "move";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                      container.style.cursor =
                        activeTool === "move" ? "default" : "crosshair";
                    }
                  }}
                >
                  <OperationShape op={op} local />
                </Group>
              );
            })}
            {previewOp && <PreviewShape op={previewOp} />}
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              anchorSize={8 / scale}
              borderStrokeWidth={1.5 / scale}
              boundBoxFunc={(oldBox, newBox) =>
                Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5
                  ? oldBox
                  : newBox
              }
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
});

function PreviewShape({ op }: { op: DrawOperation }) {
  switch (op.tool) {
    case "freehand": {
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
    case "arrow":
      return <KonvaArrow op={op} />;
    case "rect":
      return <KonvaRect op={op} />;
    case "circle":
      return <KonvaCircle op={op} />;
    default:
      return null;
  }
}
