import { z } from "zod";

export type Sensitive<T> = Readonly<{
  unwrap: () => T;
  toJSON: () => string;
  toString: () => string;
}>;

// クロージャに値を閉じ込め、JSON.stringify / console.log / テンプレートリテラルで自動マスクする
export const Sensitive = {
  of: <T>(value: T): Sensitive<T> => ({
    unwrap: () => value,
    toJSON: () => "[REDACTED]",
    toString: () => "[REDACTED]",
    [Symbol.for("nodejs.util.inspect.custom")]: () => "[REDACTED]",
  }),
} as const;

// 秘匿値は空文字を許容しない
export const sensitiveString = z.string().min(1).transform(Sensitive.of);
