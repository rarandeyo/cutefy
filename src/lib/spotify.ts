import { type AccessToken, type SavedTrack, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { z } from "zod";
import { clientEnv } from "./env";

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type TrackWithAddedAt = {
  id: string;
  name: string;
  uri: string;
  artists: string;
  albumName: string;
  albumImageUrl: string | undefined;
  addedAt: Date;
};

export type FetchProgress = {
  loaded: number;
  total: number;
};

const createSpotifyClient = (accessToken: string, refreshToken?: string): SpotifyApi => {
  const token: AccessToken = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken ?? "",
  };
  return SpotifyApi.withAccessToken(clientEnv.NEXT_PUBLIC_SPOTIFY_CLIENT_ID, token);
};

const mapSavedTrackToTrackWithAddedAt = (item: SavedTrack): TrackWithAddedAt => ({
  id: item.track.id,
  name: item.track.name,
  uri: item.track.uri,
  artists: item.track.artists.map((a) => a.name).join(", "),
  albumName: item.track.album.name,
  albumImageUrl: item.track.album.images[0]?.url,
  addedAt: new Date(item.added_at),
});

export const fetchAllSavedTracks = async (
  accessToken: string,
  onProgress?: (progress: FetchProgress) => void,
): Promise<TrackWithAddedAt[]> => {
  const sdk = createSpotifyClient(accessToken);
  const allTracks: TrackWithAddedAt[] = [];
  const LIMIT = 50;
  let offset = 0;
  let total = 0;

  do {
    const response = await sdk.currentUser.tracks.savedTracks(LIMIT, offset);
    const mappedTracks = response.items.map(mapSavedTrackToTrackWithAddedAt);
    allTracks.push(...mappedTracks);
    total = response.total;
    offset += LIMIT;
    onProgress?.({ loaded: allTracks.length, total });
  } while (offset < total);

  return allTracks;
};

export const filterTracksByDateRange = (
  tracks: TrackWithAddedAt[],
  dateRange: DateRange,
): TrackWithAddedAt[] =>
  tracks.filter(
    (track) => track.addedAt >= dateRange.startDate && track.addedAt <= dateRange.endDate,
  );

type SpotifyFetchParams = {
  accessToken: string;
  url: string;
  options?: RequestInit;
};

const spotifyFetch = async ({
  accessToken,
  url,
  options,
}: SpotifyFetchParams): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => null);
    const errorMessage =
      errorBody !== null &&
      typeof errorBody === "object" &&
      "error" in errorBody &&
      errorBody.error !== null &&
      typeof errorBody.error === "object" &&
      "message" in errorBody.error &&
      typeof errorBody.error.message === "string"
        ? errorBody.error.message
        : response.statusText;
    throw new Error(`Spotify API error: ${response.status} ${errorMessage}`);
  }
  return response;
};

const playlistResponseSchema = z.object({
  id: z.string(),
  external_urls: z.object({
    spotify: z.string(),
  }),
});

type CreatePlaylistParams = {
  accessToken: string;
  playlistName: string;
  trackUris: string[];
  visibility?: "public" | "private";
};

export const createPlaylistFromTracks = async ({
  accessToken,
  playlistName,
  trackUris,
  visibility = "private",
}: CreatePlaylistParams): Promise<{ playlistId: string; playlistUrl: string }> => {
  // Use /me/playlists instead of /users/{user_id}/playlists (required for Dev Mode since Feb 2026)
  const playlistResponse = await spotifyFetch({
    accessToken,
    url: "https://api.spotify.com/v1/me/playlists",
    options: {
      method: "POST",
      body: JSON.stringify({
        name: playlistName,
        public: visibility === "public",
        description: `Created with Cutefy on ${new Date().toLocaleDateString()}`,
      }),
    },
  });
  const rawPlaylist = await playlistResponse.json();
  const playlist = playlistResponseSchema.parse(rawPlaylist);

  // Use /playlists/{id}/items instead of /playlists/{id}/tracks (required for Dev Mode since Feb 2026)
  const BATCH_SIZE = 100;
  for (let i = 0; i < trackUris.length; i += BATCH_SIZE) {
    const batch = trackUris.slice(i, i + BATCH_SIZE);
    await spotifyFetch({
      accessToken,
      url: `https://api.spotify.com/v1/playlists/${playlist.id}/items`,
      options: {
        method: "POST",
        body: JSON.stringify({ uris: batch }),
      },
    });
  }

  return {
    playlistId: playlist.id,
    playlistUrl: playlist.external_urls.spotify,
  };
};

type ReplacePlaylistTracksParams = {
  accessToken: string;
  playlistId: string;
  trackUris: string[];
};

export const replacePlaylistTracks = async ({
  accessToken,
  playlistId,
  trackUris,
}: ReplacePlaylistTracksParams): Promise<void> => {
  const BATCH_SIZE = 100;
  const firstBatch = trackUris.slice(0, BATCH_SIZE);

  // Use /items instead of /tracks (required for Dev Mode since Feb 2026)
  await spotifyFetch({
    accessToken,
    url: `https://api.spotify.com/v1/playlists/${playlistId}/items`,
    options: {
      method: "PUT",
      body: JSON.stringify({ uris: firstBatch }),
    },
  });

  // POST remaining batches
  for (let i = BATCH_SIZE; i < trackUris.length; i += BATCH_SIZE) {
    const batch = trackUris.slice(i, i + BATCH_SIZE);
    await spotifyFetch({
      accessToken,
      url: `https://api.spotify.com/v1/playlists/${playlistId}/items`,
      options: {
        method: "POST",
        body: JSON.stringify({ uris: batch }),
      },
    });
  }
};
