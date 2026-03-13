export async function captureVisibleTab(): Promise<string> {
  return chrome.tabs.captureVisibleTab({ format: "png" });
}
