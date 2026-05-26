"use client";

import { useRef } from "react";
import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight, ListMusic, Music, Sparkles } from "lucide-react";
import { CreatePlaylistStep } from "@/components/CreatePlaylistStep";
import { LoadTracksStep } from "@/components/LoadTracksStep";
import { SelectDateStep } from "@/components/SelectDateStep";
import { Stepper } from "@/components/Stepper";
import { useDateFilter } from "@/hooks/useDateFilter";
import { usePlaylistCreation } from "@/hooks/usePlaylistCreation";
import { useSavedTracks } from "@/hooks/useSavedTracks";
import { useStepNavigation } from "@/hooks/useStepNavigation";

const STEPS = [
  { label: "曲を取得", icon: Music },
  { label: "期間・確認", icon: ListMusic },
  { label: "作成", icon: Sparkles },
] as const;

export const WizardSteps: React.FC = () => {
  const goNextRef = useRef<() => void>(undefined);

  const { allTracks, isLoadingTracks, handleLoadTracks, error } = useSavedTracks(() =>
    goNextRef.current?.(),
  );
  const { currentStep, setCurrentStep, goBack, goNext } = useStepNavigation();
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
    <>
      <Stepper steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

      <div className="mt-4 min-h-0 flex-1">
        <div key={currentStep} className="h-full animate-[fade-in_0.3s_ease-out]">
          {currentStep === 0 && (
            <LoadTracksStep
              isLoading={isLoadingTracks}
              trackCount={allTracks.length}
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
    </>
  );
};
