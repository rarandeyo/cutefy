// Stub used only by `@better-auth/cli generate` to introspect the schema.
// Real runtime uses `getAuth()` in ./auth.ts which wires D1 from the Cloudflare context.
import Database from "better-sqlite3";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: new Database(":memory:"),
  socialProviders: {
    spotify: {
      clientId: "stub",
      clientSecret: "stub",
    },
  },
});
