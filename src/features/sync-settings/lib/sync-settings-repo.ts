import "server-only";

import { Result } from "@praha/byethrow";
import { eq } from "drizzle-orm";
import type { Db } from "@/shared/lib/db";
import { DatabaseError } from "@/shared/lib/db/database-error";
import { syncSettings } from "@/shared/lib/db/schema";
import type { UserId } from "@/shared/types/user-id";

export const getSyncSettingsEnabled = (
  db: Db,
  userId: UserId,
): Result.ResultAsync<boolean, DatabaseError> =>
  Result.pipe(
    Result.try({
      try: () =>
        db
          .select({ enabled: syncSettings.enabled })
          .from(syncSettings)
          .where(eq(syncSettings.userId, userId))
          .get(),
      catch: DatabaseError.of,
    }),
    Result.map((row) => row?.enabled === 1),
  );

export const saveSyncSettingsEnabled = (
  db: Db,
  userId: UserId,
  enabled: boolean,
): Result.ResultAsync<void, DatabaseError> =>
  Result.try({
    try: async () => {
      await db
        .insert(syncSettings)
        .values({ userId, enabled: enabled ? 1 : 0, updatedAt: Date.now() })
        .onConflictDoUpdate({
          target: syncSettings.userId,
          set: { enabled: enabled ? 1 : 0, updatedAt: Date.now() },
        });
    },
    catch: DatabaseError.of,
  });
