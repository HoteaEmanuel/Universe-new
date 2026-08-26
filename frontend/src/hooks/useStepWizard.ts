import { useState } from "react";

export const useStepWizard = (totalSteps: number) => {
  const [stepIndex, setStepIndex] = useState(0);
  const clampedIndex = Math.min(stepIndex, totalSteps - 1);
  const isFirstStep = clampedIndex === 0;
  const isLastStep = clampedIndex === totalSteps - 1;

  const goNext = () => setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));
  const reset = () => setStepIndex(0);

  return {
    stepIndex: clampedIndex,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    setStepIndex,
    reset,
  };
};
