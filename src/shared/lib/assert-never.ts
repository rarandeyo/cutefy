// switch の網羅性をコンパイル時に保証する。到達したらプログラミングバグ
export const assertNever = (value: never): never => {
  throw new Error(`Unreachable: ${JSON.stringify(value)}`);
};
