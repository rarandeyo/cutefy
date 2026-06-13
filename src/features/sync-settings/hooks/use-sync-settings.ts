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

const SYNC_USER_MESSAGES = {
  partial: "一部のプレイリストの同期に失敗しました",
  failed: "プレイリストの同期に失敗しました",
} as const satisfies Record<string, string>;

const ACTION_USER_MESSAGES = {
  unauthorized: "セッションが切れました。再ログインしてください",
  invalid_input: "入力が不正です",
  unknown: "エラーが発生しました",
} as const satisfies Record<string, string>;

export const useSyncSettings = (initialEnabled: boolean): SyncSettings => {
  const [state, setState] = useState<SyncSettingsState>({
    status: "ready",
    enabled: initialEnabled,
  });
  const [, startTransition] = useTransition();

  const handleToggle = (enabled: boolean): void => {
    setState({ status: "syncing", enabled });
    startTransition(async () => {
      try {
        const result = await toggleSyncSettings({ enabled });
        if (!result.ok) {
          setState({
            status: "error",
            enabled: !enabled,
            message: ACTION_USER_MESSAGES[result.reason],
          });
          return;
        }
        if (result.enabled && result.sync.status !== "success") {
          setState({
            status: "error",
            enabled: true,
            message: SYNC_USER_MESSAGES[result.sync.status],
          });
          return;
        }
        setState({ status: "ready", enabled: result.enabled });
      } catch {
        setState({ status: "error", enabled: !enabled, message: "通信エラーが発生しました" });
      }
    });
  };

  return { state, handleToggle };
};
