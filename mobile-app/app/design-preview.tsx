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
      destructive: "text-white",
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
  ["bg-destructive", "text-white"],
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

const RADII = ["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl"];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="gap-3">
    <Text className="text-foreground text-lg font-bold">{title}</Text>
    {children}
  </View>
);

const DesignPreview = () => {
  const { theme } = useUniwind();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-8 p-5 pt-14">
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

        <Section title="Brand ramp">
          <View className="flex-row flex-wrap gap-1">
            {BRAND_RAMP.map((bg) => (
              <View key={bg} className={`${bg} h-12 w-12 rounded-md`} />
            ))}
          </View>
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

        <Section title="Icon color from tokens">
          <View className="flex-row items-center gap-4 rounded-lg bg-card p-4 border border-border">
            <Ionicons name="heart" size={28} colorClassName="accent-like" />
            <Ionicons name="school" size={28} colorClassName="accent-primary" />
            <Ionicons name="alert-circle" size={28} colorClassName="accent-destructive" />
            <Text className="text-muted-foreground text-xs">colorClassName + accent-</Text>
          </View>
        </Section>
      </View>
    </ScrollView>
  );
};

export default DesignPreview;
