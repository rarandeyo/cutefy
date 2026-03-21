import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuth } from "@/lib/auth";
import { updatePlaylists } from "@/lib/playlist-sync";

const requireSession = async (request: Request) => {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
};

export async function GET(request: Request) {
  try {
    await requireSession(request);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { env } = getCloudflareContext();
  const row = await env.DB.prepare("SELECT enabled FROM sync_settings WHERE id = 'default'").first<{
    enabled: number;
  }>();

  return Response.json({ enabled: row?.enabled === 1 });
}

export async function POST(request: Request) {
  try {
    await requireSession(request);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  if (typeof body !== "object" || body === null || !("enabled" in body)) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const enabled = (body as { enabled: boolean }).enabled;
  const { env } = getCloudflareContext();

  await env.DB.prepare(
    "INSERT OR REPLACE INTO sync_settings (id, enabled, updated_at) VALUES ('default', ?, ?)",
  )
    .bind(enabled ? 1 : 0, Date.now())
    .run();

  // Run initial sync when enabling
  if (enabled) {
    try {
      await updatePlaylists(env, { skipEnabledCheck: true });
    } catch (err) {
      console.error("[sync-settings] Initial sync failed:", err);
      return Response.json({
        enabled: true,
        syncError: err instanceof Error ? err.message : "Sync failed",
      });
    }
  }

  return Response.json({ enabled });
}
