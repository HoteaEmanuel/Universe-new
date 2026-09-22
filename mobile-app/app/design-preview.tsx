import { ScrollView, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Uniwind, useUniwind } from "uniwind";
import { tv } from "tailwind-variants";

// Dev-only preview route (/design-preview). Renders every design token and
// variant combination on a real device, which is the only way to confirm
// things the config can't tell us: that the oklch() values in global.css
// actually resolve to real colors under React Native, and that
// tailwind-variants composes through Uniwind's className pipeline.

const button = tv({
  base: "flex-row items-center justify-center gap-2 rounded-lg",
  variants: {
    variant: {
      primary: "bg-primary",
      secondary: "bg-secondary",
      destructive: "bg-destructive",
      outline: "border border-border bg-transparent",
      ghost: "bg-transparent",
    },
    size: {
      sm: "px-3 py-2",
      md: "px-4 py-3",
      lg: "px-6 py-4",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

const buttonLabel = tv({
  base: "font-semibold",
  variants: {
    variant: {
      primary: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      ghost: "text-foreground",
    },
    size: { sm: "text-sm", md: "text-base", lg: "text-lg" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

const SEMANTIC_TOKENS = [
  ["bg-background", "text-foreground"],
  ["bg-card", "text-card-foreground"],
  ["bg-popover", "text-popover-foreground"],
  ["bg-primary", "text-primary-foreground"],
  ["bg-secondary", "text-secondary-foreground"],
  ["bg-muted", "text-muted-foreground"],
  ["bg-accent", "text-accent-foreground"],
];

const STATUS_TOKENS = [
  ["bg-destructive", "text-destructive-foreground"],
  ["bg-success", "text-success-foreground"],
  ["bg-warning", "text-warning-foreground"],
  ["bg-info", "text-info-foreground"],
];

const BRAND_RAMP = [
  "bg-brand-50",
  "bg-brand-100",
  "bg-brand-200",
  "bg-brand-300",
  "bg-brand-400",
  "bg-brand-500",
  "bg-brand-600",
  "bg-brand-700",
  "bg-brand-800",
  "bg-brand-900",
  "bg-brand-950",
];

// Paired with the px values declared in global.css so a mismatch between the
// label and the rendered box is visible rather than silent.
const TYPE_SCALE = [
  ["text-2xs", "10 / 14"],
  ["text-xs", "12 / 16"],
  ["text-sm", "14 / 20"],
  ["text-base", "16 / 24"],
  ["text-lg", "18 / 28"],
  ["text-xl", "20 / 28"],
  ["text-2xl", "24 / 32"],
  ["text-3xl", "30 / 36"],
  ["text-4xl", "36 / 40"],
];

const NUMERIC_SPACING = [
  ["w-1", 4],
  ["w-2", 8],
  ["w-3", 12],
  ["w-4", 16],
  ["w-6", 24],
  ["w-8", 32],
  ["w-12", 48],
  ["w-16", 64],
];

const NAMED_SPACING = [
  ["w-stack", 12],
  ["w-gutter", 20],
  ["w-section", 32],
  ["w-touch", 44],
];

const FONTS = [
  ["font-poppins", "Poppins Regular"],
  ["font-poppins-medium", "Poppins Medium"],
  ["font-poppins-semibold", "Poppins SemiBold"],
  ["font-poppins-bold", "Poppins Bold"],
  ["font-kaushan", "Kaushan Script"],
];

const RADII = ["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl"];

const SHADOWS = ["shadow-card", "shadow-elevated", "shadow-modal"];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="gap-stack">
    <Text className="text-foreground text-lg font-bold">{title}</Text>
    {children}
  </View>
);

const DesignPreview = () => {
  const { theme } = useUniwind();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-section p-gutter pt-14">
        <View className="gap-2">
          <Text className="text-foreground text-2xl font-bold">Design tokens</Text>
          <Text className="text-muted-foreground">Active theme: {theme}</Text>
          <View className="flex-row gap-2">
            <Pressable
              className={button({ variant: "secondary", size: "sm" })}
              onPress={() => Uniwind.setTheme("light")}
            >
              <Text className={buttonLabel({ variant: "secondary", size: "sm" })}>Light</Text>
            </Pressable>
            <Pressable
              className={button({ variant: "secondary", size: "sm" })}
              onPress={() => Uniwind.setTheme("dark")}
            >
              <Text className={buttonLabel({ variant: "secondary", size: "sm" })}>Dark</Text>
            </Pressable>
            <Pressable
              className={button({ variant: "outline", size: "sm" })}
              onPress={() => Uniwind.setTheme("system")}
            >
              <Text className={buttonLabel({ variant: "outline", size: "sm" })}>System</Text>
            </Pressable>
          </View>
        </View>

        <Section title="Semantic colors">
          {SEMANTIC_TOKENS.map(([bg, fg]) => (
            <View
              key={bg}
              className={`${bg} h-14 justify-center rounded-lg border border-border px-4`}
            >
              <Text className={`${fg} font-semibold`}>{bg}</Text>
            </View>
          ))}
        </Section>

        <Section title="Status colors">
          {STATUS_TOKENS.map(([bg, fg]) => (
            <View key={bg} className={`${bg} h-14 justify-center rounded-lg px-4`}>
              <Text className={`${fg} font-semibold`}>{bg}</Text>
            </View>
          ))}
        </Section>

        <Section title="Brand ramp">
          <View className="flex-row flex-wrap gap-1">
            {BRAND_RAMP.map((bg) => (
              <View key={bg} className={`${bg} h-12 w-12 rounded-md`} />
            ))}
          </View>
        </Section>

        <Section title="Type scale">
          {TYPE_SCALE.map(([size, spec]) => (
            <View key={size} className="flex-row items-baseline gap-3">
              <Text className={`${size} text-foreground flex-1`}>Universe</Text>
              <Text className="text-2xs text-muted-foreground">
                {size} · {spec}
              </Text>
            </View>
          ))}
        </Section>

        <Section title="Font families">
          {FONTS.map(([font, label]) => (
            <Text key={font} className={`${font} text-foreground text-xl`}>
              {label}
            </Text>
          ))}
        </Section>

        <Section title="Spacing scale">
          {NUMERIC_SPACING.map(([cls, px]) => (
            <View key={cls as string} className="flex-row items-center gap-3">
              <View className={`${cls} h-4 rounded-sm bg-primary`} />
              <Text className="text-2xs text-muted-foreground">
                {cls} · {px}px
              </Text>
            </View>
          ))}
        </Section>

        <Section title="Named spacing">
          {NAMED_SPACING.map(([cls, px]) => (
            <View key={cls as string} className="flex-row items-center gap-3">
              <View className={`${cls} h-4 rounded-sm bg-accent-foreground`} />
              <Text className="text-2xs text-muted-foreground">
                {cls} · {px}px
              </Text>
            </View>
          ))}
        </Section>

        <Section title="Button variants">
          {(["primary", "secondary", "destructive", "outline", "ghost"] as const).map((variant) => (
            <View key={variant} className="flex-row items-center gap-2">
              {(["sm", "md", "lg"] as const).map((size) => (
                <Pressable key={size} className={button({ variant, size })}>
                  <Text className={buttonLabel({ variant, size })}>{variant}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </Section>

        <Section title="Radius scale">
          <View className="flex-row flex-wrap gap-2">
            {RADII.map((radius) => (
              <View
                key={radius}
                className={`${radius} h-16 w-24 items-center justify-center bg-card border border-border`}
              >
                <Text className="text-card-foreground text-xs">{radius}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Elevation">
          <View className="flex-row flex-wrap gap-4 p-2">
            {SHADOWS.map((shadow) => (
              <View
                key={shadow}
                className={`${shadow} h-16 w-24 items-center justify-center rounded-lg bg-card`}
              >
                <Text className="text-card-foreground text-2xs">{shadow}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Icon color from tokens">
          <View className="flex-row items-center gap-4 rounded-lg bg-card p-4 border border-border">
            <Ionicons name="heart" size={28} colorClassName="accent-like" />
            <Ionicons name="school" size={28} colorClassName="accent-primary" />
            <Ionicons name="checkmark-circle" size={28} colorClassName="accent-success" />
            <Ionicons name="alert-circle" size={28} colorClassName="accent-destructive" />
            <Text className="text-muted-foreground text-2xs">colorClassName + accent-</Text>
          </View>
        </Section>
      </View>
    </ScrollView>
  );
};

export default DesignPreview;
