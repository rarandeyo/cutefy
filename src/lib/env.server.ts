import "server-only";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const env = createEnv({
  server: {
    SPOTIFY_CLIENT_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
  },
  runtimeEnv: {
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  },
  emptyStringAsUndefined: true,
});
