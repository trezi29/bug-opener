import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStorage, type StorageData } from "@/utils/storage";

export function Popup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBug, setLastBug] = useState<StorageData["last_bug"]>(undefined);
  const [hasLinear, setHasLinear] = useState(false);
  const [hasClickUp, setHasClickUp] = useState(false);

  useEffect(() => {
    getStorage([
      "last_bug",
      "linear_api_key",
      "clickup_api_key",
    ]).then((data) => {
      setLastBug(data.last_bug);
      setHasLinear(!!data.linear_api_key);
      setHasClickUp(!!data.clickup_api_key);
    });
  }, []);

  const handleReportBug = async () => {
    setLoading(true);
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        throw new Error("No active tab found");
      }

      const response = await chrome.runtime.sendMessage({
        type: "CAPTURE_BUG",
        tabId: tab.id,
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      // Close popup after successful capture
      window.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture bug");
      setLoading(false);
    }
  };

  const openOptions = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/options/index.html") });
  };

  const configured = hasLinear || hasClickUp;

  return (
    <div className="w-[320px] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Bug Opener</h1>
        <div className="flex gap-1">
          {hasLinear && <Badge variant="secondary">Linear</Badge>}
          {hasClickUp && <Badge variant="secondary">ClickUp</Badge>}
          {!configured && <Badge variant="destructive">Not configured</Badge>}
        </div>
      </div>

      <Separator />

      {!configured && (
        <p className="text-sm text-gray-500">
          Set up your API keys in{" "}
          <button onClick={openOptions} className="underline text-gray-900">
            Settings
          </button>{" "}
          to get started.
        </p>
      )}

      <Button
        className="w-full"
        onClick={handleReportBug}
        disabled={loading || !configured}
      >
        {loading ? "Capturing..." : "Report Bug"}
      </Button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {lastBug && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Last reported bug:</p>
            <a
              href={lastBug.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline block truncate"
            >
              {lastBug.title}
            </a>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{lastBug.integration}</Badge>
              <span className="text-xs text-gray-400">
                {new Date(lastBug.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </>
      )}

      <Separator />

      <Button variant="ghost" size="sm" className="w-full" onClick={openOptions}>
        Settings
      </Button>
    </div>
  );
}
