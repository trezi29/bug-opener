export type ToolType = "arrow" | "rect" | "circle" | "freehand" | "text" | "move";

export interface DrawOperation {
  id: string;
  tool: ToolType;
  color: string;
  strokeWidth: number;
  points: { x: number; y: number }[];
  text?: string;
}
