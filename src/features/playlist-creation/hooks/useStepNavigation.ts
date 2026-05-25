import { useRouter, useSearchParams } from "next/navigation";

export const STEP_IDS = ["load", "date", "create"] as const;
export type StepId = (typeof STEP_IDS)[number];

const isStepId = (v: string | null): v is StepId =>
  v !== null && (STEP_IDS as ReadonlyArray<string>).includes(v);

const DEFAULT_STEP: StepId = "load";

export const useStepNavigation = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const param = searchParams.get("step");
  const currentStep: StepId = isStepId(param) ? param : DEFAULT_STEP;
  const currentIndex = STEP_IDS.indexOf(currentStep);

  const setStep = (next: StepId): void => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_STEP) {
      params.delete("step");
    } else {
      params.set("step", next);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?");
  };

  const goBack = (): void => {
    const prev = STEP_IDS[Math.max(0, currentIndex - 1)] ?? DEFAULT_STEP;
    setStep(prev);
  };

  const goNext = (): void => {
    const next = STEP_IDS[Math.min(STEP_IDS.length - 1, currentIndex + 1)] ?? DEFAULT_STEP;
    setStep(next);
  };

  return { currentStep, currentIndex, setStep, goBack, goNext };
};
