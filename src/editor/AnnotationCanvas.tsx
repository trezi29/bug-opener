import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
} from "react";
import type { ToolType, DrawOperation } from "@/utils/canvas-tools";
import { replayOperations, drawOperation } from "@/utils/canvas-tools";

interface AnnotationCanvasProps {
  screenshotUrl: string;
  activeTool: ToolType;
  color: string;
  strokeWidth: number;
  operations: DrawOperation[];
  onAddOperation: (op: DrawOperation) => void;
}

export const AnnotationCanvas = forwardRef<
  HTMLCanvasElement,
  AnnotationCanvasProps
>(function AnnotationCanvas(
  { screenshotUrl, activeTool, color, strokeWidth, operations, onAddOperation },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);

  useImperativeHandle(ref, () => canvasRef.current!, []);

  // Load base image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      baseImageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        replayOperations(ctx, img, operations);
      }
    };
    img.src = screenshotUrl;
  }, [screenshotUrl]);

  // Replay operations when they change
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = baseImageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      replayOperations(ctx, img, operations);
    }
  }, [operations]);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (activeTool === "text") {
        const point = getCanvasPoint(e);
        const text = prompt("Enter text:");
        if (text) {
          onAddOperation({
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
      currentPoints.current = [getCanvasPoint(e)];
    },
    [activeTool, color, strokeWidth, getCanvasPoint, onAddOperation]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const point = getCanvasPoint(e);
      currentPoints.current.push(point);

      // Live preview
      const canvas = canvasRef.current;
      const img = baseImageRef.current;
      if (!canvas || !img) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      replayOperations(ctx, img, operations);
      drawOperation(ctx, {
        tool: activeTool,
        color,
        strokeWidth,
        points: [...currentPoints.current],
      });
    },
    [isDrawing, activeTool, color, strokeWidth, operations, getCanvasPoint]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPoints.current.length >= 2) {
      onAddOperation({
        tool: activeTool,
        color,
        strokeWidth,
        points: [...currentPoints.current],
      });
    }
    currentPoints.current = [];
  }, [isDrawing, activeTool, color, strokeWidth, onAddOperation]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full border border-gray-300 rounded-lg shadow-sm cursor-crosshair"
      style={{ maxHeight: "calc(100vh - 80px)" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
});
