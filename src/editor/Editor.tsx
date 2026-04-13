import React, { useCallback, useEffect, useState } from "react";
import { AnnotationCanvas, type AnnotationCanvasHandle } from "./AnnotationCanvas";
import { Toolbar } from "./Toolbar";
import { BugForm } from "./BugForm";
import { MetadataPanel } from "./MetadataPanel";
import { getSessionData, type PageMetadata } from "@/utils/storage";
import type { ToolType, DrawOperation } from "@/utils/canvas-tools";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function Editor() {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PageMetadata | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Canvas tool state
  const [activeTool, setActiveTool] = useState<ToolType>("move");
  const [color, setColor] = useState("#ff0000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [operations, setOperations] = useState<DrawOperation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Submission state
  const [submitResult, setSubmitResult] = useState<{
    url: string;
    identifier?: string;
    imageDataUrl: string;
    imageAttachFailed?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Canvas ref for export
  const canvasRef = React.useRef<AnnotationCanvasHandle>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session");
    if (!sid) {
      setError("No session ID found in URL");
      return;
    }
    setSessionId(sid);

    getSessionData(sid).then((data) => {
      if (!data) {
        setError("Session data not found — it may have expired");
        return;
      }
      setScreenshotUrl(data.screenshotDataUrl);
      setMetadata(data.metadata);
    });
  }, []);

  const handleUndo = () => {
    setOperations((prev) => prev.slice(0, -1));
  };

  const handleAddOperation = (op: DrawOperation) => {
    setOperations((prev) => [...prev, op]);
    setActiveTool('move');
    setSelectedId(op.id);
  };

  const handleUpdateOperation = (id: string, op: DrawOperation) => {
    setOperations((prev) => prev.map((o) => (o.id === id ? op : o)));
  };

  // Sync color and stroke width to selected shape
  useEffect(() => {
    if (selectedId) {
      const op = operations.find((o) => o.id === selectedId);
      if (op) {
        setColor(op.color);
        setStrokeWidth(op.strokeWidth);
      }
    }
  }, [selectedId]);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedId) {
      const op = operations.find((o) => o.id === selectedId);
      if (op) handleUpdateOperation(selectedId, { ...op, color: newColor });
    }
  };

  const handleStrokeWidthChange = (newWidth: number) => {
    setStrokeWidth(newWidth);
    if (selectedId) {
      const op = operations.find((o) => o.id === selectedId);
      if (op) handleUpdateOperation(selectedId, { ...op, strokeWidth: newWidth });
    }
  };

  const handleDeleteOperation = useCallback((id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
    setSelectedId(null);
  }, []);

  const handleExportCanvas = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const handle = canvasRef.current;
      if (!handle) return reject(new Error("Canvas not available"));
      resolve(handle.exportImage());
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!screenshotUrl || !metadata) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Loading screenshot...</p>
      </div>
    );
  }

  const handleCopyImage = async () => {
    if (!submitResult?.imageDataUrl) return;
    try {
      const res = await fetch(submitResult.imageDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available in all contexts
    }
  };

  if (submitResult) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-8">
        <Alert variant="success" className="max-w-md">
          <AlertTitle>Bug reported successfully!</AlertTitle>
          <AlertDescription className="space-y-3">
            <a
              href={submitResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {submitResult.identifier
                ? `${submitResult.identifier} — View issue`
                : "View issue"}
            </a>
            {submitResult.imageAttachFailed && (
              <p className="text-amber-600 text-sm">
                Screenshot could not be attached — use Copy Image to paste it manually.
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="block mt-2"
              onClick={handleCopyImage}
            >
              {copied ? "Copied!" : "Copy Image"}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left: Canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          color={color}
          onColorChange={handleColorChange}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={handleStrokeWidthChange}
          onUndo={handleUndo}
          canUndo={operations.length > 0}
          selectedId={selectedId}
          onDelete={() => selectedId && handleDeleteOperation(selectedId)}
        />
        <div className="flex-1 overflow-auto p-4">
          <AnnotationCanvas
            ref={canvasRef}
            screenshotUrl={screenshotUrl}
            activeTool={activeTool}
            color={color}
            strokeWidth={strokeWidth}
            operations={operations}
            onAddOperation={handleAddOperation}
            onUpdateOperation={handleUpdateOperation}
            selectedId={selectedId}
            onSetSelectedId={setSelectedId}
            onDeleteOperation={handleDeleteOperation}
          />
        </div>
      </div>

      {/* Right: Form + Metadata */}
      <div className="w-[400px] border-l border-gray-200 bg-white overflow-y-auto flex flex-col" onMouseDown={() => setSelectedId(null)}>
        <BugForm
          metadata={metadata}
          onExportCanvas={handleExportCanvas}
          onSuccess={setSubmitResult}
        />
        <MetadataPanel metadata={metadata} />
      </div>
    </div>
  );
}
