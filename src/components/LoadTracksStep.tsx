import type React from "react";
import { Button, Spinner } from "@heroui/react";
import { Music } from "lucide-react";
import { StepNav } from "@/components/StepNav";

type LoadTracksStepProps = {
  isLoading: boolean;
  trackCount: number;
  onLoadTracks: () => void;
  onNext: () => void;
};

export const LoadTracksStep: React.FC<LoadTracksStepProps> = ({
  isLoading,
  trackCount,
  onLoadTracks,
  onNext,
}) => (
  <div className="flex flex-col items-center gap-8 py-12">
    <div className="text-center">
      <h2 className="text-xl font-bold">お気に入り曲を読み込む</h2>
      <p className="mt-2 text-sm text-text-subdued">Spotifyに保存した曲を取得します</p>
    </div>
    <Button
      isPending={isLoading}
      onPress={onLoadTracks}
      className="flex items-center gap-2 rounded-full bg-spotify-green px-8 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover data-[disabled=true]:opacity-50"
    >
      {({ isPending }) => (
        <>
          {isPending ? <Spinner color="current" size="sm" /> : <Music className="h-5 w-5" />}
          {isPending
            ? "読み込み中..."
            : trackCount > 0
              ? "お気に入り曲を再取得"
              : "お気に入り曲を取得"}
        </>
      )}
    </Button>
    {trackCount > 0 && (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-text-subdued">
          <span className="font-semibold text-spotify-green">{trackCount}</span> 曲を取得済み
        </p>
        <StepNav onNext={onNext} />
      </div>
    )}
  </div>
);
