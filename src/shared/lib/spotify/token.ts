import { Result } from "@praha/byethrow";
import { z } from "zod";
import { type Sensitive, sensitiveString } from "@/shared/lib/sensitive";
import { schemaParse, type ValidationError } from "@/shared/lib/validation";

const tokenResponseSchema = z.object({
  access_token: sensitiveString,
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: sensitiveString.optional(),
});

const parseTokenResponse = schemaParse(tokenResponseSchema);

export type TokenRefreshResult = Readonly<{
  accessToken: Sensitive<string>;
  newRefreshToken: Sensitive<string> | undefined;
}>;

export type TokenRefreshError =
  | Readonly<{ kind: "TokenRefreshRequestFailed"; cause: unknown }>
  | Readonly<{ kind: "TokenRefreshRejected"; status: number; statusText: string }>
  | ValidationError;

type RefreshAccessTokenParams = Readonly<{
  refreshToken: Sensitive<string>;
  clientId: string;
  clientSecret: Sensitive<string>;
}>;

const requestTokenRefresh = ({
  refreshToken,
  clientId,
  clientSecret,
}: RefreshAccessTokenParams): Result.ResultAsync<Response, TokenRefreshError> =>
  Result.try({
    try: () =>
      fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken.unwrap(),
          client_id: clientId,
          client_secret: clientSecret.unwrap(),
        }),
      }),
    catch: (cause): TokenRefreshError => ({ kind: "TokenRefreshRequestFailed", cause }),
  });

const ensureOkResponse = (response: Response): Result.Result<Response, TokenRefreshError> =>
  response.ok
    ? Result.succeed(response)
    : Result.fail({
        kind: "TokenRefreshRejected",
        status: response.status,
        statusText: response.statusText,
      });

const readJsonBody = (response: Response): Result.ResultAsync<unknown, TokenRefreshError> =>
  Result.try({
    try: (): Promise<unknown> => response.json(),
    catch: (cause): TokenRefreshError => ({ kind: "TokenRefreshRequestFailed", cause }),
  });

export const refreshAccessToken = (
  params: RefreshAccessTokenParams,
): Result.ResultAsync<TokenRefreshResult, TokenRefreshError> =>
  Result.pipe(
    requestTokenRefresh(params),
    Result.andThen(ensureOkResponse),
    Result.andThen(readJsonBody),
    Result.andThen(parseTokenResponse),
    Result.map(
      (parsed): TokenRefreshResult => ({
        accessToken: parsed.access_token,
        newRefreshToken: parsed.refresh_token,
      }),
    ),
  );
