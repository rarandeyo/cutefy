declare global {
  interface CloudflareEnv {
    DB: D1Database;
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: string;
    SPOTIFY_CLIENT_SECRET: string;
    NEXT_PUBLIC_APP_URL: string;
    BETTER_AUTH_URL: string;
  }
}

export {};
