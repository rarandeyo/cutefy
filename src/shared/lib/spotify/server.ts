import "server-only";

import { headers } from "next/headers";
import { Result } from "@praha/byethrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getAuth } from "@/shared/lib/auth/server";
import { env } from "@/shared/lib/env/server";
import { Sensitive } from "@/shared/lib/sensitive";
import { UserId } from "@/shared/types/user-id";
import { createSpotifyClient } from "./client";

export type SpotifyClientContext = Readonly<{
  sdk: SpotifyApi;
  userId: UserId;
}>;

export type SpotifyClientError =
  | Readonly<{ kind: "SessionNotFound" }>
  | Readonly<{ kind: "AccessTokenUnavailable"; cause: unknown }>
  | Readonly<{ kind: "AuthServiceError"; cause: unknown }>;

type Auth = Awaited<ReturnType<typeof getAuth>>;
type Session = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;

const getSession = (
  auth: Auth,
  requestHeaders: Headers,
): Result.ResultAsync<Session, SpotifyClientError> =>
  Result.pipe(
    Result.try({
      try: () => auth.api.getSession({ headers: requestHeaders }),
      catch: (cause): SpotifyClientError => ({ kind: "AuthServiceError", cause }),
    }),
    Result.andThen(
      (session): Result.Result<Session, SpotifyClientError> =>
        session ? Result.succeed(session) : Result.fail({ kind: "SessionNotFound" }),
    ),
  );

const getSpotifyAccessToken = (
  auth: Auth,
  requestHeaders: Headers,
  userId: UserId,
): Result.ResultAsync<Sensitive<string>, SpotifyClientError> =>
  Result.pipe(
    Result.try({
      try: () =>
        auth.api.getAccessToken({
          body: { providerId: "spotify", userId },
          headers: requestHeaders,
        }),
      catch: (cause): SpotifyClientError => ({ kind: "AccessTokenUnavailable", cause }),
    }),
    Result.andThen(
      (token): Result.Result<Sensitive<string>, SpotifyClientError> =>
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
    Result.bind("session", () => getSession(auth, requestHeaders)),
    Result.bind("userId", ({ session }) =>
      Result.pipe(
        UserId.parse(session.user.id),
        Result.mapError((cause): SpotifyClientError => ({ kind: "AuthServiceError", cause })),
      ),
    ),
    Result.bind("accessToken", ({ userId }) => getSpotifyAccessToken(auth, requestHeaders, userId)),
    Result.map(
      ({ userId, accessToken }): SpotifyClientContext => ({
        sdk: createSpotifyClient({ clientId: env.SPOTIFY_CLIENT_ID, accessToken }),
        userId,
      }),
    ),
  );
};
