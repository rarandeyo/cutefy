import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export const syncSettings = sqliteTable("sync_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  enabled: integer("enabled").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

export const playlistSync = sqliteTable(
  "playlist_sync",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    playlistId: text("playlist_id").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.period] })],
);
