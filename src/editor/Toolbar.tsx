import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import {
  ArrowUpRight,
  Square,
  Circle,
  Pencil,
  Type,
  Undo2,
  MousePointer,
  Trash2,
  Settings,
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
  { type: 'move', icon: MousePointer, label: 'Move' },
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
  onDelete,
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white">
        {/* Tool buttons */}
        <div className="flex items-center gap-1">
          {tools.map(({ type, icon: Icon, label }) => (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === type ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => onToolChange(type)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Color picker */}
        <div className="flex items-center gap-1">
          {colors.map((c) => (
            <button
              key={c}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-transform',
                color === c
                  ? 'border-gray-900 scale-110'
                  : 'border-gray-300 hover:scale-105',
              )}
              style={{ backgroundColor: c }}
              onClick={() => onColorChange(c)}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Stroke width */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Width</span>
          <Slider
            value={[strokeWidth]}
            onValueChange={(value) => onStrokeWidthChange(value[0])}
            min={1}
            max={10}
            step={1}
            className="w-20"
          />
          {/* <input
            type="range"
            min={1}
            max={10}
            value={strokeWidth}
            onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-20"
          />*/}
          <span className="text-xs text-gray-600 w-4">{strokeWidth}</span>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Undo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-gray-200" />

        {/* Delete selected */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={!selectedId}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete selected</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-gray-200 ml-auto" />

        {/* Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onSettingsClick}>
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
