import { z } from "zod";
import {
  createPlaylistFromTracks,
  fetchAllSavedTracks,
  filterTracksByDateRange,
  replacePlaylistTracks,
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

const buildDateRange = (period: SyncPeriod): DateRange => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - period.months);
  return { startDate, endDate: now };
};

const getRefreshToken = async (db: D1Database): Promise<string> => {
  const row = await db
    .prepare("SELECT refreshToken FROM account WHERE providerId = 'spotify' LIMIT 1")
    .first<{ refreshToken: string }>();

  if (!row?.refreshToken) {
    throw new Error("No Spotify refresh token found in database");
  }

  return row.refreshToken;
};

const getPlaylistId = async (db: D1Database, period: string): Promise<string | null> => {
  const row = await db
    .prepare("SELECT playlist_id FROM playlist_sync WHERE period = ?")
    .bind(period)
    .first<{ playlist_id: string }>();

  return row?.playlist_id ?? null;
};

const savePlaylistId = async (
  db: D1Database,
  period: string,
  playlistId: string,
): Promise<void> => {
  await db
    .prepare(
      "INSERT OR REPLACE INTO playlist_sync (period, playlist_id, updated_at) VALUES (?, ?, ?)",
    )
    .bind(period, playlistId, Date.now())
    .run();
};

const syncPeriod = async (
  accessToken: string,
  db: D1Database,
  period: SyncPeriod,
  allTracks: Awaited<ReturnType<typeof fetchAllSavedTracks>>,
): Promise<void> => {
  const dateRange = buildDateRange(period);
  const filteredTracks = filterTracksByDateRange(allTracks, dateRange);
  const trackUris = filteredTracks.map((t) => t.uri);

  if (trackUris.length === 0) {
    console.log(`[playlist-sync] No tracks for period ${period.key}, skipping`);
    return;
  }

  const existingPlaylistId = await getPlaylistId(db, period.key);

  if (existingPlaylistId) {
    await replacePlaylistTracks({ accessToken, playlistId: existingPlaylistId, trackUris });
    await savePlaylistId(db, period.key, existingPlaylistId);
    console.log(`[playlist-sync] Updated playlist ${period.key}: ${trackUris.length} tracks`);
  } else {
    const playlistName = `Cutefy ${period.label}`;
    const result = await createPlaylistFromTracks({
      accessToken,
      playlistName,
      trackUris,
    });
    await savePlaylistId(db, period.key, result.playlistId);
    console.log(
      `[playlist-sync] Created playlist ${period.key} (${result.playlistId}): ${trackUris.length} tracks`,
    );
  }
};

export const updatePlaylists = async (env: CloudflareEnv): Promise<void> => {
  console.log("[playlist-sync] Starting playlist sync");

  const refreshToken = await getRefreshToken(env.DB);

  const { NEXT_PUBLIC_SPOTIFY_CLIENT_ID: clientId, SPOTIFY_CLIENT_SECRET: clientSecret } =
    workerEnvSchema.parse(env);

  const { accessToken, newRefreshToken } = await refreshAccessToken(
    refreshToken,
    clientId,
    clientSecret,
  );

  // Update refresh token in DB if Spotify rotated it
  if (newRefreshToken) {
    await env.DB.prepare("UPDATE account SET refreshToken = ? WHERE providerId = 'spotify'")
      .bind(newRefreshToken)
      .run();
    console.log("[playlist-sync] Refresh token rotated and updated in DB");
  }

  const allTracks = await fetchAllSavedTracks(accessToken);
  console.log(`[playlist-sync] Fetched ${allTracks.length} saved tracks`);

  for (const period of SYNC_PERIODS) {
    try {
      await syncPeriod(accessToken, env.DB, period, allTracks);
    } catch (err) {
      console.error(`[playlist-sync] Failed to sync period ${period.key}:`, err);
    }
  }

  console.log("[playlist-sync] Playlist sync complete");
};
