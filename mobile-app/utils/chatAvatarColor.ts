// Mobile equivalent of frontend/src/features/chat/utils/avatarColor.ts —
// returns a hex value for `style={{ backgroundColor }}` instead of a
// Tailwind class string, matching this app's established Colors.js-for-
// actual-colors convention (see authPalette.ts) rather than reaching for
// arbitrary bg-* utilities. Palette and hash are mobile's own (not required
// to match web's fallback-color assignment 1:1).
const PALETTE = [
  "#f43f5e", // rose-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#0ea5e9", // sky-500
  "#8b5cf6", // violet-500
  "#d946ef", // fuchsia-500
  "#f97316", // orange-500
  "#14b8a6", // teal-500
  "#6366f1", // indigo-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
  "#06b6d4", // cyan-500
  "#a855f7", // purple-500
  "#ef4444", // red-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
];

// djb2 — better bit distribution across the byte range than a plain
// rolling sum, so adjacent seeds (e.g. sequential ids) don't cluster on the
// same few palette slots.
const djb2 = (seed: string) => {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  return hash >>> 0;
};

export const getAvatarColor = (seed: string) => PALETTE[djb2(seed) % PALETTE.length];

export const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};
