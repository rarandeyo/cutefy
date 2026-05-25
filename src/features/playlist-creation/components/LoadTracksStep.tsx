import type React from "react";
import { Alert, Button, Spinner } from "@heroui/react";
import { CheckCircle, Music } from "lucide-react";
import type { SavedTracksState } from "@/features/playlist-creation/hooks/useSavedTracks";
import { StepNav } from "./StepNav";

type LoadTracksStepProps = Readonly<{
  state: SavedTracksState;
  onLoadTracks: () => void;
  onNext: () => void;
}>;

const getProgressLabel = (loaded: number, total: number): string => {
  const ratio = loaded / total;
  if (ratio < 0.7) return "お気に入り曲を取得中...";
  return "もう少しで完了です...";
};

export const LoadTracksStep: React.FC<LoadTracksStepProps> = ({ state, onLoadTracks, onNext }) => {
  const trackCount = state.tracks.length;
  const errorMessage = state.status === "error" ? state.message : null;
  const reloadButtonLabel =
    state.status === "error" && trackCount === 0 ? "再試行" : "お気に入り曲を再取得";

  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h2 className="text-xl font-bold">お気に入り曲を読み込む</h2>
          <p className="mt-2 text-sm text-text-subdued">Spotifyに保存した曲を取得します</p>
        </div>

        {state.status === "loading" ? (
          <div className="flex animate-appearance-in flex-col items-center gap-4">
            {state.progress ? (
              <>
                <div
                  role="progressbar"
                  aria-label="曲の取得進捗"
                  aria-valuenow={state.progress.loaded}
                  aria-valuemin={0}
                  aria-valuemax={state.progress.total}
                  className="relative h-28 w-28"
                >
                  <svg className="-rotate-90" viewBox="0 0 100 100" fill="none">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-white/10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className="text-spotify-green transition-all duration-300 ease-out"
                      stroke="currentColor"
                      strokeDasharray={2 * Math.PI * 44}
                      strokeDashoffset={
                        2 * Math.PI * 44 * (1 - state.progress.loaded / state.progress.total)
                      }
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">
                    {Math.round((state.progress.loaded / state.progress.total) * 100)}%
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 text-sm">
                  <span className="text-text-subdued">
                    {getProgressLabel(state.progress.loaded, state.progress.total)}
                  </span>
                  <span className="tabular-nums text-text-subdued/70">
                    {state.progress.loaded}
                    <span className="mx-0.5">/</span>
                    {state.progress.total} 曲
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Spinner color="current" size="lg" />
                <span className="text-sm text-text-subdued">準備中...</span>
              </div>
            )}
          </div>
        ) : (
          (trackCount > 0 || errorMessage) && (
            <Button
              onPress={onLoadTracks}
              className="flex items-center gap-2 rounded-full bg-white/10 px-8 py-3 font-semibold text-foreground transition-colors hover:bg-white/20"
            >
              <Music className="h-5 w-5" />
              {reloadButtonLabel}
            </Button>
          )
        )}

        {errorMessage && (
          <Alert status="danger" className="rounded-lg">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description className="text-sm">{errorMessage}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {state.status !== "loading" && trackCount > 0 && (
          <div className="flex animate-appearance-in items-center gap-2 text-sm text-text-subdued">
            <CheckCircle className="h-4 w-4 text-spotify-green" />
            <span>
              <span className="font-semibold tabular-nums text-spotify-green">{trackCount}</span>{" "}
              曲を取得済み
            </span>
          </div>
        )}
      </div>
      <div className="flex-1" />
      {trackCount > 0 && <StepNav onNext={onNext} />}
    </div>
  );
};
