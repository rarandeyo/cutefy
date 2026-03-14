import { createAuthClient } from "better-auth/react";
import { clientEnv } from "./env";

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
});

export const signInWithSpotify = () =>
  authClient.signIn.social({
    provider: "spotify",
    callbackURL: "/app",
  });

export const signOut = () =>
  authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/";
      },
    },
  });

export const useSession = authClient.useSession;
