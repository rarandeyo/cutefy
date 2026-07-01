import { z } from "zod";
import { schemaParse } from "@/shared/lib/validation";

// 同期対象期間は閉じた集合なのでリテラル union で不正値を表現不可能にする
const SyncPeriodKeySchema = z.enum(["1month", "3months", "6months", "1year"]);

export type SyncPeriodKey = z.infer<typeof SyncPeriodKeySchema>;

export const SyncPeriodKey = {
  schema: SyncPeriodKeySchema,
  parse: schemaParse(SyncPeriodKeySchema),
} as const;
