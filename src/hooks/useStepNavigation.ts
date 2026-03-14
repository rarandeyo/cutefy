import { useState } from "react";

const MAX_STEP = 2;

export const useStepNavigation = (initialStep: number) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const goBack = () => setCurrentStep((s) => Math.max(0, s - 1));
  const goNext = () => setCurrentStep((s) => Math.min(MAX_STEP, s + 1));

  return { currentStep, setCurrentStep, goBack, goNext };
};
