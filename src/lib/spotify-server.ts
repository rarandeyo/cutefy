import "server-only";

import { headers } from "next/headers";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getAuth } from "./auth";
import { env } from "./env.server";
import { createSpotifyClient } from "./spotify";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export const getSpotifyClientForCurrentUser = async (): Promise<{
  sdk: SpotifyApi;
  userId: string;
}> => {
  const auth = await getAuth();
  const requestHeaders = await headers();

  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    throw new UnauthorizedError();
  }

  const token = await auth.api.getAccessToken({
    body: { providerId: "spotify", userId: session.user.id },
    headers: requestHeaders,
  });

  if (!token?.accessToken) {
    throw new UnauthorizedError("Spotify access token unavailable");
  }

  const sdk = createSpotifyClient({
    clientId: env.SPOTIFY_CLIENT_ID,
    accessToken: token.accessToken,
  });

  return { sdk, userId: session.user.id };
};
