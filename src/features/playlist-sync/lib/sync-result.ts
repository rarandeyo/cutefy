import type { SyncPeriodError, SyncUserSetupError } from "./sync-errors";
import type { SyncPeriodKey } from "./sync-period-key";

// message は表示用。呼び出し側がエラー種別で分岐できるよう errorKind を型付きで併載する
export type SyncFailedKind = SyncUserSetupError["kind"] | "AllPeriodsFailed";

export type SyncPeriodFailure = Readonly<{
  periodKey: SyncPeriodKey;
  errorKind: SyncPeriodError["kind"];
  message: string;
}>;

export type SyncResult =
  | Readonly<{ kind: "success"; syncedCount: number }>
  | Readonly<{ kind: "partial"; syncedCount: number; failures: readonly SyncPeriodFailure[] }>
  | Readonly<{
      kind: "failed";
      errorKind: SyncFailedKind;
      message: string;
      failures: readonly SyncPeriodFailure[];
    }>;
