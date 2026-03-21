declare global {
  interface CloudflareEnv {
    DB: D1Database;
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: string;
    SPOTIFY_CLIENT_SECRET: string;
  }
}

export {};
