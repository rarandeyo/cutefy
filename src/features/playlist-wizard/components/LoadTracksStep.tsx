import { Alert, Button, Spinner } from "@heroui/react";
import { CheckCircle, Music } from "lucide-react";
import { StepNav } from "./StepNav";
import type { SavedTracksState } from "@/features/playlist-wizard/types/saved-tracks-state";

type LoadTracksStepProps = {
  state: SavedTracksState;
  onLoadTracks: () => void;
  onNext: () => void;
};

export const LoadTracksStep: React.FC<LoadTracksStepProps> = ({ state, onLoadTracks, onNext }) => {
  const trackCount = state.tracks.length;
  const isLoading = state.kind === "loading";
  const error = state.kind === "error" ? state.message : null;

  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h2 className="text-xl font-bold">お気に入り曲を読み込む</h2>
          <p className="mt-2 text-sm text-text-subdued">Spotifyに保存した曲を取得します</p>
        </div>

        {isLoading ? (
          <div className="flex animate-appearance-in flex-col items-center gap-3">
            <Spinner color="current" size="lg" />
            <span className="text-sm text-text-subdued">お気に入り曲を取得中...</span>
          </div>
        ) : (
          (trackCount > 0 || error) && (
            <Button
              onPress={onLoadTracks}
              className="flex items-center gap-2 rounded-full bg-white/10 px-8 py-3 font-semibold text-foreground transition-colors hover:bg-white/20"
            >
              <Music className="h-5 w-5" />
              {error && trackCount === 0 ? "再試行" : "お気に入り曲を再取得"}
            </Button>
          )
        )}

        {error && (
          <Alert status="danger" className="rounded-lg">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description className="text-sm">{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {!isLoading && trackCount > 0 && (
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
