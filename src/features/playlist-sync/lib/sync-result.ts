import type { SyncPeriodKey } from "./sync-period-key";

export type SyncPeriodFailure = Readonly<{
  periodKey: SyncPeriodKey;
  message: string;
}>;

export type SyncResult =
  | Readonly<{ kind: "success"; syncedCount: number }>
  | Readonly<{ kind: "partial"; syncedCount: number; failures: readonly SyncPeriodFailure[] }>
  | Readonly<{ kind: "failed"; message: string; failures: readonly SyncPeriodFailure[] }>;
