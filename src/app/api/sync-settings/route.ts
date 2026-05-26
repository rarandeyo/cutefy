import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { getAuth } from "@/shared/lib/auth/server";
import { updatePlaylists } from "@/lib/playlist-sync";

const requireSession = async (request: Request) => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
};

const syncSettingsBodySchema = z.object({
  enabled: z.boolean(),
});

export const GET = async (request: Request): Promise<Response> => {
  let session: Awaited<ReturnType<typeof requireSession>>;
  try {
    session = await requireSession(request);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const row = await env.DB.prepare("SELECT enabled FROM sync_settings WHERE user_id = ?")
    .bind(session.user.id)
    .first<{ enabled: number }>();

  return Response.json({ enabled: row?.enabled === 1 });
};

export const POST = async (request: Request): Promise<Response> => {
  let session: Awaited<ReturnType<typeof requireSession>>;
  try {
    session = await requireSession(request);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parseResult = syncSettingsBodySchema.safeParse(await request.json());
  if (!parseResult.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { enabled } = parseResult.data;
  const { env } = await getCloudflareContext({ async: true });

  await env.DB.prepare(
    "INSERT OR REPLACE INTO sync_settings (user_id, enabled, updated_at) VALUES (?, ?, ?)",
  )
    .bind(session.user.id, enabled ? 1 : 0, Date.now())
    .run();

  // Run initial sync when enabling
  if (enabled) {
    try {
      await updatePlaylists(env, { skipEnabledCheck: true, userId: session.user.id });
    } catch (err) {
      console.error("[sync-settings] Initial sync failed:", err);
      return Response.json({
        enabled: true,
        syncError: "Initial sync failed",
      });
    }
  }

  return Response.json({ enabled });
};
