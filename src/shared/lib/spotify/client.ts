import { type AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { Sensitive } from "@/shared/lib/sensitive";

const SPOTIFY_TOKEN_EXPIRES_IN_SECONDS = 3600;

type CreateSpotifyClientParams = Readonly<{
  clientId: string;
  accessToken: Sensitive<string>;
  refreshToken?: Sensitive<string>;
}>;

export const createSpotifyClient = ({
  clientId,
  accessToken,
  refreshToken,
}: CreateSpotifyClientParams): SpotifyApi => {
  const token: AccessToken = {
    access_token: accessToken.unwrap(),
    token_type: "Bearer",
    expires_in: SPOTIFY_TOKEN_EXPIRES_IN_SECONDS,
    refresh_token: refreshToken?.unwrap() ?? "",
  };
  return SpotifyApi.withAccessToken(clientId, token);
};
