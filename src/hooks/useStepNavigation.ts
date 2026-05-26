"use client";

import { parseAsInteger, useQueryState } from "nuqs";

const MAX_STEP = 2;
const clamp = (n: number) => Math.min(MAX_STEP, Math.max(0, n));

export const useStepNavigation = () => {
  const [step, setStep] = useQueryState("step", parseAsInteger.withDefault(0));

  return {
    currentStep: clamp(step),
    setCurrentStep: (s: number) => setStep(clamp(s)),
    goBack: () => setStep((s) => clamp(s - 1)),
    goNext: () => setStep((s) => clamp(s + 1)),
  };
};
