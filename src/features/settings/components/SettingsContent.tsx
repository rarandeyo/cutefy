"use client";

import type React from "react";
import { Switch } from "@heroui/react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSyncSettings } from "@/features/settings/hooks/useSyncSettings";

type SettingsContentProps = Readonly<{
  initialEnabled: boolean;
}>;

export const SettingsContent: React.FC<SettingsContentProps> = ({ initialEnabled }) => {
  const { enabled, isToggling, errorMessage, handleToggle } = useSyncSettings(initialEnabled);

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col p-4 md:p-8">
      <header className="flex items-center gap-3 pb-8">
        <Link
          href="/app"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-foreground transition-colors hover:bg-white/20"
          aria-label="戻る"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight md:text-xl">設定</h1>
      </header>

      <div className="space-y-6">
        <div className="rounded-xl bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-spotify-green" />
                <span className="font-medium">プレイリスト自動同期</span>
              </div>
              <p className="text-sm text-foreground/60">
                お気に入りの曲から 1ヶ月 / 6ヶ月 / 1年 のプレイリストを毎日自動更新します
              </p>
            </div>
            <Switch isSelected={enabled} isDisabled={isToggling} onChange={handleToggle}>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>

          {isToggling && (
            <div className="mt-3 flex items-center gap-2 text-sm text-foreground/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>プレイリストを同期中...</span>
            </div>
          )}

          {errorMessage && <p className="mt-3 text-sm text-danger">{errorMessage}</p>}
        </div>
      </div>
    </div>
  );
};
