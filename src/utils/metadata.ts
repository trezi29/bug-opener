import type { PageMetadata } from "./storage";

export async function collectMetadata(
  tabId: number
): Promise<PageMetadata> {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: gatherPageMetadata,
  });

  if (!results || results.length === 0 || !results[0].result) {
    throw new Error("Failed to collect page metadata");
  }

  return results[0].result as PageMetadata;
}

function gatherPageMetadata() {
  let localStorageKeys: string[] = [];
  try {
    localStorageKeys = Object.keys(localStorage);
  } catch {
    // Access may be blocked
  }

  let cookieCount = 0;
  try {
    cookieCount = document.cookie
      ? document.cookie.split(";").length
      : 0;
  } catch {
    // Access may be blocked
  }

  const nav = navigator as Navigator & { connection?: { effectiveType?: string } };

  return {
    url: location.href,
    pageTitle: document.title,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    screenWidth: screen.width,
    screenHeight: screen.height,
    devicePixelRatio: window.devicePixelRatio,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    localStorageKeys,
    cookieCount,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    language: navigator.language,
    connectionType: nav.connection?.effectiveType ?? "unknown",
  };
}
