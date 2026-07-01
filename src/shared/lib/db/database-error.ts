export type DatabaseError = Readonly<{
  kind: "DatabaseError";
  cause: unknown;
}>;

export const DatabaseError = {
  of: (cause: unknown): DatabaseError => ({ kind: "DatabaseError", cause }),
} as const;
