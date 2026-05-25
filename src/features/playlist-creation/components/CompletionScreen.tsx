import { Button } from "@heroui/react";
import { Check, ExternalLink } from "lucide-react";
import type React from "react";

type CompletionScreenProps = Readonly<{
  playlistUrl: string;
  trackCount: number;
  onReset: () => void;
}>;

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  playlistUrl,
  trackCount,
  onReset,
}) => (
  <div className="flex h-full flex-col items-center justify-center gap-8 animate-[fade-in_0.5s_ease-out]">
    <div className="relative">
      <div className="absolute -inset-4 animate-pulse rounded-full bg-spotify-green/10" />
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-spotify-green animate-[scale-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
        <Check className="h-12 w-12 text-black" strokeWidth={3} />
      </div>
    </div>
    <div className="text-center">
      <h2 className="text-2xl font-bold">プレイリストを作成しました！</h2>
      <p className="mt-2 text-text-subdued">{trackCount} 曲のプレイリストが完成しました</p>
    </div>
    <a
      href={playlistUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-full bg-spotify-green px-8 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover"
    >
      Spotifyで開く
      <ExternalLink className="h-4 w-4" />
    </a>
    <Button
      variant="ghost"
      onPress={onReset}
      className="text-sm text-text-subdued transition-colors hover:text-foreground"
    >
      別のプレイリストを作成
    </Button>
  </div>
);
