import { v4 as uuidv4 } from "uuid";
import { captureVisibleTab } from "../utils/screenshot";
import { collectMetadata } from "../utils/metadata";
import { setSessionData, getStorage, setStorage } from "../utils/storage";
import { createLinearIssue, uploadLinearImage } from "../api/linear";
import { createClickUpTask, attachClickUpFile } from "../api/clickup";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "CAPTURE_BUG") {
    handleCaptureBug(message.tabId)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === "SUBMIT_BUG") {
    handleSubmitBug(message.payload)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

async function handleCaptureBug(tabId: number) {
  const screenshotDataUrl = await captureVisibleTab();
  const metadata = await collectMetadata(tabId);
  const sessionId = uuidv4();

  await setSessionData(sessionId, {
    screenshotDataUrl,
    metadata,
    capturedAt: Date.now(),
  });

  const editorUrl = chrome.runtime.getURL(
    `src/editor/index.html?session=${sessionId}`
  );
  await chrome.tabs.create({ url: editorUrl });

  return { success: true, sessionId };
}

interface SubmitPayload {
  integration: "linear" | "clickup";
  title: string;
  description: string;
  annotatedImageDataUrl: string;
  metadata: Record<string, unknown>;
  // Linear-specific
  teamId?: string;
  projectId?: string;
  linearAccountId?: string;
  // ClickUp-specific
  listId?: string;
}

async function handleSubmitBug(payload: SubmitPayload) {
  const { integration, title, description, annotatedImageDataUrl, metadata } =
    payload;

  const metadataTable = buildMetadataMarkdown(metadata);

  if (integration === "linear") {
    const { linear_accounts, linear_api_key: legacyKey } = await getStorage(["linear_accounts", "linear_api_key"]);
    const account = linear_accounts?.find(a => a.id === payload.linearAccountId);
    const apiKey = account?.apiKey ?? legacyKey;
    if (!apiKey) throw new Error("Linear API key not configured");

    // Upload image first
    const blob = await dataUrlToBlob(annotatedImageDataUrl);
    const assetUrl = await uploadLinearImage(apiKey, blob);

    const fullDescription = `${description}\n\n## Screenshot\n![Bug Screenshot](${assetUrl})\n\n## Environment\n${metadataTable}`;

    const issue = await createLinearIssue(apiKey, {
      title,
      description: fullDescription,
      teamId: payload.teamId!,
      projectId: payload.projectId,
    });

    await setStorage({
      last_bug: {
        title,
        url: issue.url,
        timestamp: Date.now(),
        integration: "linear",
      },
    });

    return { success: true, url: issue.url, identifier: issue.identifier };
  }

  if (integration === "clickup") {
    const { clickup_api_key } = await getStorage(["clickup_api_key"]);
    if (!clickup_api_key) throw new Error("ClickUp API key not configured");

    const fullDescription = `${description}\n\n## Environment\n${metadataTable}`;

    const task = await createClickUpTask(clickup_api_key, {
      listId: payload.listId!,
      name: title,
      description: fullDescription,
    });

    // Attach screenshot (non-fatal — task is already created)
    let imageAttachFailed = false;
    try {
      const blob = await dataUrlToBlob(annotatedImageDataUrl);
      await attachClickUpFile(clickup_api_key, task.id, blob, "screenshot.png");
    } catch {
      imageAttachFailed = true;
    }

    await setStorage({
      last_bug: {
        title,
        url: task.url,
        timestamp: Date.now(),
        integration: "clickup",
      },
    });

    return { success: true, url: task.url, id: task.id, imageAttachFailed };
  }

  throw new Error(`Unknown integration: ${integration}`);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

const METADATA_KEY_ORDER: string[] = [
  "url",
  "pageTitle",
  "timestamp",
  "userAgent",
  "language",
  "connectionType",
  "viewportWidth",
  "viewportHeight",
  "screenWidth",
  "screenHeight",
  "devicePixelRatio",
  "scrollX",
  "scrollY",
  "cookieCount",
  "localStorageKeys",
];

function buildMetadataMarkdown(metadata: Record<string, unknown>): string {
  const orderedKeys = [
    ...METADATA_KEY_ORDER.filter((k) => k in metadata),
    ...Object.keys(metadata).filter((k) => !METADATA_KEY_ORDER.includes(k)),
  ];
  const rows = orderedKeys
    .map((key) => {
      const value = metadata[key];
      const display =
        Array.isArray(value) ? value.join(", ") : String(value ?? "N/A");
      return `| ${key} | ${display} |`;
    })
    .join("\n");
  return `| Property | Value |\n|---|---|\n${rows}`;
}
