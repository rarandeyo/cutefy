import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { env } from "@/shared/lib/env/server";

const buildAuth = (db: D1Database) =>
  betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: db,
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60, // 1 hour
      },
    },
    socialProviders: {
      spotify: {
        clientId: env.SPOTIFY_CLIENT_ID,
        clientSecret: env.SPOTIFY_CLIENT_SECRET,
        scope: [
          "user-read-email",
          "user-read-private",
          "user-library-read",
          "playlist-modify-public",
          "playlist-modify-private",
        ],
      },
    },
  });

// Called per-request: getCloudflareContext() is only available at request time, not during build
export const getAuth = async (): Promise<ReturnType<typeof buildAuth>> => {
  const { env: cfEnv } = await getCloudflareContext({ async: true });
  return buildAuth(cfEnv.DB);
};
