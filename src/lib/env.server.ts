import "server-only";

type ServerEnvKey = "SPOTIFY_CLIENT_SECRET" | "BETTER_AUTH_URL" | "BETTER_AUTH_SECRET";

const requireEnv = (key: ServerEnvKey): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

type ServerEnv = Readonly<Record<ServerEnvKey, string>>;

export const env: ServerEnv = new Proxy({} as ServerEnv, {
  get(_, key: string) {
    return requireEnv(key as ServerEnvKey);
  },
});
