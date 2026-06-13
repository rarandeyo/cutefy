// Stub used only by `@better-auth/cli generate` to introspect the schema.
// Real runtime uses `getAuth()` in ./server.ts which wires D1 from the Cloudflare context.
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/shared/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(drizzle(new Database(":memory:")), {
    provider: "sqlite",
    schema,
  }),
  socialProviders: {
    spotify: {
      clientId: "stub",
      clientSecret: "stub",
    },
  },
});
