import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { PageMetadata } from "@/utils/storage";

interface MetadataPanelProps {
  metadata: PageMetadata;
}

const metadataLabels: Record<string, string> = {
  url: "URL",
  pageTitle: "Page Title",
  viewportWidth: "Viewport Width",
  viewportHeight: "Viewport Height",
  screenWidth: "Screen Width",
  screenHeight: "Screen Height",
  devicePixelRatio: "Device Pixel Ratio",
  scrollX: "Scroll X",
  scrollY: "Scroll Y",
  localStorageKeys: "LocalStorage Keys",
  cookieCount: "Cookie Count",
  timestamp: "Captured At",
  userAgent: "User Agent",
  language: "Language",
  connectionType: "Connection Type",
};

export function MetadataPanel({ metadata }: MetadataPanelProps) {
  const [open, setOpen] = useState(false);

  const entries = Object.entries(metadata).map(([key, value]) => ({
    label: metadataLabels[key] || key,
    value: formatValue(key, value),
  }));

  return (
    <div className="border-t border-gray-200">
      <Button
        variant="ghost"
        className="w-full justify-between px-4 py-3 h-auto"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium">Environment Metadata</span>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {open && (
        <div className="px-4 pb-4">
          <table className="w-full text-xs">
            <tbody>
              {entries.map(({ label, value }) => (
                <tr key={label} className="border-b border-gray-100 last:border-0">
                  <td className="py-1.5 pr-3 font-medium text-gray-500 whitespace-nowrap align-top">
                    {label}
                  </td>
                  <td className="py-1.5 text-gray-900 break-all">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatValue(key: string, value: unknown): string {
  if (key === "timestamp" && typeof value === "number") {
    return new Date(value).toLocaleString();
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "(none)";
  }
  return String(value ?? "N/A");
}
