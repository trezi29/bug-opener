export interface LinearAccount {
  id: string;
  apiKey: string;
  viewer: { id: string; name: string; email: string };
  defaultTeamId?: string;
  defaultProjectId?: string;
}

export interface StorageData {
  // Linear (multi-account)
  linear_accounts?: LinearAccount[];
  // Legacy single-key fields (kept for migration detection)
  linear_api_key?: string;
  linear_default_team_id?: string;
  linear_default_project_id?: string;
  linear_viewer?: { id: string; name: string; email: string };

  // ClickUp
  clickup_api_key?: string;
  clickup_default_workspace_id?: string;
  clickup_default_space_id?: string;
  clickup_default_list_id?: string;
  clickup_user?: { id: number; username: string; email: string };

  // Prefs
  default_integration?: "linear" | "clickup";
  include_localstorage_keys?: boolean;

  // Last bug
  last_bug?: {
    title: string;
    url: string;
    timestamp: number;
    integration: "linear" | "clickup";
  };
}

export async function getStorage<K extends keyof StorageData>(
  keys: K[]
): Promise<Pick<StorageData, K>> {
  return chrome.storage.local.get(keys) as Promise<Pick<StorageData, K>>;
}

export async function setStorage(data: Partial<StorageData>): Promise<void> {
  return chrome.storage.local.set(data);
}

export interface SessionData {
  screenshotDataUrl: string;
  metadata: PageMetadata;
  capturedAt: number;
}

export interface PageMetadata {
  url: string;
  pageTitle: string;
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  scrollX: number;
  scrollY: number;
  localStorageKeys: string[];
  cookieCount: number;
  timestamp: number;
  userAgent: string;
  language: string;
  connectionType: string;
}

export async function getSessionData(
  sessionId: string
): Promise<SessionData | undefined> {
  const result = await chrome.storage.session.get(sessionId);
  return result[sessionId] as SessionData | undefined;
}

export async function setSessionData(
  sessionId: string,
  data: SessionData
): Promise<void> {
  return chrome.storage.session.set({ [sessionId]: data });
}
