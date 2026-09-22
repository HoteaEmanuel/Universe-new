const UNITS: [number, string][] = [
  [1_000_000_000, "B"],
  [1_000_000, "M"],
  [1_000, "K"],
];

export const formatCount = (count: number): string => {
  const unit = UNITS.find(([value]) => count >= value);
  if (!unit) return `${count}`;

  const [value, suffix] = unit;
  const scaled = Math.floor((count / value) * 10) / 10;
  return `${Number.isInteger(scaled) ? scaled : scaled.toFixed(1)}${suffix}`;
};
