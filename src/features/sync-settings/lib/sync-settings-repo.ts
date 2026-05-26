import "server-only";

import type { UserId } from "@/shared/types/brands";

export const getSyncSettingsEnabled = async (db: D1Database, userId: UserId): Promise<boolean> => {
  const row = await db
    .prepare("SELECT enabled FROM sync_settings WHERE user_id = ?")
    .bind(userId)
    .first<{ enabled: number }>();
  return row?.enabled === 1;
};

export const saveSyncSettingsEnabled = async (
  db: D1Database,
  userId: UserId,
  enabled: boolean,
): Promise<void> => {
  await db
    .prepare("INSERT OR REPLACE INTO sync_settings (user_id, enabled, updated_at) VALUES (?, ?, ?)")
    .bind(userId, enabled ? 1 : 0, Date.now())
    .run();
};
