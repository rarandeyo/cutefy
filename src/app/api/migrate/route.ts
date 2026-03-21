import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getMigrations } from "better-auth/db/migration";
import { getAuth } from "@/lib/auth";

export async function POST(request: Request) {
  const secret = request.headers.get("x-migrate-secret");
  if (!secret || secret !== process.env.BETTER_AUTH_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runMigrations } = await getMigrations(getAuth().options);
  await runMigrations();

  // Create playlist_sync table for cron job
  const { env } = getCloudflareContext();
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS playlist_sync (
      period TEXT PRIMARY KEY,
      playlist_id TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  return Response.json({ ok: true });
}
