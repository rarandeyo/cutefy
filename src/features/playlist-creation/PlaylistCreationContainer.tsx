"use client";

import type React from "react";
import { Button } from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
  Github,
  ListMusic,
  LogOut,
  Music,
  Settings,
  Sparkles,
} from "lucide-react";

import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { trackCache } from "@/lib/track-cache";
import { useDateFilter } from "./hooks/useDateFilter";
import { usePlaylistCreation } from "./hooks/usePlaylistCreation";
import { useSavedTracks } from "./hooks/useSavedTracks";
import { type StepId, useStepNavigation } from "./hooks/useStepNavigation";
import { CreatePlaylistStep } from "./components/CreatePlaylistStep";
import { LoadTracksStep } from "./components/LoadTracksStep";
import { SelectDateStep } from "./components/SelectDateStep";
import { Stepper } from "./components/Stepper";

const STEPS = [
  { id: "load", label: "曲を取得", icon: Music },
  { id: "date", label: "期間・確認", icon: ListMusic },
  { id: "create", label: "作成", icon: Sparkles },
] as const satisfies ReadonlyArray<{
  id: StepId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}>;

export const PlaylistCreationContainer: React.FC = () => {
  const { currentStep, currentIndex, setStep, goBack, goNext } = useStepNavigation();

  const { state: tracksState, handleLoadTracks } = useSavedTracks(() => setStep("date"));

  const {
    dateRange,
    filteredTracks,
    setDateRangeValue,
    applyPreset,
    activePreset,
    isDateRangeValid,
    dateError,
    sortOrder,
    toggleSortOrder,
  } = useDateFilter(tracksState.tracks);

  const {
    playlistName,
    setPlaylistName,
    playlistState,
    isCreatingPlaylist,
    handleCreatePlaylist,
    handleReset,
  } = usePlaylistCreation(filteredTracks, dateRange);

  const nextDisabled = currentStep === "date" && (filteredTracks.length === 0 || !isDateRangeValid);
  const hideNextButton = currentStep === "load" || currentStep === "create";

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col overflow-hidden p-4 md:p-8">
      <header className="flex items-center justify-between pb-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight md:text-xl hover:opacity-80 transition-opacity"
        >
          Cutefy
        </Link>
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/rarandeyo/create-spotify-playlist"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-foreground transition-colors hover:bg-white/20"
          >
            <Github className="h-4 w-4" />
          </a>
          <Link
            href="/app/settings"
            aria-label="設定"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-foreground transition-colors hover:bg-white/20"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="ログアウト"
            onPress={() => {
              trackCache.clear();
              signOut().catch(console.error);
            }}
            className="bg-white/10 text-foreground hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <Stepper steps={STEPS} currentIndex={currentIndex} onStepClick={setStep} />

      <div className="mt-4 min-h-0 flex-1">
        <div key={currentStep} className="h-full animate-[fade-in_0.3s_ease-out]">
          {currentStep === "load" && (
            <LoadTracksStep state={tracksState} onLoadTracks={handleLoadTracks} onNext={goNext} />
          )}
          {currentStep === "date" && (
            <SelectDateStep
              dateRange={dateRange}
              onDateRangeChange={setDateRangeValue}
              onApplyPreset={applyPreset}
              activePreset={activePreset}
              dateError={dateError}
              filteredTracks={filteredTracks}
              sortOrder={sortOrder}
              onToggleSortOrder={toggleSortOrder}
            />
          )}
          {currentStep === "create" && (
            <CreatePlaylistStep
              playlistName={playlistName}
              onPlaylistNameChange={setPlaylistName}
              playlistState={playlistState}
              isCreating={isCreatingPlaylist}
              filteredTrackCount={filteredTracks.length}
              onCreatePlaylist={handleCreatePlaylist}
              onReset={() => handleReset(() => setStep("date"))}
            />
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between pt-4">
        <Button
          variant="ghost"
          onPress={goBack}
          className={`flex items-center gap-1 rounded-md px-4 py-2 text-sm text-text-subdued transition-colors hover:text-foreground ${currentStep === "load" ? "invisible" : ""}`}
        >
          <ChevronLeft className="h-4 w-4" />
          戻る
        </Button>
        <Button
          onPress={goNext}
          isDisabled={nextDisabled}
          className={`flex items-center gap-1 rounded-full bg-spotify-green px-6 py-2.5 font-semibold text-black transition-colors hover:bg-spotify-green-hover disabled:cursor-not-allowed disabled:opacity-40 ${hideNextButton ? "invisible" : ""}`}
        >
          次へ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
