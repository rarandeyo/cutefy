import "server-only";

import { eq } from "drizzle-orm";
import type { Db } from "@/shared/lib/db";
import { syncSettings } from "@/shared/lib/db/schema";
import type { UserId } from "@/shared/types/brands";

export const getSyncSettingsEnabled = async (db: Db, userId: UserId): Promise<boolean> => {
  const row = await db
    .select({ enabled: syncSettings.enabled })
    .from(syncSettings)
    .where(eq(syncSettings.userId, userId))
    .get();
  return row?.enabled === 1;
};

export const saveSyncSettingsEnabled = async (
  db: Db,
  userId: UserId,
  enabled: boolean,
): Promise<void> => {
  await db
    .insert(syncSettings)
    .values({ userId, enabled: enabled ? 1 : 0, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: syncSettings.userId,
      set: { enabled: enabled ? 1 : 0, updatedAt: Date.now() },
    });
};
