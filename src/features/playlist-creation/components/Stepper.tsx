import { Button } from "@heroui/react";
import { Check } from "lucide-react";
import type React from "react";
import { Fragment } from "react";
import type { StepId } from "@/features/playlist-creation/hooks/useStepNavigation";

type Step = Readonly<{
  id: StepId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}>;

type StepperProps = Readonly<{
  steps: ReadonlyArray<Step>;
  currentIndex: number;
  onStepClick: (step: StepId) => void;
}>;

export const Stepper: React.FC<StepperProps> = ({ steps, currentIndex, onStepClick }) => (
  <nav className="flex items-center px-2 md:px-8">
    {steps.map((step, i) => (
      <Fragment key={step.id}>
        {i > 0 && (
          <div
            className={`h-[2px] flex-1 transition-colors duration-300 ${
              i <= currentIndex ? "bg-spotify-green" : "bg-border"
            }`}
          />
        )}
        <div className="flex flex-col items-center gap-1.5">
          <Button
            isIconOnly
            onPress={() => i < currentIndex && onStepClick(step.id)}
            isDisabled={i > currentIndex}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
              i < currentIndex
                ? "cursor-pointer bg-spotify-green text-black hover:bg-spotify-green-hover"
                : i === currentIndex
                  ? "bg-spotify-green text-black ring-4 ring-spotify-green/20"
                  : "border border-border bg-card-bg text-text-subdued"
            }`}
          >
            {i < currentIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </Button>
          <span
            className={`hidden text-xs font-medium md:block ${
              i <= currentIndex ? "text-foreground" : "text-text-subdued"
            }`}
          >
            {step.label}
          </span>
        </div>
      </Fragment>
    ))}
  </nav>
);
