import { type AccessToken, type SavedTrack, SpotifyApi } from "@spotify/web-api-ts-sdk";

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";

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

const createSpotifyClient = (accessToken: string, refreshToken?: string): SpotifyApi => {
  const token: AccessToken = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken ?? "",
  };
  return SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID, token);
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

export const fetchAllSavedTracks = async (accessToken: string): Promise<TrackWithAddedAt[]> => {
  const sdk = createSpotifyClient(accessToken);
  const allTracks: TrackWithAddedAt[] = [];
  const limit = 50;
  let offset = 0;
  let total = 0;

  do {
    const response = await sdk.currentUser.tracks.savedTracks(limit, offset);
    const mappedTracks = response.items.map(mapSavedTrackToTrackWithAddedAt);
    allTracks.push(...mappedTracks);
    total = response.total;
    offset += limit;
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

const spotifyFetch = async (
  accessToken: string,
  url: string,
  options?: RequestInit,
): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Spotify API error: ${response.status} ${error?.error?.message ?? response.statusText}`,
    );
  }
  return response;
};

export const createPlaylistFromTracks = async (
  accessToken: string,
  playlistName: string,
  trackUris: string[],
  isPublic = false,
): Promise<{ playlistId: string; playlistUrl: string }> => {
  // Use /me/playlists instead of /users/{user_id}/playlists (required for Dev Mode since Feb 2026)
  const playlistResponse = await spotifyFetch(
    accessToken,
    "https://api.spotify.com/v1/me/playlists",
    {
      method: "POST",
      body: JSON.stringify({
        name: playlistName,
        public: isPublic,
        description: `Created with Spotify Playlist Creator on ${new Date().toLocaleDateString()}`,
      }),
    },
  );
  const playlist = await playlistResponse.json();

  // Use /playlists/{id}/items instead of /playlists/{id}/tracks (required for Dev Mode since Feb 2026)
  const batchSize = 100;
  for (let i = 0; i < trackUris.length; i += batchSize) {
    const batch = trackUris.slice(i, i + batchSize);
    await spotifyFetch(
      accessToken,
      `https://api.spotify.com/v1/playlists/${playlist.id}/items`,
      {
        method: "POST",
        body: JSON.stringify({ uris: batch }),
      },
    );
  }

  return {
    playlistId: playlist.id,
    playlistUrl: playlist.external_urls.spotify,
  };
};
