declare const userIdBrand: unique symbol;
declare const playlistIdBrand: unique symbol;
declare const spotifyTrackIdBrand: unique symbol;
declare const spotifyTrackUriBrand: unique symbol;
declare const syncPeriodKeyBrand: unique symbol;

export type UserId = string & { readonly [userIdBrand]: unknown };
export type PlaylistId = string & { readonly [playlistIdBrand]: unknown };
export type SpotifyTrackId = string & { readonly [spotifyTrackIdBrand]: unknown };
export type SpotifyTrackUri = string & { readonly [spotifyTrackUriBrand]: unknown };
export type SyncPeriodKey = string & { readonly [syncPeriodKeyBrand]: unknown };

// brand 持ち上げは境界 1 箇所のみで `as` を許容する (type-traps.md §1.5)
// oxlint-disable typescript/consistent-type-assertions
export const createUserId = (s: string): UserId => s as UserId;
export const createPlaylistId = (s: string): PlaylistId => s as PlaylistId;
export const createSpotifyTrackId = (s: string): SpotifyTrackId => s as SpotifyTrackId;
export const createSpotifyTrackUri = (s: string): SpotifyTrackUri => s as SpotifyTrackUri;
export const createSyncPeriodKey = (s: string): SyncPeriodKey => s as SyncPeriodKey;
// oxlint-enable typescript/consistent-type-assertions
