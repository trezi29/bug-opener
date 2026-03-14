import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
} from "react";
import { Stage, Layer, Image as KonvaImage, Line } from "react-konva";
import type Konva from "konva";
import type { ToolType, DrawOperation } from "@/utils/canvas-tools";
import { OperationShape } from "./shapes/OperationShape";
import { KonvaArrow } from "./shapes/KonvaArrow";
import { KonvaRect } from "./shapes/KonvaRect";
import { KonvaCircle } from "./shapes/KonvaCircle";

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
}

export const AnnotationCanvas = forwardRef<
  AnnotationCanvasHandle,
  AnnotationCanvasProps
>(function AnnotationCanvas(
  { screenshotUrl, activeTool, color, strokeWidth, operations, onAddOperation },
  ref
) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
      return stage.toDataURL({ pixelRatio: 1 / scale });
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
      className="w-full border border-gray-300 rounded-lg shadow-sm cursor-crosshair overflow-hidden"
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
            <KonvaImage image={baseImage} width={imgW} height={imgH} />
            {operations.map((op) => (
              <OperationShape key={op.id} op={op} />
            ))}
            {previewOp && <PreviewShape op={previewOp} />}
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
