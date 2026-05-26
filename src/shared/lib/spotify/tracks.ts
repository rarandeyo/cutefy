import type { SavedTrack, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSpotifyTrackUri, type SpotifyTrackUri } from "@/shared/types/brands";

const SAVED_TRACKS_PAGE_SIZE = 50;

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type TrackWithAddedAt = {
  id: string;
  name: string;
  uri: SpotifyTrackUri;
  artists: string;
  albumName: string;
  albumImageUrl: string | undefined;
  addedAt: Date;
};

const mapSavedTrackToTrackWithAddedAt = (item: SavedTrack): TrackWithAddedAt => ({
  id: item.track.id,
  name: item.track.name,
  uri: createSpotifyTrackUri(item.track.uri),
  artists: item.track.artists.map((a) => a.name).join(", "),
  albumName: item.track.album.name,
  albumImageUrl: item.track.album.images[0]?.url,
  addedAt: new Date(item.added_at),
});

export const fetchAllSavedTracks = async (
  sdk: SpotifyApi,
): Promise<readonly TrackWithAddedAt[]> => {
  const fetchPage = (offset: number) =>
    sdk.currentUser.tracks.savedTracks(SAVED_TRACKS_PAGE_SIZE, offset);

  const firstPage = await fetchPage(0);
  const remainingPageCount = Math.ceil(firstPage.total / SAVED_TRACKS_PAGE_SIZE) - 1;
  const remainingPages = await Promise.all(
    Array.from({ length: remainingPageCount }, (_, i) =>
      fetchPage((i + 1) * SAVED_TRACKS_PAGE_SIZE),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) =>
    page.items.map(mapSavedTrackToTrackWithAddedAt),
  );
};

export const filterTracksByDateRange = (
  tracks: readonly TrackWithAddedAt[],
  dateRange: DateRange,
): readonly TrackWithAddedAt[] =>
  tracks.filter(
    (track) => track.addedAt >= dateRange.startDate && track.addedAt <= dateRange.endDate,
  );
