import type { Result } from "@praha/byethrow";
import type { z } from "zod";

export type ValidationIssue = Readonly<{ message: string }>;

export type ValidationError = Readonly<{
  kind: "ValidationError";
  issues: readonly ValidationIssue[];
}>;

// 検証 → Result 変換は factory 一本に集約し、schema ごとに手書きしない
export const schemaParse =
  <S extends z.ZodType>(schema: S) =>
  (raw: unknown): Result.Result<z.output<S>, ValidationError> => {
    const result = schema.safeParse(raw);
    // generic な出力型では succeed/fail の戻り型が解決できないため、公式のプレーンオブジェクト表現で構築する
    return result.success
      ? { type: "Success", value: result.data }
      : { type: "Failure", error: { kind: "ValidationError", issues: result.error.issues } };
  };
