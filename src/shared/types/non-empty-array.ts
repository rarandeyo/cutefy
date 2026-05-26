export type NonEmptyArray<T> = readonly [T, ...T[]];

export const isNonEmpty = <T>(arr: readonly T[]): arr is NonEmptyArray<T> => arr.length > 0;
