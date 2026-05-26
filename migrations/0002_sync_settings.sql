CREATE TABLE "sync_settings" (
  "user_id" TEXT NOT NULL PRIMARY KEY REFERENCES "user" ("id") ON DELETE CASCADE,
  "enabled" INTEGER NOT NULL DEFAULT 0,
  "updated_at" INTEGER NOT NULL
);
