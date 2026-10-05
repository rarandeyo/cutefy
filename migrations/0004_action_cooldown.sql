CREATE TABLE "action_cooldown" (
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "last_triggered_at" INTEGER NOT NULL,
  PRIMARY KEY ("user_id", "action")
);
