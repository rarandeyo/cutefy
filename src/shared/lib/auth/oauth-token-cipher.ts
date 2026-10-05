// 日次 cron（Next.js の外で wrangler がバンドルする）からも import するので "server-only" は付けない
import { Result } from "@praha/byethrow";
import { symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";
import { Sensitive } from "@/shared/lib/sensitive";

// better-auth を通さずに account テーブルのトークンを読み書きする経路（日次 cron）用。
// better-auth の account.encryptOAuthTokens と同じ鍵・形式で暗号化しないと、互いに読めなくなる

export type OAuthTokenCipherError = Readonly<{ kind: "OAuthTokenCipherFailed"; cause: unknown }>;

// better-auth の decryptOAuthToken と同じ判定。暗号化を有効にする前に保存された平文トークンはそのまま返す
const isLikelyEncrypted = (stored: string): boolean =>
  stored.startsWith("$ba$") || (stored.length % 2 === 0 && /^[0-9a-f]+$/i.test(stored));

export const decryptStoredOAuthToken = (
  stored: string,
  secret: Sensitive<string>,
): Result.ResultAsync<Sensitive<string>, OAuthTokenCipherError> =>
  isLikelyEncrypted(stored)
    ? Result.pipe(
        Result.try({
          try: () => symmetricDecrypt({ key: secret.unwrap(), data: stored }),
          catch: (cause): OAuthTokenCipherError => ({ kind: "OAuthTokenCipherFailed", cause }),
        }),
        Result.map(Sensitive.of),
      )
    : Promise.resolve(Result.succeed(Sensitive.of(stored)));

export const encryptOAuthTokenForStorage = (
  token: Sensitive<string>,
  secret: Sensitive<string>,
): Result.ResultAsync<string, OAuthTokenCipherError> =>
  Result.try({
    try: () => symmetricEncrypt({ key: secret.unwrap(), data: token.unwrap() }),
    catch: (cause): OAuthTokenCipherError => ({ kind: "OAuthTokenCipherFailed", cause }),
  });
