import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStorage, type PageMetadata, type LinearAccount } from "@/utils/storage";
import { fetchLinearTeams, fetchLinearProjects } from "@/api/linear";
import {
  fetchClickUpWorkspaces,
  fetchClickUpSpaces,
  fetchClickUpLists,
} from "@/api/clickup";

interface BugFormProps {
  metadata: PageMetadata;
  onExportCanvas: () => Promise<string>;
  onSuccess: (result: { url: string; identifier?: string; imageDataUrl: string; imageAttachFailed?: boolean }) => void;
}

type Integration = "linear" | "clickup";

export function BugForm({ metadata, onExportCanvas, onSuccess }: BugFormProps) {
  const [title, setTitle] = useState(`BUG | `);
  const [description, setDescription] = useState("");
  const [integration, setIntegration] = useState<Integration>("linear");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Linear state
  const [linearAccounts, setLinearAccounts] = useState<LinearAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [linearTeams, setLinearTeams] = useState<{ id: string; name: string }[]>([]);
  const [linearTeamId, setLinearTeamId] = useState("");
  const [linearProjects, setLinearProjects] = useState<{ id: string; name: string }[]>([]);
  const [linearProjectId, setLinearProjectId] = useState("none");

  // ClickUp state
  const [clickupKey, setClickupKey] = useState<string>("");
  const [clickupWorkspaces, setClickupWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [clickupWorkspaceId, setClickupWorkspaceId] = useState("");
  const [clickupSpaces, setClickupSpaces] = useState<{ id: string; name: string }[]>([]);
  const [clickupSpaceId, setClickupSpaceId] = useState("");
  const [clickupLists, setClickupLists] = useState<{ id: string; name: string }[]>([]);
  const [clickupListId, setClickupListId] = useState("");

  // Load saved keys + defaults
  useEffect(() => {
    getStorage([
      "linear_accounts",
      "linear_api_key",
      "linear_default_team_id",
      "linear_default_project_id",
      "clickup_api_key",
      "clickup_default_workspace_id",
      "clickup_default_space_id",
      "clickup_default_list_id",
      "default_integration",
    ]).then((data) => {
      if (data.default_integration) setIntegration(data.default_integration);

      const accounts = data.linear_accounts ?? [];
      if (accounts.length > 0) {
        setLinearAccounts(accounts);
        const first = accounts[0];
        setSelectedAccountId(first.id);
        if (first.defaultTeamId) setLinearTeamId(first.defaultTeamId);
        if (first.defaultProjectId) setLinearProjectId(first.defaultProjectId);
      } else if (data.linear_api_key) {
        // Legacy fallback: wrap old key in a synthetic account
        const legacy: LinearAccount = {
          id: "__legacy__",
          apiKey: data.linear_api_key,
          viewer: { id: "", name: "Account", email: "" },
          defaultTeamId: data.linear_default_team_id,
          defaultProjectId: data.linear_default_project_id,
        };
        setLinearAccounts([legacy]);
        setSelectedAccountId("__legacy__");
        if (data.linear_default_team_id) setLinearTeamId(data.linear_default_team_id);
        if (data.linear_default_project_id) setLinearProjectId(data.linear_default_project_id);
      }

      if (data.clickup_api_key) {
        setClickupKey(data.clickup_api_key);
        if (data.clickup_default_workspace_id) setClickupWorkspaceId(data.clickup_default_workspace_id);
        if (data.clickup_default_space_id) setClickupSpaceId(data.clickup_default_space_id);
        if (data.clickup_default_list_id) setClickupListId(data.clickup_default_list_id);
      }
    });
  }, []);

  const selectedAccount = linearAccounts.find((a) => a.id === selectedAccountId);
  const linearKey = selectedAccount?.apiKey ?? "";

  // Fetch Linear teams when selected account changes
  useEffect(() => {
    if (!linearKey) return;
    setLinearTeams([]);
    fetchLinearTeams(linearKey)
      .then(setLinearTeams)
      .catch(() => setLinearTeams([]));
  }, [linearKey]);

  // Fetch Linear projects when team changes
  useEffect(() => {
    if (!linearKey || !linearTeamId) return;
    fetchLinearProjects(linearKey, linearTeamId)
      .then(setLinearProjects)
      .catch(() => setLinearProjects([]));
  }, [linearKey, linearTeamId]);

  // Fetch ClickUp workspaces
  useEffect(() => {
    if (!clickupKey) return;
    fetchClickUpWorkspaces(clickupKey)
      .then(setClickupWorkspaces)
      .catch(() => setClickupWorkspaces([]));
  }, [clickupKey]);

  // Fetch ClickUp spaces
  useEffect(() => {
    if (!clickupKey || !clickupWorkspaceId) return;
    fetchClickUpSpaces(clickupKey, clickupWorkspaceId)
      .then(setClickupSpaces)
      .catch(() => setClickupSpaces([]));
  }, [clickupKey, clickupWorkspaceId]);

  // Fetch ClickUp lists
  useEffect(() => {
    if (!clickupKey || !clickupSpaceId) return;
    fetchClickUpLists(clickupKey, clickupSpaceId)
      .then(setClickupLists)
      .catch(() => setClickupLists([]));
  }, [clickupKey, clickupSpaceId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const annotatedImageDataUrl = await onExportCanvas();

      const payload: Record<string, unknown> = {
        integration,
        title,
        description,
        annotatedImageDataUrl,
        metadata,
      };

      if (integration === "linear") {
        if (!linearTeamId) throw new Error("Select a Linear team");
        payload.teamId = linearTeamId;
        if (linearProjectId && linearProjectId !== "none") payload.projectId = linearProjectId;
        if (selectedAccountId) payload.linearAccountId = selectedAccountId;
      } else {
        if (!clickupListId) throw new Error("Select a ClickUp list");
        payload.listId = clickupListId;
      }

      const response = await chrome.runtime.sendMessage({
        type: "SUBMIT_BUG",
        payload,
      });

      if (response?.error) throw new Error(response.error);

      onSuccess({ url: response.url, identifier: response.identifier, imageDataUrl: annotatedImageDataUrl, imageAttachFailed: response.imageAttachFailed });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const hasKey = integration === "linear" ? !!linearKey : !!clickupKey;
  const showAccountSelector = integration === "linear" && linearAccounts.length > 1;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Report Bug</h2>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bug title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the bug..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Integration</Label>
        <Select
          value={integration}
          onValueChange={(v) => setIntegration(v as Integration)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="clickup">ClickUp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!hasKey && (
        <Alert variant="destructive">
          <AlertDescription>
            No API key configured for {integration}. Go to{" "}
            <button
              className="underline"
              onClick={() => chrome.runtime.openOptionsPage()}
            >
              Settings
            </button>{" "}
            to add one.
          </AlertDescription>
        </Alert>
      )}

      {/* Linear account selector (only shown when multiple accounts) */}
      {showAccountSelector && (
        <div className="space-y-2">
          <Label>Account</Label>
          <Select
            value={selectedAccountId}
            onValueChange={(id) => {
              setSelectedAccountId(id);
              const acct = linearAccounts.find((a) => a.id === id);
              setLinearTeamId(acct?.defaultTeamId ?? "");
              setLinearProjectId(acct?.defaultProjectId ?? "");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {linearAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.viewer.name || a.viewer.email || "Account"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Linear selectors */}
      {integration === "linear" && linearKey && (
        <>
          <div className="space-y-2">
            <Label>Team</Label>
            <Select value={linearTeamId} onValueChange={setLinearTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {linearTeams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {linearTeamId && linearProjects.length > 0 && (
            <div className="space-y-2">
              <Label>Project (optional)</Label>
              <Select value={linearProjectId} onValueChange={setLinearProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {linearProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      {/* ClickUp selectors */}
      {integration === "clickup" && clickupKey && (
        <>
          <div className="space-y-2">
            <Label>Workspace</Label>
            <Select
              value={clickupWorkspaceId}
              onValueChange={setClickupWorkspaceId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                {clickupWorkspaces.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {clickupWorkspaceId && (
            <div className="space-y-2">
              <Label>Space</Label>
              <Select value={clickupSpaceId} onValueChange={setClickupSpaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select space" />
                </SelectTrigger>
                <SelectContent>
                  {clickupSpaces.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {clickupSpaceId && (
            <div className="space-y-2">
              <Label>List</Label>
              <Select value={clickupListId} onValueChange={setClickupListId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select list" />
                </SelectTrigger>
                <SelectContent>
                  {clickupLists.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting || !hasKey || !title}
      >
        {submitting ? "Submitting..." : "Submit Bug Report"}
      </Button>
    </div>
  );
}
