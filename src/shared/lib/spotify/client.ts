import { type AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk";

const SPOTIFY_TOKEN_EXPIRES_IN_SECONDS = 3600;

type CreateSpotifyClientParams = {
  clientId: string;
  accessToken: string;
  refreshToken?: string;
};

export const createSpotifyClient = ({
  clientId,
  accessToken,
  refreshToken,
}: CreateSpotifyClientParams): SpotifyApi => {
  const token: AccessToken = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: SPOTIFY_TOKEN_EXPIRES_IN_SECONDS,
    refresh_token: refreshToken ?? "",
  };
  return SpotifyApi.withAccessToken(clientId, token);
};
