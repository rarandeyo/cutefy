import type { SyncPeriodKey } from "./sync-period-key";

export type SyncPeriod = Readonly<{
  key: SyncPeriodKey;
  label: string;
  months: number;
}>;

export const SyncPeriod = {
  all: [
    { key: "1month", label: "1 Month", months: 1 },
    { key: "3months", label: "3 Months", months: 3 },
    { key: "6months", label: "6 Months", months: 6 },
    { key: "1year", label: "1 Year", months: 12 },
  ],
} as const satisfies Readonly<{ all: readonly SyncPeriod[] }>;
