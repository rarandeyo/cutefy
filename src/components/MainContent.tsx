"use client";

import type React from "react";
import { useRef } from "react";
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
import { useStepNavigation } from "@/hooks/useStepNavigation";
import { useSavedTracks } from "@/hooks/useSavedTracks";
import { useDateFilter } from "@/hooks/useDateFilter";
import { usePlaylistCreation } from "@/hooks/usePlaylistCreation";
import { Stepper } from "@/components/Stepper";
import { LoadTracksStep } from "@/components/LoadTracksStep";
import { SelectDateStep } from "@/components/SelectDateStep";
import { CreatePlaylistStep } from "@/components/CreatePlaylistStep";

const STEPS = [
  { label: "曲を取得", icon: Music },
  { label: "期間・確認", icon: ListMusic },
  { label: "作成", icon: Sparkles },
] as const;

export const MainContent: React.FC = () => {
  const goNextRef = useRef<() => void>(undefined);

  const { allTracks, isLoadingTracks, handleLoadTracks, progress, error } = useSavedTracks(() =>
    goNextRef.current?.(),
  );
  const { currentStep, setCurrentStep, goBack, goNext } = useStepNavigation(
    allTracks.length > 0 ? 1 : 0,
  );
  goNextRef.current = goNext;

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
  } = useDateFilter(allTracks);
  const {
    playlistName,
    setPlaylistName,
    playlistState,
    isCreatingPlaylist,
    handleCreatePlaylist,
    handleReset,
  } = usePlaylistCreation(filteredTracks, dateRange);

  const nextDisabled = currentStep === 1 && (filteredTracks.length === 0 || !isDateRangeValid);

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

      <Stepper steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

      <div className="mt-4 min-h-0 flex-1">
        <div key={currentStep} className="h-full animate-[fade-in_0.3s_ease-out]">
          {currentStep === 0 && (
            <LoadTracksStep
              isLoading={isLoadingTracks}
              trackCount={allTracks.length}
              progress={progress}
              error={error}
              onLoadTracks={handleLoadTracks}
              onNext={goNext}
            />
          )}
          {currentStep === 1 && (
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
          {currentStep === 2 && (
            <CreatePlaylistStep
              playlistName={playlistName}
              onPlaylistNameChange={setPlaylistName}
              playlistState={playlistState}
              isCreating={isCreatingPlaylist}
              filteredTrackCount={filteredTracks.length}
              onCreatePlaylist={handleCreatePlaylist}
              onReset={() => handleReset(() => setCurrentStep(1))}
            />
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between pt-4">
        <Button
          variant="ghost"
          onPress={goBack}
          className={`flex items-center gap-1 rounded-md px-4 py-2 text-sm text-text-subdued transition-colors hover:text-foreground ${currentStep === 0 ? "invisible" : ""}`}
        >
          <ChevronLeft className="h-4 w-4" />
          戻る
        </Button>
        <Button
          onPress={goNext}
          isDisabled={nextDisabled}
          className={`flex items-center gap-1 rounded-full bg-spotify-green px-6 py-2.5 font-semibold text-black transition-colors hover:bg-spotify-green-hover disabled:cursor-not-allowed disabled:opacity-40 ${currentStep === 0 || currentStep === 2 ? "invisible" : ""}`}
        >
          次へ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
