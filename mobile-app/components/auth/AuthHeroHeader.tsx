import { View, Text, Image, useWindowDimensions } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo1 from "../../assets/logo_1.png";
import { authPalette } from "./authPalette";

type AuthHeroHeaderProps = {
  tagline: string;
};

const CORNER_RADIUS = 44;
const BASE_HEIGHT = 296;

// Rounded-bottom-corners-only rect as an explicit SVG path, in absolute
// pixel coordinates. Earlier this drew a plain <Rect width="100%"
// height="100%"> behind the content and relied on the parent View's
// overflow: hidden + borderBottomLeftRadius/borderBottomRightRadius to clip
// it into shape — on-device that rendered as a hard-edged, incorrectly
// sized rectangle instead: percentage width/height on <Svg> itself resolves
// against the SVG's own intrinsic size rather than reliably tracking the
// parent's actual laid-out pixel size, and Android doesn't consistently
// clip a sibling native (non-View) child to a parent's rounded overflow
// either. Drawing the rounded shape directly in the path, sized from
// useWindowDimensions() rather than percentages, doesn't depend on either.
const roundedBottomRectPath = (width: number, height: number, radius: number) =>
  `M0,0 H${width} V${height - radius} A${radius},${radius} 0 0 1 ${width - radius},${height} H${radius} A${radius},${radius} 0 0 1 0,${height - radius} Z`;

const AuthHeroHeader = ({ tagline }: AuthHeroHeaderProps) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const height = BASE_HEIGHT + insets.top;
  // Same corner-glow accents the approved mockup had (radial-gradient, CSS
  // only) — the flat 3-stop linear gradient that shipped instead of them is
  // what read as empty. Circles with real pixel cx/cy/r rather than "%" on
  // the shape itself, same reasoning as the path above.
  const glowSize = Math.max(width, height);

  return (
    <View style={{ height }}>
      <Svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          <LinearGradient id="heroGradient" x1="10%" y1="0%" x2="75%" y2="100%">
            <Stop offset="0%" stopColor={authPalette.heroGradient[0]} />
            <Stop offset="48%" stopColor={authPalette.heroGradient[1]} />
            <Stop offset="100%" stopColor={authPalette.heroGradient[2]} />
          </LinearGradient>
          <RadialGradient id="heroGlowLight" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="heroGlowAccent" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#d946ef" stopOpacity={0.28} />
            <Stop offset="100%" stopColor="#d946ef" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Path
          d={roundedBottomRectPath(width, height, CORNER_RADIUS)}
          fill="url(#heroGradient)"
        />
        <Circle
          cx={width * 0.12}
          cy={height * 0.08}
          r={glowSize * 0.42}
          fill="url(#heroGlowLight)"
        />
        <Circle
          cx={width * 0.92}
          cy={height * 0.9}
          r={glowSize * 0.46}
          fill="url(#heroGlowAccent)"
        />
      </Svg>

      <View
        style={{
          flex: 1,
          paddingTop: Math.max(44, insets.top + 12),
          paddingBottom: 20,
          paddingHorizontal: 24,
        }}
        className="items-center justify-center gap-3"
      >
        <View className="flex-row items-center gap-3">
          <View
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Image source={Logo1} style={{ width: 64, height: 64 }} resizeMode="contain" />
          </View>
          <Text
            className="font-kaushan text-white"
            style={{ fontSize: 46, lineHeight: 52 }}
          >
            Universe
          </Text>
        </View>
        <Text className="text-base font-medium text-white/90" style={{ letterSpacing: 0.3 }}>
          {tagline}
        </Text>
      </View>
    </View>
  );
};

export default AuthHeroHeader;
