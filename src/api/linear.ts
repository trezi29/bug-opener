const LINEAR_API = "https://api.linear.app/graphql";

async function gql(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>
) {
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Linear API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Linear GraphQL error: ${json.errors[0].message}`);
  }

  return json.data;
}

export async function validateLinearKey(
  apiKey: string
): Promise<{ id: string; name: string; email: string }> {
  const data = await gql(apiKey, `query { viewer { id name email } }`);
  return data.viewer;
}

export async function fetchLinearTeams(
  apiKey: string
): Promise<{ id: string; name: string }[]> {
  const data = await gql(
    apiKey,
    `query { teams { nodes { id name } } }`
  );
  return data.teams.nodes;
}

export async function fetchLinearProjects(
  apiKey: string,
  teamId: string
): Promise<{ id: string; name: string }[]> {
  const data = await gql(
    apiKey,
    `query($teamId: String!) { team(id: $teamId) { projects { nodes { id name } } } }`,
    { teamId }
  );
  return data.team.projects.nodes;
}

export async function createLinearIssue(
  apiKey: string,
  input: {
    title: string;
    description: string;
    teamId: string;
    projectId?: string;
  }
): Promise<{ id: string; identifier: string; url: string }> {
  const data = await gql(
    apiKey,
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url }
      }
    }`,
    {
      input: {
        title: input.title,
        description: input.description,
        teamId: input.teamId,
        ...(input.projectId ? { projectId: input.projectId } : {}),
      },
    }
  );

  if (!data.issueCreate.success) {
    throw new Error("Failed to create Linear issue");
  }

  return data.issueCreate.issue;
}

export async function uploadLinearImage(
  apiKey: string,
  blob: Blob
): Promise<string> {
  const filename = `bug-screenshot-${Date.now()}.png`;

  // Step 1: Request upload URL
  const data = await gql(
    apiKey,
    `mutation($filename: String!, $contentType: String!, $size: Int!) {
      fileUpload(filename: $filename, contentType: $contentType, size: $size) {
        uploadFile {
          uploadUrl
          assetUrl
          headers {
            key
            value
          }
        }
      }
    }`,
    {
      filename,
      contentType: "image/png",
      size: blob.size,
    }
  );

  const { uploadUrl, assetUrl, headers } = data.fileUpload.uploadFile;

  // Step 2: Upload the blob
  const uploadHeaders: Record<string, string> = {};
  for (const h of headers) {
    uploadHeaders[h.key] = h.value;
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: uploadHeaders,
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload image to Linear: ${uploadRes.status}`);
  }

  return assetUrl;
}
