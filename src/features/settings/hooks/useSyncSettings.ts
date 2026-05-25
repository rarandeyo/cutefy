import { useState, useTransition } from "react";

type SyncSettingsResponse = Readonly<{
  enabled: boolean;
  syncError?: string;
}>;

const postSyncSettings = async (enabled: boolean): Promise<SyncSettingsResponse> => {
  const res = await fetch("/api/sync-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return (await res.json()) as SyncSettingsResponse;
};

export const useSyncSettings = (initialEnabled: boolean) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isToggling, startTransition] = useTransition();

  const handleToggle = (next: boolean) => {
    setEnabled(next);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const data = await postSyncSettings(next);
        setEnabled(data.enabled);
        if (data.syncError) {
          setErrorMessage(data.syncError);
        }
      } catch {
        setEnabled(!next);
        setErrorMessage("設定の更新に失敗しました");
      }
    });
  };

  return { enabled, isToggling, errorMessage, handleToggle };
};
