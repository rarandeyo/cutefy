// サーバーサイドのログ出力はここに集約する。
// Sensitive の掛け忘れに備えた redaction を将来差し込むための単一の出口
export const logger = {
  info: (message: string): void => console.log(message),
  error: (message: string): void => console.error(message),
} as const;
