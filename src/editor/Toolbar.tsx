import React, { useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowUpRight,
  Square,
  Circle,
  Pencil,
  Type,
  Undo2,
  MousePointer,
  Settings,
  Minus,
} from 'lucide-react';
import type { ToolType } from '@/utils/canvas-tools';
import { cn } from '@/utils/cn';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  canUndo: boolean;
  selectedId: string | null;
  onDelete: () => void;
  onSettingsClick: () => void;
}

const tools: { type: ToolType; icon: React.ElementType; label: string }[] = [
  { type: 'move', icon: MousePointer, label: 'Select' },
  { type: 'rect', icon: Square, label: 'Rectangle' },
  { type: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'freehand', icon: Pencil, label: 'Freehand' },
  { type: 'text', icon: Type, label: 'Text' },
];

const colors = [
  '#ff0000',
  '#ff6600',
  '#ffcc00',
  '#00cc00',
  '#0066ff',
  '#9933ff',
  '#000000',
  '#ffffff',
];

export function Toolbar({
  activeTool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onUndo,
  canUndo,
  selectedId,
  onDelete: _onDelete,
  onSettingsClick,
}: ToolbarProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && canUndo) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        onUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canUndo, onUndo]);

  const showColorRow = activeTool !== 'move' || selectedId !== null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {/* Main tool pill */}
        <div className="flex items-center gap-0.5 bg-[#1C1C1E] rounded-full px-2 py-1.5 shadow-2xl pointer-events-auto">
          {tools.map(({ type, icon: Icon, label }) => (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-full transition-colors',
                    activeTool === type
                      ? 'bg-white text-[#1C1C1E]'
                      : 'text-white/80 hover:bg-white/10',
                  )}
                  onClick={() => onToolChange(type)}
                >
                  <Icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          ))}

          <div className="w-px h-5 bg-white/20 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-full transition-colors',
                  canUndo
                    ? 'text-white/80 hover:bg-white/10'
                    : 'text-white/25 cursor-not-allowed',
                )}
                onClick={canUndo ? onUndo : undefined}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Undo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 transition-colors"
                onClick={onSettingsClick}
              >
                <Settings className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Settings</TooltipContent>
          </Tooltip>
        </div>

        {/* Color + stroke pill — shown when a drawing tool is active or a shape is selected */}
        {showColorRow && (
          <div className="flex items-center gap-1.5 bg-[#1C1C1E] rounded-full px-3 py-2 shadow-2xl pointer-events-auto">
            {colors.map((c) => (
              <button
                key={c}
                className={cn(
                  'w-5 h-5 rounded-full transition-all flex-shrink-0',
                  color === c
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-[#1C1C1E] scale-110'
                    : 'hover:scale-110',
                  c === '#ffffff' && 'border border-white/30',
                )}
                style={{ backgroundColor: c }}
                onClick={() => onColorChange(c)}
              />
            ))}

            <div className="w-px h-5 bg-white/20 mx-0.5" />

            <Minus className="h-3 w-3 text-white/50 flex-shrink-0" />
            <input
              type="range"
              min={1}
              max={10}
              value={strokeWidth}
              onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-20 accent-white"
            />
            <span className="text-xs text-white/80 w-3 text-center tabular-nums">{strokeWidth}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
