"use client";

import { Fragment, useState, useSyncExternalStore, useTransition } from "react";
import { authClient, signInWithSpotify, signOut, useSession } from "@/lib/auth-client";
import {
  createPlaylistFromTracks,
  type DateRange,
  fetchAllSavedTracks,
  filterTracksByDateRange,
  type TrackWithAddedAt,
} from "@/lib/spotify";
import { trackCache } from "@/lib/track-cache";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ListMusic,
  Loader2,
  LogOut,
  Music,
  Sparkles,
} from "lucide-react";

type PlaylistState = {
  status: "idle" | "success" | "error";
  message: string;
  playlistUrl?: string;
};

const initialPlaylistState: PlaylistState = {
  status: "idle",
  message: "",
};

const STEPS = [
  { label: "曲を取得", icon: Music },
  { label: "期間・確認", icon: ListMusic },
  { label: "作成", icon: Sparkles },
];

const getDefaultDateRange = (): DateRange => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  return { startDate, endDate };
};

// ============ Login ============

const LoginSection = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-spotify-green">
        <Music className="h-8 w-8 text-black" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Playlist Creator</h1>
      <p className="text-center text-text-subdued">
        お気に入りの曲から期間を指定してプレイリストを作成
      </p>
    </div>
    <button
      type="button"
      onClick={() => signInWithSpotify()}
      className="rounded-full bg-spotify-green px-8 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover"
    >
      Spotifyでログイン
    </button>
  </div>
);

// ============ Stepper ============

type StepperProps = {
  currentStep: number;
  onStepClick: (step: number) => void;
};

const Stepper = ({ currentStep, onStepClick }: StepperProps) => (
  <nav className="flex items-center px-2 md:px-8">
    {STEPS.map((step, i) => (
      <Fragment key={step.label}>
        {i > 0 && (
          <div
            className={`h-[2px] flex-1 transition-colors duration-300 ${
              i <= currentStep ? "bg-spotify-green" : "bg-border"
            }`}
          />
        )}
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => i < currentStep && onStepClick(i)}
            disabled={i > currentStep}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 ${
              i < currentStep
                ? "cursor-pointer bg-spotify-green text-black hover:bg-spotify-green-hover"
                : i === currentStep
                  ? "bg-spotify-green text-black ring-4 ring-spotify-green/20"
                  : "border border-border bg-card-bg text-text-subdued"
            }`}
          >
            {i < currentStep ? <Check className="h-5 w-5" /> : i + 1}
          </button>
          <span
            className={`hidden text-xs font-medium md:block ${
              i <= currentStep ? "text-foreground" : "text-text-subdued"
            }`}
          >
            {step.label}
          </span>
        </div>
      </Fragment>
    ))}
  </nav>
);

// ============ Navigation Buttons ============

type StepNavProps = {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
};

const StepNav = ({ onBack, onNext, nextLabel = "次へ", nextDisabled = false }: StepNavProps) => (
  <div className="flex items-center justify-between pt-6">
    {onBack ? (
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 rounded-md px-4 py-2 text-sm text-text-subdued transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        戻る
      </button>
    ) : (
      <div />
    )}
    {onNext && (
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="flex items-center gap-1 rounded-full bg-spotify-green px-6 py-2.5 font-semibold text-black transition-colors hover:bg-spotify-green-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4" />
      </button>
    )}
  </div>
);

// ============ Completion Screen ============

type CompletionScreenProps = {
  playlistUrl?: string | undefined;
  trackCount: number;
  onReset: () => void;
};

const CompletionScreen = ({ playlistUrl, trackCount, onReset }: CompletionScreenProps) => (
  <div className="flex flex-col items-center justify-center gap-8 py-16 animate-[fade-in_0.5s_ease-out]">
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
    {playlistUrl && (
      <a
        href={playlistUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-full bg-spotify-green px-8 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover"
      >
        Spotifyで開く
        <ExternalLink className="h-4 w-4" />
      </a>
    )}
    <button
      type="button"
      onClick={onReset}
      className="text-sm text-text-subdued transition-colors hover:text-foreground"
    >
      別のプレイリストを作成
    </button>
  </div>
);

// ============ Main Content ============

const MainContent = () => {
  const cachedTracks = useSyncExternalStore(
    trackCache.subscribe,
    trackCache.getSnapshot,
    trackCache.getServerSnapshot,
  );
  const [currentStep, setCurrentStep] = useState(() =>
    cachedTracks && cachedTracks.length > 0 ? 1 : 0,
  );
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [allTracks, setAllTracks] = useState<TrackWithAddedAt[]>(() => cachedTracks ?? []);
  const [isLoadingTracks, startLoadingTransition] = useTransition();
  const [playlistName, setPlaylistName] = useState("");
  const [playlistState, setPlaylistState] = useState<PlaylistState>(initialPlaylistState);
  const [isCreating, setIsCreating] = useState(false);

  const filteredTracks = filterTracksByDateRange(allTracks, dateRange);

  const handleLoadTracks = () => {
    startLoadingTransition(async () => {
      const tokenResult = await authClient.getAccessToken({ providerId: "spotify" });
      if (tokenResult.error || !tokenResult.data) {
        console.error("Failed to get access token");
        return;
      }
      const tracks = await fetchAllSavedTracks(tokenResult.data.accessToken);
      setAllTracks(tracks);
      trackCache.set(tracks);
      setCurrentStep(1);
    });
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim() || filteredTracks.length === 0) return;

    setIsCreating(true);
    try {
      const tokenResult = await authClient.getAccessToken({ providerId: "spotify" });
      if (tokenResult.error || !tokenResult.data) {
        setPlaylistState({ status: "error", message: "認証エラーが発生しました" });
        return;
      }

      const trackUris = filteredTracks.map((t) => t.uri);
      const result = await createPlaylistFromTracks(
        tokenResult.data.accessToken,
        playlistName.trim(),
        trackUris,
      );

      setPlaylistState({
        status: "success",
        message: "プレイリストを作成しました！",
        playlistUrl: result.playlistUrl,
      });
    } catch (e) {
      setPlaylistState({
        status: "error",
        message: e instanceof Error ? e.message : "プレイリスト作成中にエラーが発生しました",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setPlaylistName("");
    setPlaylistState(initialPlaylistState);
    setCurrentStep(1);
  };

  const goBack = () => setCurrentStep((s) => Math.max(0, s - 1));
  const goNext = () => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1));

  const formatDateForInput = (date: Date): string => date.toISOString().split("T")[0] ?? "";

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col items-center gap-8 py-12">
            <div className="text-center">
              <h2 className="text-xl font-bold">お気に入り曲を読み込む</h2>
              <p className="mt-2 text-sm text-text-subdued">Spotifyに保存した曲を取得します</p>
            </div>
            <button
              type="button"
              onClick={handleLoadTracks}
              disabled={isLoadingTracks}
              className="flex items-center gap-2 rounded-full bg-spotify-green px-8 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover disabled:opacity-50"
            >
              {isLoadingTracks ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  読み込み中...
                </>
              ) : (
                <>
                  <Music className="h-5 w-5" />
                  {allTracks.length > 0 ? "お気に入り曲を再取得" : "お気に入り曲を取得"}
                </>
              )}
            </button>
            {allTracks.length > 0 && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-text-subdued">
                  <span className="font-semibold text-spotify-green">{allTracks.length}</span>{" "}
                  曲を取得済み
                </p>
                <StepNav onNext={goNext} />
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col gap-6 py-6">
            <div>
              <h2 className="text-xl font-bold">期間を選択して曲を確認</h2>
              <p className="mt-1 text-sm text-text-subdued">
                プレイリストに含める曲の追加期間を指定
              </p>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="startDate" className="text-sm font-medium text-text-subdued">
                  開始日
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={formatDateForInput(dateRange.startDate)}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      startDate: new Date(e.target.value),
                    }))
                  }
                  className="rounded-lg border border-border bg-card-bg px-4 py-2.5 text-foreground transition-colors focus:border-spotify-green focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="endDate" className="text-sm font-medium text-text-subdued">
                  終了日
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formatDateForInput(dateRange.endDate)}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      endDate: new Date(e.target.value),
                    }))
                  }
                  className="rounded-lg border border-border bg-card-bg px-4 py-2.5 text-foreground transition-colors focus:border-spotify-green focus:outline-none"
                />
              </div>
              <p className="text-sm text-text-subdued md:pb-1">
                <span className="font-semibold text-foreground">{filteredTracks.length}</span> 曲
              </p>
            </div>
            <div
              className="flex flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-card-bg p-2"
              style={{ maxHeight: "calc(100vh - 420px)" }}
            >
              {filteredTracks.length === 0 ? (
                <p className="py-12 text-center text-text-subdued">指定期間内の曲がありません</p>
              ) : (
                filteredTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 rounded-md p-2.5 transition-colors hover:bg-card-bg-hover"
                  >
                    {track.albumImageUrl && (
                      <img
                        src={track.albumImageUrl}
                        alt={track.albumName}
                        className="h-10 w-10 rounded"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{track.name}</p>
                      <p className="truncate text-xs text-text-subdued">{track.artists}</p>
                    </div>
                    <p className="shrink-0 text-xs tabular-nums text-text-subdued">
                      {track.addedAt.toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
            <StepNav onBack={goBack} onNext={goNext} nextDisabled={filteredTracks.length === 0} />
          </div>
        );

      case 2:
        if (playlistState.status === "success") {
          return (
            <CompletionScreen
              playlistUrl={playlistState.playlistUrl}
              trackCount={filteredTracks.length}
              onReset={handleReset}
            />
          );
        }
        return (
          <div className="flex flex-col gap-6 py-8">
            <div>
              <h2 className="text-xl font-bold">プレイリストを作成</h2>
              <p className="mt-1 text-sm text-text-subdued">
                {filteredTracks.length} 曲のプレイリストを作成します
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="プレイリスト名を入力"
                className="rounded-lg border border-border bg-card-bg px-4 py-3 text-foreground placeholder:text-text-subdued transition-colors focus:border-spotify-green focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreatePlaylist}
                disabled={isCreating || !playlistName.trim() || filteredTracks.length === 0}
                className="flex items-center justify-center gap-2 rounded-full bg-spotify-green px-6 py-3 font-semibold text-black transition-colors hover:bg-spotify-green-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    作成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    プレイリストを作成
                  </>
                )}
              </button>
            </div>
            {playlistState.status === "error" && (
              <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                {playlistState.message}
              </p>
            )}
            <StepNav onBack={goBack} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col p-4 md:p-8">
      <header className="flex items-center justify-between pb-8">
        <h1 className="text-lg font-bold tracking-tight md:text-xl">Playlist Creator</h1>
        <button
          type="button"
          onClick={() => {
            trackCache.clear();
            signOut();
          }}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-text-subdued transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">ログアウト</span>
        </button>
      </header>

      <Stepper currentStep={currentStep} onStepClick={setCurrentStep} />

      <div className="mt-8 flex-1">
        <div key={currentStep} className="animate-[fade-in_0.3s_ease-out]">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

// ============ Page ============

const Page = () => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-subdued" />
      </div>
    );
  }

  if (!session) {
    return <LoginSection />;
  }

  return <MainContent />;
};

export default Page;
