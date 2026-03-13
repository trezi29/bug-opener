const CLICKUP_API = "https://api.clickup.com/api/v2";

async function clickupFetch(
  apiKey: string,
  path: string,
  options?: RequestInit
) {
  const res = await fetch(`${CLICKUP_API}${path}`, {
    ...options,
    headers: {
      Authorization: apiKey,
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickUp API error: ${res.status} — ${text}`);
  }

  return res.json();
}

export async function validateClickUpKey(
  apiKey: string
): Promise<{ id: number; username: string; email: string }> {
  const data = await clickupFetch(apiKey, "/user");
  return data.user;
}

export async function fetchClickUpWorkspaces(
  apiKey: string
): Promise<{ id: string; name: string }[]> {
  const data = await clickupFetch(apiKey, "/team");
  return data.teams.map((t: { id: string; name: string }) => ({
    id: t.id,
    name: t.name,
  }));
}

export async function fetchClickUpSpaces(
  apiKey: string,
  workspaceId: string
): Promise<{ id: string; name: string }[]> {
  const data = await clickupFetch(apiKey, `/team/${workspaceId}/space`);
  return data.spaces.map((s: { id: string; name: string }) => ({
    id: s.id,
    name: s.name,
  }));
}

export async function fetchClickUpLists(
  apiKey: string,
  spaceId: string
): Promise<{ id: string; name: string }[]> {
  // Fetch folderless lists
  const folderlessData = await clickupFetch(
    apiKey,
    `/space/${spaceId}/list`
  );
  const lists: { id: string; name: string }[] = folderlessData.lists.map(
    (l: { id: string; name: string }) => ({ id: l.id, name: l.name })
  );

  // Fetch folders and their lists
  const foldersData = await clickupFetch(apiKey, `/space/${spaceId}/folder`);
  for (const folder of foldersData.folders) {
    for (const list of folder.lists) {
      lists.push({
        id: list.id,
        name: `${folder.name} / ${list.name}`,
      });
    }
  }

  return lists;
}

export async function createClickUpTask(
  apiKey: string,
  input: { listId: string; name: string; description: string }
): Promise<{ id: string; url: string }> {
  const data = await clickupFetch(apiKey, `/list/${input.listId}/task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      markdown_description: input.description,
      tags: ["bug"],
    }),
  });

  return { id: data.id, url: data.url };
}

export async function attachClickUpFile(
  apiKey: string,
  taskId: string,
  blob: Blob,
  filename: string
): Promise<void> {
  const form = new FormData();
  form.append("attachment", blob, filename);
  const res = await fetch(
    `${CLICKUP_API}/task/${taskId}/attachment`,
    {
      method: "POST",
      headers: { Authorization: apiKey },
      body: form,
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickUp attachment failed: ${res.status} — ${text}`);
  }
}

