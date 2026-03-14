import "server-only";

type ServerEnvKey = "SPOTIFY_CLIENT_SECRET" | "BETTER_AUTH_URL" | "BETTER_AUTH_SECRET";

const requireEnv = (key: ServerEnvKey): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  SPOTIFY_CLIENT_SECRET: requireEnv("SPOTIFY_CLIENT_SECRET"),
  BETTER_AUTH_URL: requireEnv("BETTER_AUTH_URL"),
  BETTER_AUTH_SECRET: requireEnv("BETTER_AUTH_SECRET"),
} as const;
