export type ToolType = "arrow" | "rect" | "circle" | "freehand" | "text";

export interface DrawOperation {
  tool: ToolType;
  color: string;
  strokeWidth: number;
  points: { x: number; y: number }[];
  text?: string;
}

export function drawOperation(
  ctx: CanvasRenderingContext2D,
  op: DrawOperation
) {
  ctx.strokeStyle = op.color;
  ctx.fillStyle = op.color;
  ctx.lineWidth = op.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (op.tool) {
    case "freehand":
      drawFreehand(ctx, op.points);
      break;
    case "rect":
      drawRect(ctx, op.points);
      break;
    case "circle":
      drawCircle(ctx, op.points);
      break;
    case "arrow":
      drawArrow(ctx, op.points);
      break;
    case "text":
      drawText(ctx, op);
      break;
  }
}

function drawFreehand(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[]
) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[]
) {
  if (points.length < 2) return;
  const [start, end] = [points[0], points[points.length - 1]];
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const w = Math.abs(end.x - start.x);
  const h = Math.abs(end.y - start.y);
  ctx.strokeRect(x, y, w, h);
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[]
) {
  if (points.length < 2) return;
  const [start, end] = [points[0], points[points.length - 1]];
  const cx = (start.x + end.x) / 2;
  const cy = (start.y + end.y) / 2;
  const rx = Math.abs(end.x - start.x) / 2;
  const ry = Math.abs(end.y - start.y) / 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[]
) {
  if (points.length < 2) return;
  const start = points[0];
  const end = points[points.length - 1];
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = Math.max(ctx.lineWidth * 4, 16);

  // Shaft
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, op: DrawOperation) {
  if (!op.text || op.points.length === 0) return;
  const { x, y } = op.points[0];
  ctx.font = `${Math.max(op.strokeWidth * 4, 16)}px sans-serif`;
  ctx.fillText(op.text, x, y);
}

export function replayOperations(
  ctx: CanvasRenderingContext2D,
  baseImage: HTMLImageElement,
  operations: DrawOperation[]
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(baseImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const op of operations) {
    drawOperation(ctx, op);
  }
}
