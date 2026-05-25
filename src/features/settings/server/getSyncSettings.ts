import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const getSyncEnabled = async (userId: string): Promise<boolean> => {
  const { env } = getCloudflareContext();
  const row = await env.DB.prepare("SELECT enabled FROM sync_settings WHERE user_id = ?")
    .bind(userId)
    .first<{ enabled: number }>();
  return row?.enabled === 1;
};
