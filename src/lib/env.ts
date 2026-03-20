import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const clientEnv = createEnv({
  client: {
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
});
