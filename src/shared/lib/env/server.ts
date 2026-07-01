import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";
// next.config.ts から読み込まれるため、alias ではなく相対 import が必要
// oxlint-disable-next-line import/no-relative-parent-imports
import { sensitiveString } from "../sensitive";

export const env = createEnv({
  server: {
    SPOTIFY_CLIENT_ID: z.string().min(1),
    SPOTIFY_CLIENT_SECRET: sensitiveString,
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_SECRET: sensitiveString,
  },
  runtimeEnv: {
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  },
  emptyStringAsUndefined: true,
});
