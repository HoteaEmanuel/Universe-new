export const Colors = {
  primary: "#6849a7",
  warning: "#cc475a",
  like: "#ed4956",

  dark: {
    text: "#d4d4d4",
    title: "#fff",
    background: "#030712",
    navBackground: "#030712",
    tabIconColour: "#9591a5",
    iconColour: "#9a02b0",
    iconMuted: "#a1a1a1",
    // Both borderColor and uiBackground are only ever read as a pair, by the
    // post card's own fill + outline — a dark violet tint at the same hue as
    // `primary` (#6849a7, ~260°) rather than a neutral gray, so the card
    // reads as on-brand instead of generic. Kept subtle (low saturation, low
    // lightness) so it stays a surface color, not a colored panel.
    borderColor: "#201a2e",
    tabIconColourFocused: "#fff",
    uiBackground: "#120f1a",
  },
  light: {
    text: "#6b6478",
    title: "#1c1a24",
    background: "#faf9fc",
    navBackground: "#faf9fc",
    tabIconColour: "#8a8598",
    iconColour: "#7a3dbf",
    iconMuted: "#9b96ab",
    // Mirrors dark's own borderColor/uiBackground pairing above: a light
    // violet tint at the same brand hue as `primary`, not a flat mid-gray -
    // keeps cards on-brand and the border a soft edge instead of the muddy,
    // too-dark line this replaced.
    borderColor: "#e6e1f0",
    tabIconColourFocused: "#1c1a24",
    uiBackground: "#f3f1f9",
  },
};
