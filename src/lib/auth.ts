import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  account: {
    storeAccountCookie: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "spotify",
          clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
          clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
          discoveryUrl: "https://accounts.spotify.com/.well-known/openid-configuration",
          scopes: [
            "user-read-email",
            "user-read-private",
            "user-library-read",
            "playlist-modify-public",
            "playlist-modify-private",
          ],
        },
      ],
    }),
  ],
});
