"use server";

import { Result } from "@praha/byethrow";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { z } from "zod";
import { assertNever } from "@/shared/lib/assert-never";
import { getAuth } from "@/shared/lib/auth/server";
import { createDb } from "@/shared/lib/db";
import type { DatabaseError } from "@/shared/lib/db/database-error";
import { schemaParse, type ValidationError } from "@/shared/lib/validation";
import { UserId } from "@/shared/types/user-id";
import { syncSingleUser } from "@/features/playlist-sync/lib/playlist-sync";
import type { SyncResult } from "@/features/playlist-sync/lib/sync-result";
import { saveSyncSettingsEnabled } from "@/features/sync-settings/lib/sync-settings-repo";

const inputSchema = z.object({ enabled: z.boolean() });
const parseInput = schemaParse(inputSchema);

export type ToggleSyncSettingsInput = z.input<typeof inputSchema>;

export type ToggleSyncSettingsResult =
  | Readonly<{ kind: "enabled"; sync: SyncResult }>
  | Readonly<{ kind: "disabled" }>
  | Readonly<{ kind: "unauthorized"; message: string }>
  | Readonly<{ kind: "invalid_input"; message: string }>
  | Readonly<{ kind: "unknown"; message: string }>;

type SessionNotFoundError = Readonly<{ kind: "SessionNotFound" }>;
type AuthServiceError = Readonly<{ kind: "AuthServiceError"; cause: unknown }>;

type ToggleSyncSettingsError =
  | ValidationError
  | SessionNotFoundError
  | AuthServiceError
  | DatabaseError;

const getCurrentUserId = async (): Result.ResultAsync<
  UserId,
  SessionNotFoundError | AuthServiceError
> => {
  const auth = await getAuth();
  const requestHeaders = await headers();
  return Result.pipe(
    Result.try({
      try: () => auth.api.getSession({ headers: requestHeaders }),
      catch: (cause): AuthServiceError => ({ kind: "AuthServiceError", cause }),
    }),
    Result.andThen(
      (session): Result.Result<string, SessionNotFoundError> =>
        session ? Result.succeed(session.user.id) : Result.fail({ kind: "SessionNotFound" }),
    ),
    Result.andThen((rawUserId) =>
      Result.pipe(
        UserId.parse(rawUserId),
        Result.mapError((cause): AuthServiceError => ({ kind: "AuthServiceError", cause })),
      ),
    ),
  );
};

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

export const toggleSyncSettings = async (
  input: ToggleSyncSettingsInput,
): Promise<ToggleSyncSettingsResult> => {
  const result = await Result.pipe(
    Result.do(),
    Result.bind("parsed", () => parseInput(input)),
    Result.bind("userId", () => getCurrentUserId()),
    Result.bind("env", async () => {
      const { env } = await getCloudflareContext({ async: true });
      return Result.succeed(env);
    }),
    Result.andThrough(({ parsed, userId, env }) =>
      saveSyncSettingsEnabled(createDb(env.DB), userId, parsed.enabled),
    ),
    Result.andThen(
      async ({ parsed, userId, env }): Result.ResultAsync<ToggleSyncSettingsResult, never> =>
        Result.succeed(
          parsed.enabled
            ? { kind: "enabled", sync: await syncSingleUser(env, userId) }
            : { kind: "disabled" },
        ),
    ),
  );

  return Result.isSuccess(result) ? result.value : toToggleErrorResult(result.error);
};
