import type { UserId } from "@/shared/types/user-id";

export type UserSyncFailure = Readonly<{
  userId: UserId;
  message: string;
}>;

export type BatchSyncResult =
  | Readonly<{ kind: "success"; syncedUserCount: number }>
  | Readonly<{ kind: "partial"; syncedUserCount: number; failures: readonly UserSyncFailure[] }>
  | Readonly<{ kind: "failed"; message: string; failures: readonly UserSyncFailure[] }>;
