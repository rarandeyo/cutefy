"use client";

import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight, ListMusic, Music, Sparkles } from "lucide-react";
import { CreatePlaylistStep } from "./CreatePlaylistStep";
import { LoadTracksStep } from "./LoadTracksStep";
import { SelectDateStep } from "./SelectDateStep";
import { Stepper, type Step } from "./Stepper";
import { useDateFilter } from "@/features/playlist-wizard/hooks/use-date-filter";
import { usePlaylistCreation } from "@/features/playlist-wizard/hooks/use-playlist-creation";
import { useSavedTracks } from "@/features/playlist-wizard/hooks/use-saved-tracks";
import { useStepNavigation } from "@/features/playlist-wizard/hooks/use-step-navigation";
import type { TrackWithAddedAt } from "@/shared/lib/spotify";

const STEPS = [
  { label: "曲を取得", icon: Music },
  { label: "期間・確認", icon: ListMusic },
  { label: "作成", icon: Sparkles },
] as const satisfies readonly Step[];

type WizardStepsProps = {
  initialTracks: readonly TrackWithAddedAt[];
};

export const WizardSteps: React.FC<WizardStepsProps> = ({ initialTracks }) => {
  const { state: tracksState, handleLoadTracks } = useSavedTracks(initialTracks);
  const { currentStep, setCurrentStep, handleBack, handleNext } = useStepNavigation();

  const {
    dateRange,
    filteredTracks,
    setDateRangeValue,
    handleApplyPreset,
    activePreset,
    validation,
    sortOrder,
    handleToggleSortOrder,
  } = useDateFilter(tracksState.tracks);
  const { playlistName, setPlaylistName, playlistState, handleCreatePlaylist, handleReset } =
    usePlaylistCreation(filteredTracks, dateRange);

  const nextDisabled =
    currentStep === 1 && (filteredTracks.length === 0 || validation.status === "invalid");

  return (
    <>
      <Stepper steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

      <div className="mt-4 min-h-0 flex-1">
        <div key={currentStep} className="h-full animate-[fade-in_0.3s_ease-out]">
          {currentStep === 0 && (
            <LoadTracksStep
              state={tracksState}
              onLoadTracks={handleLoadTracks}
              onNext={handleNext}
            />
          )}
          {currentStep === 1 && (
            <SelectDateStep
              dateRange={dateRange}
              onDateRangeChange={setDateRangeValue}
              onApplyPreset={handleApplyPreset}
              activePreset={activePreset}
              validation={validation}
              filteredTracks={filteredTracks}
              sortOrder={sortOrder}
              onToggleSortOrder={handleToggleSortOrder}
            />
          )}
          {currentStep === 2 && (
            <CreatePlaylistStep
              playlistName={playlistName}
              onPlaylistNameChange={setPlaylistName}
              playlistState={playlistState}
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
          onPress={handleBack}
          className={`flex items-center gap-1 rounded-md px-4 py-2 text-sm text-text-subdued transition-colors hover:text-foreground ${currentStep === 0 ? "invisible" : ""}`}
        >
          <ChevronLeft className="h-4 w-4" />
          戻る
        </Button>
        <Button
          onPress={handleNext}
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
