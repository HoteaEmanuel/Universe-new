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
    text: "#625f72",
    title: "#201e2b",
    background: "#e0dfe8",
    navBackground: "#e8e7ef",
    tabIconColour: "#686477",
    iconColour: "#680477",
    iconMuted: "#71717a",
    borderColor: "#9591a5",
    tabIconColourFocused: "#201e2b",
    uiBackground: "#d6d5e1",
  },
};
