import { Result } from "@praha/byethrow";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import {
  createPlaylistFromTracks,
  createSpotifyClient,
  fetchAllSavedTracks,
  filterTracksByDateRange,
  replacePlaylistTracks,
  updatePlaylistDetails,
  type DateRange,
  type TrackWithAddedAt,
} from "@/shared/lib/spotify";
import { refreshAccessToken } from "@/shared/lib/spotify/token";
import {
  decryptStoredOAuthToken,
  encryptOAuthTokenForStorage,
  loadOAuthTokenContext,
  type OAuthTokenCipherError,
  type OAuthTokenContext,
  type StoredOAuthToken,
} from "@/shared/lib/auth/oauth-token-cipher";
import { createDb, type Db } from "@/shared/lib/db";
import { DatabaseError } from "@/shared/lib/db/database-error";
import { account, playlistSync, syncSettings } from "@/shared/lib/db/schema";
import { assertNever } from "@/shared/lib/assert-never";
import { logger } from "@/shared/lib/logger";
import { Sensitive, sensitiveString } from "@/shared/lib/sensitive";
import { schemaParse, type ValidationError } from "@/shared/lib/validation";
import { PlaylistId } from "@/shared/types/playlist-id";
import { UserId } from "@/shared/types/user-id";
import type { RefreshTokenNotFoundError, SyncPeriodError, SyncUserSetupError } from "./sync-errors";
import { SyncPeriod } from "./sync-period";
import type { SyncPeriodKey } from "./sync-period-key";
import type { SyncPeriodFailure, SyncResult } from "./sync-result";
import type { BatchSyncResult, UserSyncFailure } from "./batch-sync-result";

const syncConfigSchema = z.object({
  SPOTIFY_CLIENT_ID: z.string().min(1),
  SPOTIFY_CLIENT_SECRET: sensitiveString,
  BETTER_AUTH_SECRET: sensitiveString,
  NEXT_PUBLIC_APP_URL: z.url(),
});

const parseSyncConfigEnv = schemaParse(syncConfigSchema);

type SyncConfig = Readonly<{
  clientId: string;
  clientSecret: Sensitive<string>;
  authSecret: Sensitive<string>;
  appUrl: string;
}>;

const parseSyncConfig = (env: CloudflareEnv): Result.Result<SyncConfig, ValidationError> =>
  Result.pipe(
    parseSyncConfigEnv(env),
    Result.map(
      (parsed): SyncConfig => ({
        clientId: parsed.SPOTIFY_CLIENT_ID,
        clientSecret: parsed.SPOTIFY_CLIENT_SECRET,
        authSecret: parsed.BETTER_AUTH_SECRET,
        appUrl: parsed.NEXT_PUBLIC_APP_URL,
      }),
    ),
  );

const buildPlaylistDescription = (appUrl: string, now: Date): string =>
  `Created by Cutefy (${appUrl}) · Updated at ${now.toISOString().slice(0, 10)}`;

// 「N ヶ月前」は Date の月演算に従う（月末日は翌月に正規化されうる: 5/31 の 1 ヶ月前 → 5/1）
const buildDateRange = (period: SyncPeriod, now: Date): DateRange => ({
  startDate: new Date(
    now.getFullYear(),
    now.getMonth() - period.months,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  ),
  endDate: now,
});

const getRefreshToken = (
  db: Db,
  userId: UserId,
  tokenContext: OAuthTokenContext,
): Result.ResultAsync<
  StoredOAuthToken,
  DatabaseError | RefreshTokenNotFoundError | OAuthTokenCipherError
> =>
  Result.pipe(
    Result.try({
      try: () =>
        db
          .select({ refreshToken: account.refreshToken })
          .from(account)
          .where(and(eq(account.providerId, "spotify"), eq(account.userId, userId)))
          .get(),
      catch: DatabaseError.of,
    }),
    Result.andThen(
      (row): Result.Result<Sensitive<string>, RefreshTokenNotFoundError> =>
        row?.refreshToken
          ? Result.succeed(Sensitive.of(row.refreshToken))
          : Result.fail({ kind: "RefreshTokenNotFound", userId }),
    ),
    Result.andThen((stored) => decryptStoredOAuthToken(stored, tokenContext)),
  );

// Spotify が新しい refresh token を返したときと、暗号化前の平文が残っていたときに暗号化して書き戻す。
// 読んでから書くまでに再ログイン等で better-auth が書き換えた値は上書きしない
const saveRefreshTokenIfNeeded = (
  db: Db,
  userId: UserId,
  stored: StoredOAuthToken,
  newRefreshToken: Sensitive<string> | undefined,
  tokenContext: OAuthTokenContext,
): Result.ResultAsync<void, DatabaseError | OAuthTokenCipherError> => {
  const tokenToSave = newRefreshToken ?? (stored.storedAsPlaintext ? stored.token : undefined);
  if (tokenToSave === undefined) {
    return Promise.resolve(Result.succeed(undefined));
  }
  return Result.pipe(
    encryptOAuthTokenForStorage(tokenToSave, tokenContext),
    Result.andThen((encrypted) =>
      Result.try({
        try: () =>
          db
            .update(account)
            .set({ refreshToken: encrypted })
            .where(
              and(
                eq(account.providerId, "spotify"),
                eq(account.userId, userId),
                eq(account.refreshToken, stored.storedValue.unwrap()),
              ),
            )
            .returning({ id: account.id }),
        catch: DatabaseError.of,
      }),
    ),
    Result.map((updated): void => {
      logger.info(
        updated.length > 0
          ? `[playlist-sync] Refresh token saved encrypted for user ${userId}`
          : `[playlist-sync] Refresh token changed concurrently, skipped saving for user ${userId}`,
      );
    }),
  );
};

const findPlaylistId = (
  db: Db,
  userId: UserId,
  periodKey: SyncPeriodKey,
): Result.ResultAsync<PlaylistId | undefined, DatabaseError | ValidationError> =>
  Result.pipe(
    Result.try({
      try: () =>
        db
          .select({ playlistId: playlistSync.playlistId })
          .from(playlistSync)
          .where(and(eq(playlistSync.userId, userId), eq(playlistSync.period, periodKey)))
          .get(),
      catch: DatabaseError.of,
    }),
    Result.andThen(
      (row): Result.Result<PlaylistId | undefined, ValidationError> =>
        row === undefined ? Result.succeed(undefined) : PlaylistId.parse(row.playlistId),
    ),
  );

const savePlaylistId = (
  db: Db,
  userId: UserId,
  periodKey: SyncPeriodKey,
  playlistId: PlaylistId,
  now: Date,
): Result.ResultAsync<void, DatabaseError> =>
  Result.try({
    try: async () => {
      await db
        .insert(playlistSync)
        .values({ userId, period: periodKey, playlistId, updatedAt: now.getTime() })
        .onConflictDoUpdate({
          target: [playlistSync.userId, playlistSync.period],
          set: { playlistId, updatedAt: now.getTime() },
        });
    },
    catch: DatabaseError.of,
  });

const getEnabledUserIds = (
  db: Db,
): Result.ResultAsync<readonly UserId[], DatabaseError | ValidationError> =>
  Result.pipe(
    Result.try({
      try: () =>
        db
          .select({ userId: syncSettings.userId })
          .from(syncSettings)
          .where(eq(syncSettings.enabled, 1))
          .all(),
      catch: DatabaseError.of,
    }),
    Result.andThen((rows) => Result.sequence(rows, (row) => UserId.parse(row.userId))),
  );

type SyncPeriodContext = Readonly<{
  sdk: SpotifyApi;
  db: Db;
  userId: UserId;
  appUrl: string;
  now: Date;
}>;

const createNewPlaylist = (
  ctx: SyncPeriodContext,
  period: SyncPeriod,
  trackUris: readonly TrackWithAddedAt["uri"][],
  description: string,
): Result.ResultAsync<void, SyncPeriodError> =>
  Result.pipe(
    createPlaylistFromTracks({
      sdk: ctx.sdk,
      playlistName: `Cutefy ${period.label}`,
      trackUris,
      description,
    }),
    Result.andThrough(({ playlistId }) =>
      savePlaylistId(ctx.db, ctx.userId, period.key, playlistId, ctx.now),
    ),
    Result.map(({ playlistId }): void => {
      logger.info(
        `[playlist-sync] Created playlist ${period.key} (${playlistId}): ${trackUris.length} tracks`,
      );
    }),
  );

const updateExistingPlaylist = (
  ctx: SyncPeriodContext,
  period: SyncPeriod,
  playlistId: PlaylistId,
  trackUris: readonly TrackWithAddedAt["uri"][],
  description: string,
): Result.ResultAsync<void, SyncPeriodError> =>
  Result.pipe(
    replacePlaylistTracks({ sdk: ctx.sdk, playlistId, trackUris }),
    Result.andThen(() => updatePlaylistDetails({ sdk: ctx.sdk, playlistId, description })),
    Result.andThen(() => savePlaylistId(ctx.db, ctx.userId, period.key, playlistId, ctx.now)),
    Result.map((): void => {
      logger.info(`[playlist-sync] Updated playlist ${period.key}: ${trackUris.length} tracks`);
    }),
  );

const syncPeriodPlaylist = (
  ctx: SyncPeriodContext,
  period: SyncPeriod,
  allTracks: readonly TrackWithAddedAt[],
): Result.ResultAsync<void, SyncPeriodError> => {
  const trackUris = filterTracksByDateRange(allTracks, buildDateRange(period, ctx.now))
    .toReversed()
    .map((track) => track.uri);

  if (trackUris.length === 0) {
    logger.info(`[playlist-sync] No tracks for period ${period.key}, skipping`);
    return Promise.resolve(Result.succeed(undefined));
  }

  const description = buildPlaylistDescription(ctx.appUrl, ctx.now);

  return Result.pipe(
    findPlaylistId(ctx.db, ctx.userId, period.key),
    Result.andThen((existingPlaylistId) =>
      existingPlaylistId === undefined
        ? createNewPlaylist(ctx, period, trackUris, description)
        : Result.pipe(
            updateExistingPlaylist(ctx, period, existingPlaylistId, trackUris, description),
            Result.orElse((error): Result.ResultAsync<void, SyncPeriodError> => {
              if (error.kind !== "PlaylistNotFound") {
                return Promise.resolve(Result.fail(error));
              }
              // Spotify 上で削除されたプレイリストは作り直す
              logger.info(`[playlist-sync] Playlist ${period.key} not found, recreating`);
              return createNewPlaylist(ctx, period, trackUris, description);
            }),
          ),
    ),
  );
};

const validationIssueSummary = (error: ValidationError): string =>
  error.issues[0]?.message ?? "unknown issue";

const syncUserSetupErrorMessage = (error: SyncUserSetupError): string => {
  switch (error.kind) {
    case "DatabaseError":
      return "database operation failed";
    case "RefreshTokenNotFound":
      return `no Spotify refresh token found for user ${error.userId}`;
    case "OAuthTokenCipherFailed":
      return "failed to decrypt or encrypt the stored refresh token";
    case "TokenRefreshRequestFailed":
      return "Spotify token refresh request failed";
    case "TokenRefreshRejected":
      return `Spotify token refresh rejected: ${error.status} ${error.statusText}`;
    case "ValidationError":
      return `invalid data at boundary: ${validationIssueSummary(error)}`;
    case "SpotifyApiError":
      return error.message;
    default:
      return assertNever(error);
  }
};

const syncPeriodErrorMessage = (error: SyncPeriodError): string => {
  switch (error.kind) {
    case "DatabaseError":
      return "database operation failed";
    case "ValidationError":
      return `invalid data at boundary: ${validationIssueSummary(error)}`;
    case "SpotifyApiError":
      return error.message;
    case "PlaylistNotFound":
      return `playlist ${error.playlistId} not found`;
    default:
      return assertNever(error);
  }
};

const syncUser = async (
  config: SyncConfig,
  db: Db,
  userId: UserId,
  now: Date,
): Promise<SyncResult> => {
  logger.info(`[playlist-sync] Syncing playlists for user ${userId}`);

  const setup = await Result.pipe(
    Result.do(),
    Result.bind("tokenContext", () => loadOAuthTokenContext(config.authSecret)),
    Result.bind("storedRefreshToken", ({ tokenContext }) =>
      getRefreshToken(db, userId, tokenContext),
    ),
    Result.bind("token", ({ storedRefreshToken }) =>
      refreshAccessToken({
        refreshToken: storedRefreshToken.token,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      }),
    ),
    Result.andThrough(({ token, storedRefreshToken, tokenContext }) =>
      saveRefreshTokenIfNeeded(db, userId, storedRefreshToken, token.newRefreshToken, tokenContext),
    ),
    Result.bind("sdk", ({ token }) =>
      Result.succeed(
        createSpotifyClient({ clientId: config.clientId, accessToken: token.accessToken }),
      ),
    ),
    Result.bind("allTracks", ({ sdk }) => fetchAllSavedTracks(sdk)),
  );

  if (Result.isFailure(setup)) {
    const message = syncUserSetupErrorMessage(setup.error);
    logger.error(`[playlist-sync] Failed to sync user ${userId}: ${message}`);
    return { kind: "failed", errorKind: setup.error.kind, message, failures: [] };
  }

  const { sdk, allTracks } = setup.value;
  logger.info(`[playlist-sync] Fetched ${allTracks.length} saved tracks for user ${userId}`);

  const ctx: SyncPeriodContext = { sdk, db, userId, appUrl: config.appUrl, now };

  const failures: SyncPeriodFailure[] = [];
  for (const period of SyncPeriod.all) {
    const result = await syncPeriodPlaylist(ctx, period, allTracks);
    if (Result.isFailure(result)) {
      const message = syncPeriodErrorMessage(result.error);
      failures.push({ periodKey: period.key, errorKind: result.error.kind, message });
      logger.error(
        `[playlist-sync] Failed to sync period ${period.key} for user ${userId}: ${message}`,
      );
    }
  }

  const syncedCount = SyncPeriod.all.length - failures.length;
  if (failures.length === 0) {
    return { kind: "success", syncedCount };
  }
  if (syncedCount > 0) {
    return { kind: "partial", syncedCount, failures };
  }
  return { kind: "failed", errorKind: "AllPeriodsFailed", message: "all periods failed", failures };
};

export const syncSingleUser = async (
  env: CloudflareEnv,
  userId: UserId,
  now: Date,
): Promise<SyncResult> => {
  const config = parseSyncConfig(env);
  if (Result.isFailure(config)) {
    const message = `invalid sync configuration: ${validationIssueSummary(config.error)}`;
    logger.error(`[playlist-sync] ${message}`);
    return { kind: "failed", errorKind: config.error.kind, message, failures: [] };
  }
  return syncUser(config.value, createDb(env.DB), userId, now);
};

export const syncAllUsers = async (env: CloudflareEnv, now: Date): Promise<BatchSyncResult> => {
  const config = parseSyncConfig(env);
  if (Result.isFailure(config)) {
    const message = `invalid sync configuration: ${validationIssueSummary(config.error)}`;
    logger.error(`[playlist-sync] ${message}`);
    return { kind: "failed", errorKind: config.error.kind, message, failures: [] };
  }

  const db = createDb(env.DB);
  const enabledUserIds = await getEnabledUserIds(db);
  if (Result.isFailure(enabledUserIds)) {
    const message =
      enabledUserIds.error.kind === "DatabaseError"
        ? "failed to load enabled users"
        : `invalid user data: ${validationIssueSummary(enabledUserIds.error)}`;
    logger.error(`[playlist-sync] ${message}`);
    return { kind: "failed", errorKind: enabledUserIds.error.kind, message, failures: [] };
  }

  if (enabledUserIds.value.length === 0) {
    logger.info("[playlist-sync] No users with sync enabled, skipping");
    return { kind: "success", syncedUserCount: 0 };
  }

  logger.info(`[playlist-sync] Starting playlist sync for ${enabledUserIds.value.length} user(s)`);

  const failures: UserSyncFailure[] = [];
  let syncedUserCount = 0;
  for (const userId of enabledUserIds.value) {
    const result = await syncUser(config.value, db, userId, now);
    if (result.kind === "failed") {
      failures.push({ userId, errorKind: result.errorKind, message: result.message });
    } else {
      syncedUserCount++;
    }
  }

  logger.info(`[playlist-sync] Complete: ${syncedUserCount} succeeded, ${failures.length} failed`);

  if (failures.length === 0) {
    return { kind: "success", syncedUserCount };
  }
  if (syncedUserCount > 0) {
    return { kind: "partial", syncedUserCount, failures };
  }
  return {
    kind: "failed",
    errorKind: "AllUsersFailed",
    message: `All ${failures.length} user(s) failed`,
    failures,
  };
};
