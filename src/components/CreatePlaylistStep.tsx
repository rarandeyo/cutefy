import type React from "react";
import { Alert, Button, Input, Spinner } from "@heroui/react";
import { Sparkles } from "lucide-react";
import { StepNav } from "@/components/StepNav";
import { CompletionScreen } from "@/components/CompletionScreen";
import type { PlaylistState } from "@/types/playlist";

type CreatePlaylistStepProps = {
  playlistName: string;
  onPlaylistNameChange: (name: string) => void;
  playlistState: PlaylistState;
  isCreating: boolean;
  filteredTrackCount: number;
  onCreatePlaylist: () => void;
  onReset: () => void;
  onBack: () => void;
};

export const CreatePlaylistStep: React.FC<CreatePlaylistStepProps> = ({
  playlistName,
  onPlaylistNameChange,
  playlistState,
  isCreating,
  filteredTrackCount,
  onCreatePlaylist,
  onReset,
  onBack,
}) => {
  if (playlistState.status === "success") {
    return (
      <CompletionScreen
        playlistUrl={playlistState.playlistUrl}
        trackCount={filteredTrackCount}
        onReset={onReset}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <h2 className="text-xl font-bold">プレイリストを作成</h2>
        <p className="mt-1 text-sm text-text-subdued">
          {filteredTrackCount} 曲のプレイリストを作成します
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <Input
          value={playlistName}
          onChange={(e) => onPlaylistNameChange(e.target.value)}
          placeholder="プレイリスト名を入力"
          className="rounded-lg border border-border bg-card-bg px-4 py-3 text-foreground placeholder:text-text-subdued transition-colors focus:border-spotify-green focus:outline-none"
        />
        <Button
          isPending={isCreating}
          onPress={onCreatePlaylist}
          isDisabled={isCreating || !playlistName.trim() || filteredTrackCount === 0}
          className="flex items-center justify-center gap-2 rounded-full bg-spotify-green px-6 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40"
        >
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : <Sparkles className="h-5 w-5" />}
              {isPending ? "作成中..." : "プレイリストを作成"}
            </>
          )}
        </Button>
      </div>
      {playlistState.status === "error" && (
        <Alert status="danger" className="rounded-lg">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description className="text-sm">{playlistState.message}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      <StepNav onBack={onBack} />
    </div>
  );
};
