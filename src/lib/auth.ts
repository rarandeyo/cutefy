import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { clientEnv } from "./env";
import { env } from "./env.server";

// Called per-request: getCloudflareContext() is only available at request time, not during build
export const getAuth = () =>
  betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: getCloudflareContext().env.DB,
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60, // 1 hour
      },
    },
    socialProviders: {
      spotify: {
        clientId: clientEnv.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
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
