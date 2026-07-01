import { errorMessage, isError } from "@/shared/lib/error";

export type SpotifyApiError = Readonly<{
  kind: "SpotifyApiError";
  message: string;
  cause: unknown;
}>;

export const SpotifyApiError = {
  of: (cause: unknown): SpotifyApiError => ({
    kind: "SpotifyApiError",
    message: errorMessage(cause, "Spotify API request failed"),
    cause,
  }),
  // Spotify SDK は削除済みプレイリストに対し "Unrecognised response code: 404 ..." を含む素の Error を投げる
  isNotFound: (cause: unknown): boolean =>
    isError(cause) && cause.message.includes("response code: 404"),
} as const;
