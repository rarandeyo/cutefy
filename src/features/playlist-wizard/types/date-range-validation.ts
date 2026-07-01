export type DateRangeValidation =
  | Readonly<{ kind: "valid" }>
  | Readonly<{ kind: "invalid"; message: string }>;
