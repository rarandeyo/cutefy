import { createAuthClient } from "better-auth/react";
import { clientEnv } from "./env";

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
});

export const signInWithSpotify = () =>
  authClient.signIn.social({
    provider: "spotify",
    callbackURL: "/",
  });

export const signOut = () => authClient.signOut();

export const useSession = authClient.useSession;
