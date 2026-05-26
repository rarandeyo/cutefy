// @ts-expect-error — .open-next/worker.js is generated at build time
import { default as handler } from "./.open-next/worker.js";

// eslint-disable-next-line import/no-default-export -- required by Cloudflare Workers
export default {
  fetch: handler.fetch,
  async scheduled(_controller: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) {
    // Dynamic import to avoid triggering t3-env validation at worker startup
    const { updatePlaylists } = await import("./src/features/playlist-sync/lib/playlist-sync");
    ctx.waitUntil(updatePlaylists(env));
  },
} satisfies ExportedHandler<CloudflareEnv>;
