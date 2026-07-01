import "server-only";

import { headers } from "next/headers";
import { Result } from "@praha/byethrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getCurrentUserId, type CurrentUserIdError } from "@/shared/lib/auth/current-user";
import { getAuth } from "@/shared/lib/auth/server";
import { env } from "@/shared/lib/env/server";
import { Sensitive } from "@/shared/lib/sensitive";
import type { UserId } from "@/shared/types/user-id";
import { createSpotifyClient } from "./client";

export type SpotifyClientContext = Readonly<{
  sdk: SpotifyApi;
  userId: UserId;
}>;

type AccessTokenUnavailableError = Readonly<{ kind: "AccessTokenUnavailable"; cause: unknown }>;

export type SpotifyClientError = CurrentUserIdError | AccessTokenUnavailableError;

type Auth = Awaited<ReturnType<typeof getAuth>>;

const getSpotifyAccessToken = (
  auth: Auth,
  requestHeaders: Headers,
  userId: UserId,
): Result.ResultAsync<Sensitive<string>, AccessTokenUnavailableError> =>
  Result.pipe(
    Result.try({
      try: () =>
        auth.api.getAccessToken({
          body: { providerId: "spotify", userId },
          headers: requestHeaders,
        }),
      catch: (cause): AccessTokenUnavailableError => ({ kind: "AccessTokenUnavailable", cause }),
    }),
    Result.andThen(
      (token): Result.Result<Sensitive<string>, AccessTokenUnavailableError> =>
        token?.accessToken
          ? Result.succeed(Sensitive.of(token.accessToken))
          : Result.fail({ kind: "AccessTokenUnavailable", cause: undefined }),
    ),
  );

export const getSpotifyClientForCurrentUser = async (): Result.ResultAsync<
  SpotifyClientContext,
  SpotifyClientError
> => {
  const auth = await getAuth();
  const requestHeaders = await headers();

  return Result.pipe(
    Result.do(),
    Result.bind("userId", () => getCurrentUserId(auth, requestHeaders)),
    Result.bind("accessToken", ({ userId }) => getSpotifyAccessToken(auth, requestHeaders, userId)),
    Result.map(
      ({ userId, accessToken }): SpotifyClientContext => ({
        sdk: createSpotifyClient({ clientId: env.SPOTIFY_CLIENT_ID, accessToken }),
        userId,
      }),
    ),
  );
};
