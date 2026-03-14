const requireClientEnv = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(`Missing required client environment variable: ${key}`);
  }
  return value;
};

export const clientEnv = {
  NEXT_PUBLIC_SPOTIFY_CLIENT_ID: requireClientEnv(
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    "NEXT_PUBLIC_SPOTIFY_CLIENT_ID",
  ),
  NEXT_PUBLIC_APP_URL: requireClientEnv(
    process.env.NEXT_PUBLIC_APP_URL,
    "NEXT_PUBLIC_APP_URL",
  ),
} as const;
