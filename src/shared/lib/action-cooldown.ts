import "server-only";

import { Result } from "@praha/byethrow";
import { lte } from "drizzle-orm";
import type { Db } from "@/shared/lib/db";
import { DatabaseError } from "@/shared/lib/db/database-error";
import { actionCooldown } from "@/shared/lib/db/schema";
import type { UserId } from "@/shared/types/user-id";

// Spotify のレート制限はアプリ単位なので、1 ユーザーの連打が全ユーザーと日次 cron を巻き込まないよう間隔を空けさせる
const COOLDOWN_MS = {
  manual_sync: 10 * 60 * 1000,
  load_saved_tracks: 60 * 1000,
} as const satisfies Record<string, number>;

export type CooldownAction = keyof typeof COOLDOWN_MS;

export type CooldownActiveError = Readonly<{
  kind: "CooldownActive";
  action: CooldownAction;
  cooldownMs: number;
}>;

/**
 * action の実行権を取得する。前回の取得から cooldown が経っていなければ CooldownActiveError を返す。
 * 判定と記録を 1 文の upsert で行うので、同時に来たリクエストのうち通るのは 1 つだけになる。
 */
export const claimActionCooldown = (
  db: Db,
  userId: UserId,
  action: CooldownAction,
  now: Date,
): Result.ResultAsync<void, CooldownActiveError | DatabaseError> => {
  const cooldownMs = COOLDOWN_MS[action];
  return Result.pipe(
    Result.try({
      try: () =>
        db
          .insert(actionCooldown)
          .values({ userId, action, lastTriggeredAt: now.getTime() })
          .onConflictDoUpdate({
            target: [actionCooldown.userId, actionCooldown.action],
            set: { lastTriggeredAt: now.getTime() },
            setWhere: lte(actionCooldown.lastTriggeredAt, now.getTime() - cooldownMs),
          })
          .returning({ userId: actionCooldown.userId }),
      catch: DatabaseError.of,
    }),
    Result.andThen(
      (rows): Result.Result<void, CooldownActiveError> =>
        rows.length > 0
          ? Result.succeed(undefined)
          : Result.fail({ kind: "CooldownActive", action, cooldownMs }),
    ),
  );
};
