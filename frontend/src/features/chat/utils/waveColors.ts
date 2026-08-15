export const resolveCssColor = (
  variableName: string,
  fallback: string,
  element?: HTMLElement,
) => {
  if (typeof window === "undefined") return fallback;
  const target = element ?? document.documentElement;
  const value = getComputedStyle(target).getPropertyValue(variableName).trim();
  return value || fallback;
};

export const formatAudioDuration = (seconds: number) => {
  const total = Math.max(0, Math.round(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
