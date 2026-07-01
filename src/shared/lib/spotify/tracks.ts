import { Result } from "@praha/byethrow";
import { z } from "zod";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { chunk } from "@/shared/lib/chunk";
import { schemaParse, type ValidationError } from "@/shared/lib/validation";
import { SpotifyTrackId } from "@/shared/types/spotify-track-id";
import { SpotifyTrackUri } from "@/shared/types/spotify-track-uri";
import { SpotifyApiError } from "./spotify-api-error";

const SAVED_TRACKS_PAGE_SIZE = 50;
const FETCH_CONCURRENCY = 10;

export type DateRange = Readonly<{
  startDate: Date;
  endDate: Date;
}>;

export type TrackWithAddedAt = Readonly<{
  id: SpotifyTrackId;
  name: string;
  uri: SpotifyTrackUri;
  artists: string;
  albumName: string;
  albumImageUrl: string | undefined;
  addedAt: Date;
}>;

const savedTrackSchema = z
  .object({
    added_at: z.coerce.date(),
    track: z.object({
      id: SpotifyTrackId.schema,
      name: z.string(),
      uri: SpotifyTrackUri.schema,
      artists: z.array(z.object({ name: z.string() })),
      album: z.object({
        name: z.string(),
        images: z.array(z.object({ url: z.url() })),
      }),
    }),
  })
  .transform(
    (item): TrackWithAddedAt => ({
      id: item.track.id,
      name: item.track.name,
      uri: item.track.uri,
      artists: item.track.artists.map((artist) => artist.name).join(", "),
      albumName: item.track.album.name,
      albumImageUrl: item.track.album.images[0]?.url,
      addedAt: item.added_at,
    }),
  );

const savedTracksPageSchema = z.object({
  total: z.number(),
  items: z.array(savedTrackSchema),
});

type SavedTracksPage = z.output<typeof savedTracksPageSchema>;

const parseSavedTracksPage = schemaParse(savedTracksPageSchema);

export type FetchSavedTracksError = SpotifyApiError | ValidationError;

const fetchPage =
  (sdk: SpotifyApi) =>
  (offset: number): Result.ResultAsync<SavedTracksPage, FetchSavedTracksError> =>
    Result.pipe(
      Result.try({
        try: () => sdk.currentUser.tracks.savedTracks(SAVED_TRACKS_PAGE_SIZE, offset),
        catch: SpotifyApiError.of,
      }),
      Result.andThen(parseSavedTracksPage),
    );

const remainingOffsets = (total: number): readonly number[] =>
  Array.from(
    { length: Math.max(0, Math.ceil(total / SAVED_TRACKS_PAGE_SIZE) - 1) },
    (_, i) => (i + 1) * SAVED_TRACKS_PAGE_SIZE,
  );

// レート制限を避けるため FETCH_CONCURRENCY 件ずつのバッチで取得する
const fetchRemainingPages = async (
  sdk: SpotifyApi,
  total: number,
): Result.ResultAsync<readonly SavedTracksPage[], FetchSavedTracksError> => {
  const results: Result.Result<SavedTracksPage, FetchSavedTracksError>[] = [];
  for (const offsets of chunk(remainingOffsets(total), FETCH_CONCURRENCY)) {
    results.push(...(await Promise.all(offsets.map(fetchPage(sdk)))));
  }
  return Result.sequence(results);
};

export const fetchAllSavedTracks = (
  sdk: SpotifyApi,
): Result.ResultAsync<readonly TrackWithAddedAt[], FetchSavedTracksError> =>
  Result.pipe(
    fetchPage(sdk)(0),
    Result.andThen(async (firstPage) =>
      Result.pipe(
        await fetchRemainingPages(sdk, firstPage.total),
        Result.map((pages) => [firstPage, ...pages].flatMap((page) => page.items)),
      ),
    ),
  );

export const filterTracksByDateRange = (
  tracks: readonly TrackWithAddedAt[],
  dateRange: DateRange,
): readonly TrackWithAddedAt[] =>
  tracks.filter(
    (track) => track.addedAt >= dateRange.startDate && track.addedAt <= dateRange.endDate,
  );
