// Auth screens are a fixed, branded moment (matching the confirmed "Hero +
// Glass" direction from the design-preview review) rather than a themed
// surface — they don't switch with light/dark like the rest of the app, the
// same way frontend/src/auth/components/AuthCard.tsx hardcodes its own
// bespoke colors instead of pulling from the semantic token set. These are
// the exact values approved in that review; centralized here so
// AuthHeroHeader/AuthCard/AuthTextField/GoogleButton and both screens share
// one source instead of repeating raw hex/rgba through JSX.
export const authPalette = {
  pageBg: "#0a0710",
  // Same radial wash as the frontend landing page's hero
  // (frontend/src/index.css .cascade-page: radial-gradient(circle at 16%
  // 8%, #4e286f 0, #24113f 28%, #160a2a 60%)) — kept in sync so the mobile
  // auth screens and the marketing site open on the same background.
  heroGradient: ["#4e286f", "#24113f", "#160a2a"] as const,
  heroGradientLocations: [0, 0.28, 0.6] as const,
  cardBg: "rgba(20,16,26,0.62)",
  cardBorder: "rgba(166,132,255,0.16)",
  fieldBg: "rgba(255,255,255,0.06)",
  fieldBorder: "rgba(255,255,255,0.12)",
  divider: "rgba(255,255,255,0.12)",
  googleBorder: "rgba(255,255,255,0.15)",
  googleBg: "rgba(255,255,255,0.04)",
  textPrimary: "#fafafa",
  textMuted: "#a1a1a1",
  textLabel: "#d4d4d4",
  textHint: "#8a8a8a",
  link: "#c4b4ff",
  ctaBg: "#fafafa",
  ctaText: "#5d0ec0",
  error: "#ff8a8a",
} as const;
