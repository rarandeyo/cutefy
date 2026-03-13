"use client";

import { useActionState, useState, useSyncExternalStore, useTransition } from "react";
import { authClient, signInWithSpotify, signOut, useSession } from "@/lib/auth-client";
import {
  createPlaylistFromTracks,
  type DateRange,
  fetchAllSavedTracks,
  filterTracksByDateRange,
  type TrackWithAddedAt,
} from "@/lib/spotify";
import { trackCache } from "@/lib/track-cache";

type PlaylistState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  playlistUrl?: string;
};

const initialPlaylistState: PlaylistState = {
  status: "idle",
  message: "",
};

const LoginSection = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
    <h1 className="text-2xl font-bold md:text-4xl">Spotify Playlist Creator</h1>
    <p className="text-center text-text-subdued">
      お気に入りの曲から期間を指定してプレイリストを作成
    </p>
    <button
      type="button"
      onClick={() => signInWithSpotify()}
      className="rounded-full bg-spotify-green px-8 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover"
    >
      Spotifyでログイン
    </button>
  </div>
);

type DateRangePickerProps = {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
};

const DateRangePicker = ({ dateRange, onDateRangeChange }: DateRangePickerProps) => {
  const formatDateForInput = (date: Date): string => date.toISOString().split("T")[0] ?? "";

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex flex-col gap-2">
        <label htmlFor="startDate" className="text-sm text-text-subdued">
          開始日
        </label>
        <input
          type="date"
          id="startDate"
          value={formatDateForInput(dateRange.startDate)}
          onChange={(e) =>
            onDateRangeChange({
              ...dateRange,
              startDate: new Date(e.target.value),
            })
          }
          className="rounded-md border border-border bg-card-bg px-4 py-2 text-foreground"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="endDate" className="text-sm text-text-subdued">
          終了日
        </label>
        <input
          type="date"
          id="endDate"
          value={formatDateForInput(dateRange.endDate)}
          onChange={(e) =>
            onDateRangeChange({
              ...dateRange,
              endDate: new Date(e.target.value),
            })
          }
          className="rounded-md border border-border bg-card-bg px-4 py-2 text-foreground"
        />
      </div>
    </div>
  );
};

type TrackListProps = {
  tracks: TrackWithAddedAt[];
};

const TrackList = ({ tracks }: TrackListProps) => (
  <div className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-card-bg p-4">
    {tracks.length === 0 ? (
      <p className="text-center text-text-subdued">指定期間内の曲がありません</p>
    ) : (
      tracks.map((track) => (
        <div
          key={track.id}
          className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-card-bg-hover"
        >
          {track.albumImageUrl && (
            <img src={track.albumImageUrl} alt={track.albumName} className="h-12 w-12 rounded" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{track.name}</p>
            <p className="truncate text-sm text-text-subdued">{track.artists}</p>
          </div>
          <p className="text-xs text-text-subdued">{track.addedAt.toLocaleDateString()}</p>
        </div>
      ))
    )}
  </div>
);

const getDefaultDateRange = (): DateRange => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  return { startDate, endDate };
};

const MainContent = () => {
  const cachedTracks = useSyncExternalStore(
    trackCache.subscribe,
    trackCache.getSnapshot,
    trackCache.getServerSnapshot,
  );
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [allTracks, setAllTracks] = useState<TrackWithAddedAt[]>(() => cachedTracks ?? []);
  const [isLoadingTracks, startLoadingTransition] = useTransition();
  const [playlistName, setPlaylistName] = useState("");

  const filteredTracks = filterTracksByDateRange(allTracks, dateRange);

  const handleLoadTracks = async () => {
    startLoadingTransition(async () => {
      const tokenResult = await authClient.getAccessToken({ providerId: "spotify" });
      if (tokenResult.error || !tokenResult.data) {
        console.error("Failed to get access token");
        return;
      }
      const tracks = await fetchAllSavedTracks(tokenResult.data.accessToken);
      setAllTracks(tracks);
      trackCache.set(tracks);
    });
  };

  const createPlaylistAction = async (
    _prevState: PlaylistState,
    formData: FormData,
  ): Promise<PlaylistState> => {
    const name = formData.get("playlistName");
    if (typeof name !== "string" || name.trim() === "") {
      return { status: "error", message: "プレイリスト名を入力してください" };
    }

    if (filteredTracks.length === 0) {
      return { status: "error", message: "プレイリストに追加する曲がありません" };
    }

    const tokenResult = await authClient.getAccessToken({ providerId: "spotify" });
    if (tokenResult.error || !tokenResult.data) {
      return { status: "error", message: "認証エラーが発生しました" };
    }

    const trackUris = filteredTracks.map((t) => t.uri);
    try {
      const result = await createPlaylistFromTracks(
        tokenResult.data.accessToken,
        name.trim(),
        trackUris,
      );

      return {
        status: "success",
        message: "プレイリストを作成しました！",
        playlistUrl: result.playlistUrl,
      };
    } catch (e) {
      return {
        status: "error",
        message: e instanceof Error ? e.message : "プレイリスト作成中にエラーが発生しました",
      };
    }
  };

  const [playlistState, formAction, isPending] = useActionState(
    createPlaylistAction,
    initialPlaylistState,
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 md:p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold md:text-2xl">Playlist Creator</h1>
        <button
          type="button"
          onClick={() => {
            trackCache.clear();
            signOut();
          }}
          className="rounded-md px-4 py-2 text-sm text-text-subdued transition-colors hover:text-foreground"
        >
          ログアウト
        </button>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">1. お気に入り曲を読み込む</h2>
        <button
          type="button"
          onClick={handleLoadTracks}
          disabled={isLoadingTracks}
          className="w-full rounded-full bg-spotify-green px-6 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover disabled:opacity-50 md:w-auto"
        >
          {isLoadingTracks ? "読み込み中..." : allTracks.length > 0 ? "お気に入り曲を再取得" : "お気に入り曲を取得"}
        </button>
        {allTracks.length > 0 && (
          <p className="text-sm text-text-subdued">{allTracks.length}曲を取得しました</p>
        )}
      </section>

      {allTracks.length > 0 && (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">2. 期間を選択</h2>
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            <p className="text-sm text-text-subdued">選択期間: {filteredTracks.length}曲</p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">3. 曲を確認</h2>
            <TrackList tracks={filteredTracks} />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">4. プレイリストを作成</h2>
            <form action={formAction} className="flex flex-col gap-4">
              <input
                type="text"
                name="playlistName"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="プレイリスト名"
                className="rounded-md border border-border bg-card-bg px-4 py-3 text-foreground placeholder:text-text-subdued"
              />
              <button
                type="submit"
                disabled={isPending || filteredTracks.length === 0}
                className="rounded-full bg-spotify-green px-6 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover disabled:opacity-50"
              >
                {isPending ? "作成中..." : "プレイリストを作成"}
              </button>
            </form>

            {playlistState.status === "success" && (
              <div className="rounded-md bg-spotify-green/20 p-4">
                <p className="text-spotify-green">{playlistState.message}</p>
                {playlistState.playlistUrl && (
                  <a
                    href={playlistState.playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-spotify-green underline"
                  >
                    Spotifyで開く
                  </a>
                )}
              </div>
            )}

            {playlistState.status === "error" && (
              <p className="text-red-500">{playlistState.message}</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

const Page = () => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-subdued">読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginSection />;
  }

  return <MainContent />;
};

export default Page;
