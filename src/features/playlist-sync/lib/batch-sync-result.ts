import type { DatabaseError } from "@/shared/lib/db/database-error";
import type { ValidationError } from "@/shared/lib/validation";
import type { UserId } from "@/shared/types/user-id";
import type { SyncFailedKind } from "./sync-result";

export type UserSyncFailure = Readonly<{
  userId: UserId;
  errorKind: SyncFailedKind;
  message: string;
}>;

export type BatchSyncFailedKind =
  | DatabaseError["kind"]
  | ValidationError["kind"]
  | "AllUsersFailed";

export type BatchSyncResult =
  | Readonly<{ kind: "success"; syncedUserCount: number }>
  | Readonly<{ kind: "partial"; syncedUserCount: number; failures: readonly UserSyncFailure[] }>
  | Readonly<{
      kind: "failed";
      errorKind: BatchSyncFailedKind;
      message: string;
      failures: readonly UserSyncFailure[];
    }>;
