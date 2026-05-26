import { useEffect, useState, useTransition } from "react";
import { z } from "zod";

type SyncSettingsState =
  | { status: "loading" }
  | { status: "idle"; enabled: boolean }
  | { status: "error"; enabled: boolean; message: string };

const getResponseSchema = z.object({ enabled: z.boolean() });
const postResponseSchema = z.object({
  enabled: z.boolean(),
  syncError: z.string().optional(),
});

type SyncSettings = {
  state: SyncSettingsState;
  isToggling: boolean;
  handleToggle: (enabled: boolean) => void;
};

export const useSyncSettings = (): SyncSettings => {
  const [state, setState] = useState<SyncSettingsState>({ status: "loading" });
  const [isToggling, startTransition] = useTransition();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/sync-settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = getResponseSchema.parse(await res.json());
        setState({ status: "idle", enabled: data.enabled });
      } catch {
        setState({ status: "error", enabled: false, message: "設定の取得に失敗しました" });
      }
    };
    fetchSettings().catch(console.error);
  }, []);

  const handleToggle = (enabled: boolean) => {
    startTransition(async () => {
      try {
        setState({ status: "idle", enabled });
        const res = await fetch("/api/sync-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });
        if (!res.ok) throw new Error("Failed to update settings");
        const data = postResponseSchema.parse(await res.json());
        if (data.syncError) {
          setState({ status: "error", enabled: data.enabled, message: data.syncError });
        } else {
          setState({ status: "idle", enabled: data.enabled });
        }
      } catch {
        setState({ status: "error", enabled: !enabled, message: "設定の更新に失敗しました" });
      }
    });
  };

  return { state, isToggling, handleToggle };
};
