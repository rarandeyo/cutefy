"use client";

import { parseAsInteger, useQueryState } from "nuqs";

const MAX_STEP = 2;
const clamp = (n: number): number => Math.min(MAX_STEP, Math.max(0, n));

type StepNavigation = {
  currentStep: number;
  setCurrentStep: (s: number) => void;
  handleBack: () => void;
  handleNext: () => void;
};

export const useStepNavigation = (): StepNavigation => {
  const [step, setStep] = useQueryState("step", parseAsInteger.withDefault(0));

  return {
    currentStep: clamp(step),
    setCurrentStep: (s) => {
      void setStep(clamp(s));
    },
    handleBack: () => {
      void setStep((s) => clamp(s - 1));
    },
    handleNext: () => {
      void setStep((s) => clamp(s + 1));
    },
  };
};
