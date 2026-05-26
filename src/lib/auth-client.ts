import { createAuthClient } from "better-auth/react";
import { clientEnv } from "./env";

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
});

export const signInWithSpotify = (): ReturnType<typeof authClient.signIn.social> =>
  authClient.signIn.social({
    provider: "spotify",
    callbackURL: "/app",
  });

export const signOut = (): ReturnType<typeof authClient.signOut> =>
  authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/";
      },
    },
  });

export const useSession = authClient.useSession;
