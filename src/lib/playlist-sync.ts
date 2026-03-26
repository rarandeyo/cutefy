import { z } from "zod";
import {
  createPlaylistFromTracks,
  fetchAllSavedTracks,
  filterTracksByDateRange,
  replacePlaylistTracks,
  updatePlaylistDetails,
  type DateRange,
} from "./spotify";
import { refreshAccessToken } from "./spotify-token";

const workerEnvSchema = z.object({
  NEXT_PUBLIC_SPOTIFY_CLIENT_ID: z.string().min(1),
  SPOTIFY_CLIENT_SECRET: z.string().min(1),
});

const SYNC_PERIODS = [
  { key: "1month", label: "1 Month", months: 1 },
  { key: "6months", label: "6 Months", months: 6 },
  { key: "1year", label: "1 Year", months: 12 },
] as const;

type SyncPeriod = (typeof SYNC_PERIODS)[number];

const buildPlaylistDescription = (): string => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const date = new Date().toISOString().slice(0, 10);
  return `Created by Cutefy (${appUrl}) · Updated at ${date}`;
};

const buildDateRange = (period: SyncPeriod): DateRange => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - period.months);
  return { startDate, endDate: now };
};

const getRefreshToken = async (db: D1Database, userId: string): Promise<string> => {
  const row = await db
    .prepare("SELECT refreshToken FROM account WHERE providerId = 'spotify' AND userId = ?")
    .bind(userId)
    .first<{ refreshToken: string }>();

  if (!row?.refreshToken) {
    throw new Error("No Spotify refresh token found in database");
  }

  return row.refreshToken;
};

const getPlaylistId = async (
  db: D1Database,
  userId: string,
  period: string,
): Promise<string | null> => {
  const row = await db
    .prepare("SELECT playlist_id FROM playlist_sync WHERE user_id = ? AND period = ?")
    .bind(userId, period)
    .first<{ playlist_id: string }>();

  return row?.playlist_id ?? null;
};

const savePlaylistId = async (
  db: D1Database,
  userId: string,
  period: string,
  playlistId: string,
): Promise<void> => {
  await db
    .prepare(
      "INSERT OR REPLACE INTO playlist_sync (user_id, period, playlist_id, updated_at) VALUES (?, ?, ?, ?)",
    )
    .bind(userId, period, playlistId, Date.now())
    .run();
};

const syncPeriod = async (
  accessToken: string,
  db: D1Database,
  userId: string,
  period: SyncPeriod,
  allTracks: Awaited<ReturnType<typeof fetchAllSavedTracks>>,
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
      await replacePlaylistTracks({ accessToken, playlistId: existingPlaylistId, trackUris });
      await updatePlaylistDetails({ accessToken, playlistId: existingPlaylistId, description });
      await savePlaylistId(db, userId, period.key, existingPlaylistId);
      console.log(`[playlist-sync] Updated playlist ${period.key}: ${trackUris.length} tracks`);
      return;
    } catch {
      // Playlist was deleted on Spotify, recreate it
      console.log(`[playlist-sync] Playlist ${period.key} not found, recreating`);
    }
  }

  const playlistName = `Cutefy ${period.label}`;
  const result = await createPlaylistFromTracks({
    accessToken,
    playlistName,
    trackUris,
    description,
  });
  await savePlaylistId(db, userId, period.key, result.playlistId);
  console.log(
    `[playlist-sync] Created playlist ${period.key} (${result.playlistId}): ${trackUris.length} tracks`,
  );
};

const getEnabledUserIds = async (db: D1Database): Promise<string[]> => {
  const { results } = await db
    .prepare("SELECT user_id FROM sync_settings WHERE enabled = 1")
    .all<{ user_id: string }>();

  return results.map((row) => row.user_id);
};

const syncUserPlaylists = async (
  env: CloudflareEnv,
  clientId: string,
  clientSecret: string,
  userId: string,
): Promise<void> => {
  console.log(`[playlist-sync] Syncing playlists for user ${userId}`);

  const refreshToken = await getRefreshToken(env.DB, userId);
  const { accessToken, newRefreshToken } = await refreshAccessToken(
    refreshToken,
    clientId,
    clientSecret,
  );

  // Update refresh token in DB if Spotify rotated it
  if (newRefreshToken) {
    await env.DB.prepare(
      "UPDATE account SET refreshToken = ? WHERE providerId = 'spotify' AND userId = ?",
    )
      .bind(newRefreshToken, userId)
      .run();
    console.log(`[playlist-sync] Refresh token rotated and updated for user ${userId}`);
  }

  const allTracks = await fetchAllSavedTracks(accessToken);
  console.log(`[playlist-sync] Fetched ${allTracks.length} saved tracks for user ${userId}`);

  for (const period of SYNC_PERIODS) {
    try {
      await syncPeriod(accessToken, env.DB, userId, period, allTracks);
    } catch (err) {
      console.error(`[playlist-sync] Failed to sync period ${period.key} for user ${userId}:`, err);
    }
  }
};

export const updatePlaylists = async (
  env: CloudflareEnv,
  { skipEnabledCheck = false, userId }: { skipEnabledCheck?: boolean; userId?: string } = {},
): Promise<void> => {
  const { NEXT_PUBLIC_SPOTIFY_CLIENT_ID: clientId, SPOTIFY_CLIENT_SECRET: clientSecret } =
    workerEnvSchema.parse(env);

  // When called from the API with a specific userId, sync only that user
  if (skipEnabledCheck && userId) {
    await syncUserPlaylists(env, clientId, clientSecret, userId);
    return;
  }

  // Cron path: sync all enabled users
  const enabledUserIds = await getEnabledUserIds(env.DB);
  if (enabledUserIds.length === 0) {
    console.log("[playlist-sync] No users with sync enabled, skipping");
    return;
  }

  console.log(`[playlist-sync] Starting playlist sync for ${enabledUserIds.length} user(s)`);

  for (const uid of enabledUserIds) {
    try {
      await syncUserPlaylists(env, clientId, clientSecret, uid);
    } catch (err) {
      console.error(`[playlist-sync] Failed to sync user ${uid}:`, err);
    }
  }

  console.log("[playlist-sync] Playlist sync complete");
};
