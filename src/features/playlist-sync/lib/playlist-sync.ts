import { and, eq } from "drizzle-orm";
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
import { clientEnv } from "@/shared/lib/env/client";
import { env as serverEnv } from "@/shared/lib/env/server";
import { createDb, type Db } from "@/shared/lib/db";
import { account, playlistSync, syncSettings } from "@/shared/lib/db/schema";
import { refreshAccessToken } from "@/shared/lib/spotify/token";
import {
  createPlaylistId,
  createUserId,
  type PlaylistId,
  type UserId,
} from "@/shared/types/brands";
import { errorMessage, isError } from "@/shared/lib/error";

// Spotify SDK throws plain Error with "Unrecognised response code: 404 ..." for deleted playlists
const isSpotifyNotFound = (err: unknown): boolean =>
  isError(err) && err.message.includes("response code: 404");

export type SyncResult =
  | { status: "success"; syncedCount: number }
  | { status: "partial"; syncedCount: number; message: string }
  | { status: "failed"; message: string };

type SyncPeriod = {
  key: string;
  label: string;
  months: number;
};

const SYNC_PERIODS = [
  { key: "1month", label: "1 Month", months: 1 },
  { key: "3months", label: "3 Months", months: 3 },
  { key: "6months", label: "6 Months", months: 6 },
  { key: "1year", label: "1 Year", months: 12 },
] as const satisfies readonly SyncPeriod[];

const buildPlaylistDescription = (): string => {
  const date = new Date().toISOString().slice(0, 10);
  return `Created by Cutefy (${clientEnv.NEXT_PUBLIC_APP_URL}) · Updated at ${date}`;
};

const buildDateRange = (period: SyncPeriod): DateRange => {
  const now = new Date();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - period.months,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );
  return { startDate, endDate: now };
};

const getRefreshToken = async (db: Db, userId: UserId): Promise<string> => {
  const row = await db
    .select({ refreshToken: account.refreshToken })
    .from(account)
    .where(and(eq(account.providerId, "spotify"), eq(account.userId, userId)))
    .get();

  if (!row?.refreshToken) {
    throw new Error("No Spotify refresh token found in database");
  }

  return row.refreshToken;
};

const getPlaylistId = async (
  db: Db,
  userId: UserId,
  period: string,
): Promise<PlaylistId | null> => {
  const row = await db
    .select({ playlistId: playlistSync.playlistId })
    .from(playlistSync)
    .where(and(eq(playlistSync.userId, userId), eq(playlistSync.period, period)))
    .get();

  return row?.playlistId ? createPlaylistId(row.playlistId) : null;
};

const savePlaylistId = async (
  db: Db,
  userId: UserId,
  period: string,
  playlistId: PlaylistId,
): Promise<void> => {
  await db
    .insert(playlistSync)
    .values({ userId, period, playlistId, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: [playlistSync.userId, playlistSync.period],
      set: { playlistId, updatedAt: Date.now() },
    });
};

const syncPeriod = async (
  sdk: SpotifyApi,
  db: Db,
  userId: UserId,
  period: SyncPeriod,
  allTracks: readonly TrackWithAddedAt[],
): Promise<void> => {
  const dateRange = buildDateRange(period);
  const filteredTracks = filterTracksByDateRange(allTracks, dateRange);
  const trackUris = filteredTracks.toReversed().map((t) => t.uri);

  if (trackUris.length === 0) {
    console.log(`[playlist-sync] No tracks for period ${period.key}, skipping`);
    return;
  }

  const existingPlaylistId = await getPlaylistId(db, userId, period.key);

  const description = buildPlaylistDescription();

  if (existingPlaylistId) {
    try {
      await replacePlaylistTracks({ sdk, playlistId: existingPlaylistId, trackUris });
      await updatePlaylistDetails({ sdk, playlistId: existingPlaylistId, description });
      await savePlaylistId(db, userId, period.key, existingPlaylistId);
      console.log(`[playlist-sync] Updated playlist ${period.key}: ${trackUris.length} tracks`);
      return;
    } catch (err) {
      if (!isSpotifyNotFound(err)) throw err;
      console.log(`[playlist-sync] Playlist ${period.key} not found, recreating`);
    }
  }

  const playlistName = `Cutefy ${period.label}`;
  const result = await createPlaylistFromTracks({
    sdk,
    playlistName,
    trackUris,
    description,
  });
  await savePlaylistId(db, userId, period.key, result.playlistId);
  console.log(
    `[playlist-sync] Created playlist ${period.key} (${result.playlistId}): ${trackUris.length} tracks`,
  );
};

const getEnabledUserIds = async (db: Db): Promise<readonly UserId[]> => {
  const rows = await db
    .select({ userId: syncSettings.userId })
    .from(syncSettings)
    .where(eq(syncSettings.enabled, 1))
    .all();

  return rows.map((row) => createUserId(row.userId));
};

const syncUserPlaylists = async (
  db: Db,
  clientId: string,
  clientSecret: string,
  userId: UserId,
): Promise<SyncResult> => {
  console.log(`[playlist-sync] Syncing playlists for user ${userId}`);

  const refreshToken = await getRefreshToken(db, userId);
  const { accessToken, newRefreshToken } = await refreshAccessToken({
    refreshToken,
    clientId,
    clientSecret,
  });

  if (newRefreshToken) {
    await db
      .update(account)
      .set({ refreshToken: newRefreshToken })
      .where(and(eq(account.providerId, "spotify"), eq(account.userId, userId)));
    console.log(`[playlist-sync] Refresh token rotated and updated for user ${userId}`);
  }

  const sdk = createSpotifyClient({ clientId, accessToken });
  const allTracks = await fetchAllSavedTracks(sdk);
  console.log(`[playlist-sync] Fetched ${allTracks.length} saved tracks for user ${userId}`);

  const errors: string[] = [];
  let syncedCount = 0;

  for (const period of SYNC_PERIODS) {
    try {
      await syncPeriod(sdk, db, userId, period, allTracks);
      syncedCount++;
    } catch (err) {
      const msg = errorMessage(err, "unknown error");
      errors.push(`${period.key}: ${msg}`);
      console.error(
        `[playlist-sync] Failed to sync period ${period.key} for user ${userId}: ${msg}`,
      );
    }
  }

  if (errors.length === 0) {
    return { status: "success", syncedCount };
  }
  if (syncedCount > 0) {
    return { status: "partial", syncedCount, message: errors.join("; ") };
  }
  return { status: "failed", message: errors.join("; ") };
};

type UpdatePlaylistsOptions = { mode: "single"; userId: UserId } | { mode: "batch" };

export const updatePlaylists = async (
  env: CloudflareEnv,
  options: UpdatePlaylistsOptions = { mode: "batch" },
): Promise<SyncResult> => {
  const db = createDb(env.DB);
  const clientId = serverEnv.SPOTIFY_CLIENT_ID;
  const clientSecret = serverEnv.SPOTIFY_CLIENT_SECRET;

  if (options.mode === "single") {
    return syncUserPlaylists(db, clientId, clientSecret, options.userId);
  }

  const enabledUserIds = await getEnabledUserIds(db);
  if (enabledUserIds.length === 0) {
    console.log("[playlist-sync] No users with sync enabled, skipping");
    return { status: "success", syncedCount: 0 };
  }

  console.log(`[playlist-sync] Starting playlist sync for ${enabledUserIds.length} user(s)`);

  let syncedUsers = 0;
  let failedUsers = 0;
  for (const uid of enabledUserIds) {
    try {
      const result = await syncUserPlaylists(db, clientId, clientSecret, uid);
      if (result.status === "failed") {
        failedUsers++;
      } else {
        syncedUsers++;
      }
    } catch (err) {
      failedUsers++;
      console.error(
        `[playlist-sync] Failed to sync user ${uid}: ${errorMessage(err, "unknown error")}`,
      );
    }
  }

  console.log(`[playlist-sync] Complete: ${syncedUsers} succeeded, ${failedUsers} failed`);

  if (failedUsers === 0) {
    return { status: "success", syncedCount: syncedUsers };
  }
  if (syncedUsers > 0) {
    return {
      status: "partial",
      syncedCount: syncedUsers,
      message: `${failedUsers} user(s) failed`,
    };
  }
  return { status: "failed", message: `All ${failedUsers} user(s) failed` };
};
