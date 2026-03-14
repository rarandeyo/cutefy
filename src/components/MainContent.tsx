"use client";

import type React from "react";
import { Button } from "@heroui/react";
import { ListMusic, LogOut, Music, Sparkles } from "lucide-react";
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
  const { allTracks, isLoadingTracks, handleLoadTracks } = useSavedTracks();
  const { currentStep, setCurrentStep, goBack, goNext } = useStepNavigation(
    allTracks.length > 0 ? 1 : 0,
  );
  const { dateRange, filteredTracks, setStartDate, setEndDate } = useDateFilter(allTracks);
  const {
    playlistName,
    setPlaylistName,
    playlistState,
    isCreatingPlaylist,
    handleCreatePlaylist,
    handleReset,
  } = usePlaylistCreation(filteredTracks);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col p-4 md:p-8">
      <header className="flex items-center justify-between pb-8">
        <h1 className="text-lg font-bold tracking-tight md:text-xl">Playlist Creator</h1>
        <Button
          variant="ghost"
          onPress={() => {
            trackCache.clear();
            signOut();
          }}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-text-subdued transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">ログアウト</span>
        </Button>
      </header>

      <Stepper steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

      <div className="mt-8 flex-1">
        <div key={currentStep} className="animate-[fade-in_0.3s_ease-out]">
          {currentStep === 0 && (
            <LoadTracksStep
              isLoading={isLoadingTracks}
              trackCount={allTracks.length}
              onLoadTracks={() => handleLoadTracks(goNext)}
              onNext={goNext}
            />
          )}
          {currentStep === 1 && (
            <SelectDateStep
              dateRange={dateRange}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              filteredTracks={filteredTracks}
              onBack={goBack}
              onNext={goNext}
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
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </div>
  );
};
