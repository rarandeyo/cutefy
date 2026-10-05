// 日次 cron（Next.js の外で wrangler がバンドルする）からも import するので "server-only" は付けない
import { Result } from "@praha/byethrow";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { decryptOAuthToken, setTokenUtil } from "better-auth/oauth2";
import { Sensitive } from "@/shared/lib/sensitive";
import { accountOptions } from "./account-options";

// better-auth を通さずに account テーブルのトークンを読み書きする経路（日次 cron）用。
// 鍵の決め方（BETTER_AUTH_SECRET / BETTER_AUTH_SECRETS）と平文の判定は better-auth に任せ、アプリ本体と同じ形式を保つ

export type OAuthTokenCipherError = Readonly<{ kind: "OAuthTokenCipherFailed"; cause: unknown }>;

const toCipherError = (cause: unknown): OAuthTokenCipherError => ({
  kind: "OAuthTokenCipherFailed",
  cause,
});

const createTokenContext = (secret: Sensitive<string>) => {
  // 型引数をアプリ固有の形に絞ると decryptOAuthToken の AuthContext に渡せなくなるので、BetterAuthOptions として渡す
  const options: BetterAuthOptions = { secret: secret.unwrap(), account: accountOptions };
  return betterAuth(options).$context;
};

export type OAuthTokenContext = Awaited<ReturnType<typeof createTokenContext>>;

export const loadOAuthTokenContext = (
  secret: Sensitive<string>,
): Result.ResultAsync<OAuthTokenContext, OAuthTokenCipherError> =>
  Result.try({ try: () => createTokenContext(secret), catch: toCipherError });

export type StoredOAuthToken = Readonly<{
  token: Sensitive<string>;
  // 暗号化を有効にする前に保存された平文。better-auth は平文をそのまま返すので、復号結果が保存値と同じかで見分ける
  storedAsPlaintext: boolean;
}>;

export const decryptStoredOAuthToken = (
  stored: Sensitive<string>,
  ctx: OAuthTokenContext,
): Result.ResultAsync<StoredOAuthToken, OAuthTokenCipherError> =>
  Result.pipe(
    Result.try({
      try: async () => decryptOAuthToken(stored.unwrap(), ctx),
      catch: toCipherError,
    }),
    Result.map(
      (token): StoredOAuthToken => ({
        token: Sensitive.of(token),
        storedAsPlaintext: token === stored.unwrap(),
      }),
    ),
  );

export const encryptOAuthTokenForStorage = (
  token: Sensitive<string>,
  ctx: OAuthTokenContext,
): Result.ResultAsync<string, OAuthTokenCipherError> =>
  Result.pipe(
    Result.try({
      try: async () => setTokenUtil(token.unwrap(), ctx),
      catch: toCipherError,
    }),
    Result.andThen(
      (encrypted): Result.Result<string, OAuthTokenCipherError> =>
        typeof encrypted === "string" && encrypted.length > 0
          ? Result.succeed(encrypted)
          : Result.fail(toCipherError(new Error("setTokenUtil returned no value"))),
    ),
  );
