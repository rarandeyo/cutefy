import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";

type StepNavProps = {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
};

export const StepNav: React.FC<StepNavProps> = ({
  onBack,
  onNext,
  nextLabel = "次へ",
  nextDisabled = false,
}) => (
  <div className="flex shrink-0 items-center justify-between pt-6">
    {onBack ? (
      <Button
        variant="ghost"
        onPress={onBack}
        className="flex items-center gap-1 rounded-md px-4 py-2 text-sm text-text-subdued transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        戻る
      </Button>
    ) : (
      <div />
    )}
    {onNext && (
      <Button
        onPress={onNext}
        isDisabled={nextDisabled}
        className="flex items-center gap-1 rounded-full bg-spotify-green px-6 py-2.5 font-semibold text-black transition-colors hover:bg-spotify-green-hover data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40"
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4" />
      </Button>
    )}
  </div>
);
