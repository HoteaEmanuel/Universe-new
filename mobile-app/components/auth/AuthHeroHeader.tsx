import { View, Text, Image, useWindowDimensions } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Path } from "react-native-svg";
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
  // Matches the landing page's hero wash (frontend .cascade-page):
  // radial-gradient(circle at 16% 8%, ...). CSS's default "farthest-corner"
  // sizing means the circle's radius reaches whichever corner is furthest
  // from the center point — here that's the bottom-right one — so the
  // radius is computed the same way rather than hard-coded, otherwise the
  // gradient reads as a smaller, off-scale glow instead of a full wash.
  const centerX = width * 0.16;
  const centerY = height * 0.08;
  const radius = Math.hypot(width - centerX, height - centerY);

  return (
    <View style={{ height }}>
      <Svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          <RadialGradient
            id="heroGradient"
            cx={centerX}
            cy={centerY}
            r={radius}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={authPalette.heroGradient[0]} />
            <Stop offset={authPalette.heroGradientLocations[1]} stopColor={authPalette.heroGradient[1]} />
            <Stop offset={authPalette.heroGradientLocations[2]} stopColor={authPalette.heroGradient[2]} />
          </RadialGradient>
        </Defs>
        <Path
          d={roundedBottomRectPath(width, height, CORNER_RADIUS)}
          fill="url(#heroGradient)"
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
        <View className="items-center gap-1">
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
