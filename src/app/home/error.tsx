"use client";

import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h2 className="text-xl font-bold">エラーが発生しました</h2>
      <p className="max-w-md text-sm text-text-subdued">{error.message}</p>
      <Button
        onPress={() => reset()}
        className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-2.5 font-semibold text-foreground transition-colors hover:bg-white/20"
      >
        <RefreshCw className="h-4 w-4" />
        再試行
      </Button>
    </div>
  );
}
