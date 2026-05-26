"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { z } from "zod";
import { getAuth } from "@/shared/lib/auth/server";
import { createUserId, type UserId } from "@/shared/types/brands";
import { errorMessage } from "@/shared/lib/error";
import { updatePlaylists } from "@/features/playlist-sync/lib/playlist-sync";
import { saveSyncSettingsEnabled } from "@/features/sync-settings/lib/sync-settings-repo";

const inputSchema = z.object({ enabled: z.boolean() });

export type ToggleSyncSettingsInput = z.input<typeof inputSchema>;

export type ToggleSyncSettingsResult =
  | { ok: true; enabled: boolean; syncError?: string }
  | { ok: false; reason: "unauthorized" | "invalid_input" | "unknown"; message: string };

const getCurrentUserId = async (): Promise<UserId | null> => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session ? createUserId(session.user.id) : null;
};

export const toggleSyncSettings = async (
  input: ToggleSyncSettingsInput,
): Promise<ToggleSyncSettingsResult> => {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "invalid_input", message: "入力が不正です" };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, reason: "unauthorized", message: "未ログイン" };
  }

  const { env } = await getCloudflareContext({ async: true });
  try {
    await saveSyncSettingsEnabled(env.DB, userId, parsed.data.enabled);
  } catch (err) {
    return {
      ok: false,
      reason: "unknown",
      message: errorMessage(err, "設定の保存に失敗しました"),
    };
  }

  if (parsed.data.enabled) {
    try {
      await updatePlaylists(env, { skipEnabledCheck: true, userId });
    } catch (err) {
      return {
        ok: true,
        enabled: true,
        syncError: errorMessage(err, "Initial sync failed"),
      };
    }
  }

  return { ok: true, enabled: parsed.data.enabled };
};
