import type React from "react";
import { Alert, Button, Input, Spinner } from "@heroui/react";
import { ListMusic } from "lucide-react";
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
};

export const CreatePlaylistStep: React.FC<CreatePlaylistStepProps> = ({
  playlistName,
  onPlaylistNameChange,
  playlistState,
  isCreating,
  filteredTrackCount,
  onCreatePlaylist,
  onReset,
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
    <div className="flex h-full flex-col items-center">
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-6">
        <h2 className="text-xl font-bold">プレイリストを作成</h2>
        <Input
          value={playlistName}
          onChange={(e) => onPlaylistNameChange(e.target.value)}
          placeholder="プレイリスト名を入力"
          className="w-full max-w-sm rounded-lg border border-border bg-card-bg px-4 py-3 text-foreground placeholder:text-text-subdued transition-colors focus:border-spotify-green focus:outline-none"
        />
        {playlistState.status === "error" && (
          <Alert status="danger" className="w-full max-w-sm rounded-lg">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description className="text-sm">{playlistState.message}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-end pb-2">
        <Button
          isPending={isCreating}
          onPress={onCreatePlaylist}
          isDisabled={isCreating || !playlistName.trim() || filteredTrackCount === 0}
          className="flex items-center justify-center gap-2 rounded-full bg-spotify-green px-6 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40"
        >
          {({ isPending }) => (
            <>
              {isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <ListMusic className="h-5 w-5" />
              )}
              {isPending ? "作成中..." : "プレイリストを作成"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
