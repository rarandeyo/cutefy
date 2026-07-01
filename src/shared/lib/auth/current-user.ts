import "server-only";

import { Result } from "@praha/byethrow";
import { UserId } from "@/shared/types/user-id";
import type { getAuth } from "./server";

export type SessionNotFoundError = Readonly<{ kind: "SessionNotFound" }>;
export type AuthServiceError = Readonly<{ kind: "AuthServiceError"; cause: unknown }>;
export type CurrentUserIdError = SessionNotFoundError | AuthServiceError;

type Auth = Awaited<ReturnType<typeof getAuth>>;
type Session = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;

const getSession = (
  auth: Auth,
  requestHeaders: Headers,
): Result.ResultAsync<Session, CurrentUserIdError> =>
  Result.pipe(
    Result.try({
      try: () => auth.api.getSession({ headers: requestHeaders }),
      catch: (cause): CurrentUserIdError => ({ kind: "AuthServiceError", cause }),
    }),
    Result.andThen(
      (session): Result.Result<Session, CurrentUserIdError> =>
        session ? Result.succeed(session) : Result.fail({ kind: "SessionNotFound" }),
    ),
  );

// セッション取得 + UserId parse は複数の Server Action / lib で必要になるためここに集約する
export const getCurrentUserId = (
  auth: Auth,
  requestHeaders: Headers,
): Result.ResultAsync<UserId, CurrentUserIdError> =>
  Result.pipe(
    getSession(auth, requestHeaders),
    Result.andThen((session) =>
      Result.pipe(
        UserId.parse(session.user.id),
        Result.mapError((cause): AuthServiceError => ({ kind: "AuthServiceError", cause })),
      ),
    ),
  );
