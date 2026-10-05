// アプリ本体の better-auth と、日次 cron がトークンを読み書きするための better-auth で同じ設定を使う
export const accountOptions = {
  encryptOAuthTokens: true,
} as const;
