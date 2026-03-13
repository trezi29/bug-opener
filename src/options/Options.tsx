import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { getStorage, setStorage } from "@/utils/storage";
import { validateLinearKey, fetchLinearTeams, fetchLinearProjects } from "@/api/linear";
import {
  validateClickUpKey,
  fetchClickUpWorkspaces,
  fetchClickUpSpaces,
  fetchClickUpLists,
} from "@/api/clickup";

export function Options() {
  // Linear
  const [linearKey, setLinearKey] = useState("");
  const [linearViewer, setLinearViewer] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [linearError, setLinearError] = useState<string | null>(null);
  const [linearValidating, setLinearValidating] = useState(false);
  const [linearTeams, setLinearTeams] = useState<{ id: string; name: string }[]>([]);
  const [linearTeamId, setLinearTeamId] = useState("");
  const [linearProjects, setLinearProjects] = useState<{ id: string; name: string }[]>([]);
  const [linearProjectId, setLinearProjectId] = useState("");

  // ClickUp
  const [clickupKey, setClickupKey] = useState("");
  const [clickupUser, setClickupUser] = useState<{
    username: string;
    email: string;
  } | null>(null);
  const [clickupError, setClickupError] = useState<string | null>(null);
  const [clickupValidating, setClickupValidating] = useState(false);
  const [clickupWorkspaces, setClickupWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [clickupWorkspaceId, setClickupWorkspaceId] = useState("");
  const [clickupSpaces, setClickupSpaces] = useState<{ id: string; name: string }[]>([]);
  const [clickupSpaceId, setClickupSpaceId] = useState("");
  const [clickupLists, setClickupLists] = useState<{ id: string; name: string }[]>([]);
  const [clickupListId, setClickupListId] = useState("");

  // Prefs
  const [defaultIntegration, setDefaultIntegration] = useState<"linear" | "clickup">("linear");
  const [includeLocalStorage, setIncludeLocalStorage] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load existing settings
  useEffect(() => {
    getStorage([
      "linear_api_key",
      "linear_viewer",
      "linear_default_team_id",
      "linear_default_project_id",
      "clickup_api_key",
      "clickup_user",
      "clickup_default_workspace_id",
      "clickup_default_space_id",
      "clickup_default_list_id",
      "default_integration",
      "include_localstorage_keys",
    ]).then((data) => {
      if (data.linear_api_key) setLinearKey(data.linear_api_key);
      if (data.linear_viewer) setLinearViewer(data.linear_viewer);
      if (data.linear_default_team_id) setLinearTeamId(data.linear_default_team_id);
      if (data.linear_default_project_id) setLinearProjectId(data.linear_default_project_id);
      if (data.clickup_api_key) setClickupKey(data.clickup_api_key);
      if (data.clickup_user) setClickupUser(data.clickup_user);
      if (data.clickup_default_workspace_id) setClickupWorkspaceId(data.clickup_default_workspace_id);
      if (data.clickup_default_space_id) setClickupSpaceId(data.clickup_default_space_id);
      if (data.clickup_default_list_id) setClickupListId(data.clickup_default_list_id);
      if (data.default_integration) setDefaultIntegration(data.default_integration);
      if (data.include_localstorage_keys !== undefined)
        setIncludeLocalStorage(data.include_localstorage_keys);
    });
  }, []);

  // Fetch Linear data when key is validated
  useEffect(() => {
    if (!linearViewer || !linearKey) return;
    fetchLinearTeams(linearKey).then(setLinearTeams).catch(() => {});
  }, [linearViewer, linearKey]);

  useEffect(() => {
    if (!linearKey || !linearTeamId) return;
    fetchLinearProjects(linearKey, linearTeamId).then(setLinearProjects).catch(() => {});
  }, [linearKey, linearTeamId]);

  // Fetch ClickUp data
  useEffect(() => {
    if (!clickupUser || !clickupKey) return;
    fetchClickUpWorkspaces(clickupKey).then(setClickupWorkspaces).catch(() => {});
  }, [clickupUser, clickupKey]);

  useEffect(() => {
    if (!clickupKey || !clickupWorkspaceId) return;
    fetchClickUpSpaces(clickupKey, clickupWorkspaceId).then(setClickupSpaces).catch(() => {});
  }, [clickupKey, clickupWorkspaceId]);

  useEffect(() => {
    if (!clickupKey || !clickupSpaceId) return;
    fetchClickUpLists(clickupKey, clickupSpaceId).then(setClickupLists).catch(() => {});
  }, [clickupKey, clickupSpaceId]);

  const validateLinear = async () => {
    setLinearValidating(true);
    setLinearError(null);
    try {
      const viewer = await validateLinearKey(linearKey);
      setLinearViewer(viewer);
      await setStorage({ linear_api_key: linearKey, linear_viewer: viewer });
    } catch (err) {
      setLinearError(err instanceof Error ? err.message : "Validation failed");
      setLinearViewer(null);
    } finally {
      setLinearValidating(false);
    }
  };

  const validateClickUp = async () => {
    setClickupValidating(true);
    setClickupError(null);
    try {
      const user = await validateClickUpKey(clickupKey);
      setClickupUser(user);
      await setStorage({ clickup_api_key: clickupKey, clickup_user: user });
    } catch (err) {
      setClickupError(err instanceof Error ? err.message : "Validation failed");
      setClickupUser(null);
    } finally {
      setClickupValidating(false);
    }
  };

  const saveDefaults = async () => {
    await setStorage({
      default_integration: defaultIntegration,
      include_localstorage_keys: includeLocalStorage,
      linear_default_team_id: linearTeamId || undefined,
      linear_default_project_id: linearProjectId || undefined,
      clickup_default_workspace_id: clickupWorkspaceId || undefined,
      clickup_default_space_id: clickupSpaceId || undefined,
      clickup_default_list_id: clickupListId || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bug Opener Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure your integrations and default preferences.
        </p>
      </div>

      {/* Linear */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Linear</CardTitle>
            {linearViewer && (
              <Badge variant="success">{linearViewer.name}</Badge>
            )}
          </div>
          <CardDescription>
            Connect your Linear account with a personal API token.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="lin_api_..."
              value={linearKey}
              onChange={(e) => setLinearKey(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={validateLinear}
              disabled={!linearKey || linearValidating}
            >
              {linearValidating ? "Validating..." : "Validate"}
            </Button>
          </div>
          {linearError && (
            <Alert variant="destructive">
              <AlertDescription>{linearError}</AlertDescription>
            </Alert>
          )}
          {linearViewer && linearTeams.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Default Team</Label>
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
              {linearProjects.length > 0 && (
                <div className="space-y-2">
                  <Label>Default Project</Label>
                  <Select value={linearProjectId} onValueChange={setLinearProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
        </CardContent>
      </Card>

      {/* ClickUp */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ClickUp</CardTitle>
            {clickupUser && (
              <Badge variant="success">{clickupUser.username}</Badge>
            )}
          </div>
          <CardDescription>
            Connect your ClickUp account with a personal API token.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="pk_..."
              value={clickupKey}
              onChange={(e) => setClickupKey(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={validateClickUp}
              disabled={!clickupKey || clickupValidating}
            >
              {clickupValidating ? "Validating..." : "Validate"}
            </Button>
          </div>
          {clickupError && (
            <Alert variant="destructive">
              <AlertDescription>{clickupError}</AlertDescription>
            </Alert>
          )}
          {clickupUser && clickupWorkspaces.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Default Workspace</Label>
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
              {clickupSpaces.length > 0 && (
                <div className="space-y-2">
                  <Label>Default Space</Label>
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
              {clickupLists.length > 0 && (
                <div className="space-y-2">
                  <Label>Default List</Label>
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

        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Integration</Label>
            <Select
              value={defaultIntegration}
              onValueChange={(v) =>
                setDefaultIntegration(v as "linear" | "clickup")
              }
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

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Include localStorage key names</Label>
              <p className="text-xs text-gray-500 mt-0.5">
                Key names only — values are never collected.
              </p>
            </div>
            <Switch
              checked={includeLocalStorage}
              onCheckedChange={setIncludeLocalStorage}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={saveDefaults}>Save Defaults</Button>
        {saved && (
          <span className="text-sm text-green-600">Saved!</span>
        )}
      </div>
    </div>
  );
}
