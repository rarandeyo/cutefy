"use client";

import { useState, useTransition } from "react";
import { toggleSyncSettings } from "@/features/sync-settings/actions";

type SyncSettingsState =
  | { status: "ready"; enabled: boolean }
  | { status: "syncing"; enabled: boolean }
  | { status: "error"; enabled: boolean; message: string };

type SyncSettings = {
  state: SyncSettingsState;
  handleToggle: (enabled: boolean) => void;
};

export const useSyncSettings = (initialEnabled: boolean): SyncSettings => {
  const [state, setState] = useState<SyncSettingsState>({
    status: "ready",
    enabled: initialEnabled,
  });
  const [, startTransition] = useTransition();

  const handleToggle = (enabled: boolean): void => {
    setState({ status: "syncing", enabled });
    startTransition(async () => {
      const result = await toggleSyncSettings({ enabled });
      if (!result.ok) {
        setState({ status: "error", enabled: !enabled, message: result.message });
        return;
      }
      if (result.syncError) {
        setState({ status: "error", enabled: result.enabled, message: result.syncError });
        return;
      }
      setState({ status: "ready", enabled: result.enabled });
    });
  };

  return { state, handleToggle };
};
