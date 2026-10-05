"use server";

import { Result } from "@praha/byethrow";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { z } from "zod";
import { claimActionCooldown } from "@/shared/lib/action-cooldown";
import { assertNever } from "@/shared/lib/assert-never";
import { getCurrentUserId, type CurrentUserIdError } from "@/shared/lib/auth/current-user";
import { getAuth } from "@/shared/lib/auth/server";
import { createDb } from "@/shared/lib/db";
import type { DatabaseError } from "@/shared/lib/db/database-error";
import { logger } from "@/shared/lib/logger";
import { schemaParse, type ValidationError } from "@/shared/lib/validation";
import { syncSingleUser } from "@/features/playlist-sync/lib/playlist-sync";
import type { SyncResult } from "@/features/playlist-sync/lib/sync-result";
import { saveSyncSettingsEnabled } from "@/features/sync-settings/lib/sync-settings-repo";
import type { UserId } from "@/shared/types/user-id";

const inputSchema = z.object({ enabled: z.boolean() });
const parseInput = schemaParse(inputSchema);

export type ToggleSyncSettingsInput = z.input<typeof inputSchema>;

export type ToggleSyncSettingsResult =
  | Readonly<{ kind: "enabled"; sync: SyncResult }>
  // 設定は有効化済み。手動同期だけを見送り、次回の日次同期に任せる
  | Readonly<{ kind: "sync_skipped"; reason: "cooldown"; cooldownMs: number }>
  | Readonly<{ kind: "sync_skipped"; reason: "unavailable" }>
  | Readonly<{ kind: "disabled" }>
  | Readonly<{ kind: "unauthorized"; message: string }>
  | Readonly<{ kind: "invalid_input"; message: string }>
  | Readonly<{ kind: "unknown"; message: string }>;

type ToggleSyncSettingsError = ValidationError | CurrentUserIdError | DatabaseError;

// ドメインエラー → クライアント向け結果への変換は controller 層 (Server Action) の責務
const toToggleErrorResult = (error: ToggleSyncSettingsError): ToggleSyncSettingsResult => {
  switch (error.kind) {
    case "ValidationError":
      return { kind: "invalid_input", message: "入力が不正です" };
    case "SessionNotFound":
      return { kind: "unauthorized", message: "未ログイン" };
    case "AuthServiceError":
      return { kind: "unknown", message: "認証情報の取得に失敗しました" };
    case "DatabaseError":
      return { kind: "unknown", message: "設定の保存に失敗しました" };
    default:
      return assertNever(error);
  }
};

const syncWithCooldown = async (
  env: CloudflareEnv,
  userId: UserId,
  now: Date,
): Promise<ToggleSyncSettingsResult> => {
  const claim = await claimActionCooldown(createDb(env.DB), userId, "manual_sync", now);
  if (Result.isSuccess(claim)) {
    return { kind: "enabled", sync: await syncSingleUser(env, userId, now) };
  }
  switch (claim.error.kind) {
    case "CooldownActive":
      return { kind: "sync_skipped", reason: "cooldown", cooldownMs: claim.error.cooldownMs };
    case "DatabaseError":
      // 判定できないときは同期しない側に倒す（レート制限の抜け道にしない）
      logger.error(`[sync-settings] Failed to claim manual sync cooldown for user ${userId}`);
      return { kind: "sync_skipped", reason: "unavailable" };
    default:
      return assertNever(claim.error);
  }
};

export const toggleSyncSettings = async (
  input: ToggleSyncSettingsInput,
): Promise<ToggleSyncSettingsResult> => {
  // 時刻はエントリポイントで一度だけ取得し、ドメイン関数には引数で注入する
  const now = new Date();
  const result = await Result.pipe(
    Result.do(),
    Result.bind("parsed", () => parseInput(input)),
    Result.bind("userId", async () => {
      const auth = await getAuth();
      const requestHeaders = await headers();
      return getCurrentUserId(auth, requestHeaders);
    }),
    Result.bind("env", async () => {
      const { env } = await getCloudflareContext({ async: true });
      return Result.succeed(env);
    }),
    Result.andThrough(({ parsed, userId, env }) =>
      saveSyncSettingsEnabled(createDb(env.DB), userId, parsed.enabled, now),
    ),
    Result.andThen(
      async ({ parsed, userId, env }): Result.ResultAsync<ToggleSyncSettingsResult, never> =>
        Result.succeed(
          parsed.enabled ? await syncWithCooldown(env, userId, now) : { kind: "disabled" },
        ),
    ),
  );

  return Result.isSuccess(result) ? result.value : toToggleErrorResult(result.error);
};
