"use client";

import { useState, useTransition } from "react";
import { toggleSyncSettings } from "@/features/sync-settings/actions";

type SyncSettingsState =
  | Readonly<{ kind: "ready"; enabled: boolean }>
  | Readonly<{ kind: "syncing"; enabled: boolean }>
  | Readonly<{ kind: "error"; enabled: boolean; message: string }>;

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
    kind: "ready",
    enabled: initialEnabled,
  });
  const [, startTransition] = useTransition();

  const handleToggle = (enabled: boolean): void => {
    setState({ kind: "syncing", enabled });
    startTransition(async () => {
      try {
        const result = await toggleSyncSettings({ enabled });
        switch (result.kind) {
          case "enabled":
            if (result.sync.kind !== "success") {
              setState({
                kind: "error",
                enabled: true,
                message: SYNC_USER_MESSAGES[result.sync.kind],
              });
              return;
            }
            setState({ kind: "ready", enabled: true });
            return;
          case "disabled":
            setState({ kind: "ready", enabled: false });
            return;
          case "unauthorized":
          case "invalid_input":
          case "unknown":
            setState({
              kind: "error",
              enabled: !enabled,
              message: ACTION_USER_MESSAGES[result.kind],
            });
            return;
        }
      } catch {
        setState({ kind: "error", enabled: !enabled, message: "通信エラーが発生しました" });
      }
    });
  };

  return { state, handleToggle };
};
