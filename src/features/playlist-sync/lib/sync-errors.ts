import type { DatabaseError } from "@/shared/lib/db/database-error";
import type { FetchSavedTracksError, PlaylistWriteError } from "@/shared/lib/spotify";
import type { TokenRefreshError } from "@/shared/lib/spotify/token";
import type { ValidationError } from "@/shared/lib/validation";
import type { UserId } from "@/shared/types/user-id";

export type RefreshTokenNotFoundError = Readonly<{
  kind: "RefreshTokenNotFound";
  userId: UserId;
}>;

export type SyncUserSetupError =
  | DatabaseError
  | RefreshTokenNotFoundError
  | TokenRefreshError
  | FetchSavedTracksError;

export type SyncPeriodError = DatabaseError | ValidationError | PlaylistWriteError;
