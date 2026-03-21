// @ts-ignore — .open-next/worker.js is generated at build time
import { default as handler } from "./.open-next/worker.js";
import { updatePlaylists } from "./src/lib/playlist-sync";

// eslint-disable-next-line import/no-default-export -- required by Cloudflare Workers
export default {
  fetch: handler.fetch,
  async scheduled(_controller: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) {
    ctx.waitUntil(updatePlaylists(env));
  },
} satisfies ExportedHandler<CloudflareEnv>;
