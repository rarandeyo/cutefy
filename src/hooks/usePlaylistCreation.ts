import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { createPlaylistFromTracks, type TrackWithAddedAt } from "@/lib/spotify";
import { INITIAL_PLAYLIST_STATE, type PlaylistState } from "@/types/playlist";

export const usePlaylistCreation = (filteredTracks: TrackWithAddedAt[]) => {
  const [playlistName, setPlaylistName] = useState("");
  const [playlistState, setPlaylistState] = useState<PlaylistState>(INITIAL_PLAYLIST_STATE);
  const [isCreatingPlaylist, startCreatingTransition] = useTransition();

  const handleCreatePlaylist = () => {
    if (!playlistName.trim() || filteredTracks.length === 0) return;

    startCreatingTransition(async () => {
      const tokenResult = await authClient.getAccessToken({ providerId: "spotify" });
      if (tokenResult.error || !tokenResult.data) {
        setPlaylistState({ status: "error", message: "認証エラーが発生しました" });
        return;
      }

      const trackUris = filteredTracks.map((t) => t.uri);
      const result = await createPlaylistFromTracks({
        accessToken: tokenResult.data.accessToken,
        playlistName: playlistName.trim(),
        trackUris,
      });
      setPlaylistState({
        status: "success",
        message: "プレイリストを作成しました！",
        playlistUrl: result.playlistUrl,
      });
    });
  };

  const handleReset = (onComplete?: () => void) => {
    setPlaylistName("");
    setPlaylistState(INITIAL_PLAYLIST_STATE);
    onComplete?.();
  };

  return {
    playlistName,
    setPlaylistName,
    playlistState,
    isCreatingPlaylist,
    handleCreatePlaylist,
    handleReset,
  };
};
