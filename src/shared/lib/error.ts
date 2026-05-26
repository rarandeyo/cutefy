export const isError = (value: unknown): value is Error => value instanceof Error;

export const errorMessage = (value: unknown, fallback: string): string =>
  isError(value) ? value.message : fallback;
