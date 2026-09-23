import { useEffect, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  interpolate,
  interpolateColor,
  Extrapolation,
  useReducedMotion,
} from "react-native-reanimated";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

/**
 * DIRECTION CONTRACT — impeccable, delight, key theme-landscape-01
 * (code-led: native SVG scene, no live device this session.)
 *
 * THESIS: The Appearance toggle doesn't just relabel a switch — it moves a
 *   whole campus skyline from midnight to midday, so "dark mode" and "light
 *   mode" stop being abstract labels and become a scene you recognize as
 *   this app's, not a stock day/night widget.
 * OWN-WORLD: A rooftop + clocktower silhouette (Universe is a campus app)
 *   under a violet-tinted night sky, crossfading to a warm daytime sky as
 *   one shared celestial body arcs left-to-right and gold-to-pale across it.
 * STORY: The user taps the switch; the sky dissolves, lit windows fade out,
 *   and the sun/moon sweeps up through an apex and back down on the other
 *   side — confirming the theme changed without reading any text.
 * FIRST VIEWPORT: One full-width card above the Theme section: sky fills
 *   it, skyline silhouette sits on the bottom third, the orb travels the
 *   upper two-thirds.
 * FORM: Campus Skyline — locked by the user via AskUserQuestion over
 *   Rolling Hills and Minimal Horizon Arc.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with
 *   the finish review, the verdict, DESIGN.md, and every shipping raster
 *   carrying its provenance.
 */

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HEIGHT = 140;
const DURATION = 600;

// Fixed star field, authored once rather than randomized per render — a
// twinkle field should look considered, not procedurally noisy.
const STARS = [
  { x: 0.08, y: 0.16, r: 1.3 },
  { x: 0.18, y: 0.32, r: 1 },
  { x: 0.3, y: 0.14, r: 1.5 },
  { x: 0.42, y: 0.26, r: 1 },
  { x: 0.62, y: 0.12, r: 1.2 },
  { x: 0.74, y: 0.2, r: 1 },
  { x: 0.88, y: 0.15, r: 1.4 },
  { x: 0.94, y: 0.3, r: 1 },
];

// Lit windows on the skyline, night only — the one authored detail that
// makes the scene read as "campus at night" rather than a generic city.
const WINDOWS = [
  { x: 0.2, y: 0.86 },
  { x: 0.24, y: 0.86 },
  { x: 0.62, y: 0.82 },
  { x: 0.67, y: 0.9 },
  { x: 0.78, y: 0.86 },
];

const NIGHT_SKY = "#15101f";
const DAY_SKY = "#e9edfb";
const SKYLINE_NIGHT = "#0a0713";
const SKYLINE_DAY = "#c7c1dc";
const MOON_COLOR = "#e6e8f7";
const SUN_COLOR = "#ffcf5c";
const WINDOW_COLOR = "#f7c948";

const skylinePath = (w: number) => {
  const base = HEIGHT;
  const towerX = w * 0.58;
  const towerW = w * 0.1;
  const towerTop = HEIGHT * 0.5;
  const spireTop = HEIGHT * 0.38;
  return [
    `M0,${base}`,
    `L0,${HEIGHT * 0.78}`,
    `L${w * 0.14},${HEIGHT * 0.78}`,
    `L${w * 0.14},${HEIGHT * 0.62}`,
    `L${w * 0.3},${HEIGHT * 0.62}`,
    `L${w * 0.3},${HEIGHT * 0.78}`,
    `L${towerX},${HEIGHT * 0.78}`,
    `L${towerX},${towerTop}`,
    `L${towerX + towerW / 2},${spireTop}`,
    `L${towerX + towerW},${towerTop}`,
    `L${towerX + towerW},${HEIGHT * 0.78}`,
    `L${w * 0.82},${HEIGHT * 0.78}`,
    `L${w * 0.82},${HEIGHT * 0.68}`,
    `L${w},${HEIGHT * 0.68}`,
    `L${w},${base}`,
    "Z",
  ].join(" ");
};

// A small campus skyline that crossfades from a violet night sky (stars, lit
// windows) to a warm day sky as the shared sun/moon sweeps a real arc across
// it — driven by the resolved theme, not the raw OS scheme, so it always
// matches what the rest of the app is doing.
const ThemeLandscape = () => {
  const colorScheme = useAppColorScheme();
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(colorScheme === "light" ? 1 : 0);

  useEffect(() => {
    const target = colorScheme === "light" ? 1 : 0;
    progress.value = reducedMotion
      ? target
      : withTiming(target, { duration: DURATION, easing: Easing.out(Easing.cubic) });
  }, [colorScheme, progress, reducedMotion]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const nightProps = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  }));
  const dayProps = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));
  const windowProps = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
  }));

  const orbProps = useAnimatedProps(() => {
    const cx = interpolate(progress.value, [0, 1], [width * 0.22, width * 0.78]);
    const cy = interpolate(progress.value, [0, 0.5, 1], [HEIGHT * 0.42, HEIGHT * 0.14, HEIGHT * 0.26]);
    return {
      cx,
      cy,
      fill: interpolateColor(progress.value, [0, 1], [MOON_COLOR, SUN_COLOR]),
    };
  });
  const glowProps = useAnimatedProps(() => {
    const cx = interpolate(progress.value, [0, 1], [width * 0.22, width * 0.78]);
    const cy = interpolate(progress.value, [0, 0.5, 1], [HEIGHT * 0.42, HEIGHT * 0.14, HEIGHT * 0.26]);
    return {
      cx,
      cy,
      fill: interpolateColor(progress.value, [0, 1], [MOON_COLOR, SUN_COLOR]),
    };
  });

  return (
    <View onLayout={onLayout} className="overflow-hidden rounded-2xl" style={{ height: HEIGHT }}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          <AnimatedG animatedProps={nightProps}>
            <Rect x={0} y={0} width={width} height={HEIGHT} fill={NIGHT_SKY} />
            {STARS.map((star, index) => (
              <Circle key={index} cx={star.x * width} cy={star.y * HEIGHT} r={star.r} fill="#ffffff" />
            ))}
            <Path d={skylinePath(width)} fill={SKYLINE_NIGHT} />
            <AnimatedG animatedProps={windowProps}>
              {WINDOWS.map((win, index) => (
                <Rect
                  key={index}
                  x={win.x * width}
                  y={win.y * HEIGHT}
                  width={3}
                  height={4}
                  fill={WINDOW_COLOR}
                />
              ))}
            </AnimatedG>
          </AnimatedG>

          <AnimatedG animatedProps={dayProps}>
            <Rect x={0} y={0} width={width} height={HEIGHT} fill={DAY_SKY} />
            <Path d={skylinePath(width)} fill={SKYLINE_DAY} />
          </AnimatedG>

          <AnimatedCircle animatedProps={glowProps} r={22} opacity={0.28} />
          <AnimatedCircle animatedProps={orbProps} r={11} />

          {/* Skyline redrawn on top so the orb tucks behind rooftops when it
              arcs low, instead of floating in front of the whole scene. */}
          <AnimatedG animatedProps={nightProps}>
            <Path d={skylinePath(width)} fill={SKYLINE_NIGHT} />
          </AnimatedG>
          <AnimatedG animatedProps={dayProps}>
            <Path d={skylinePath(width)} fill={SKYLINE_DAY} />
          </AnimatedG>
        </Svg>
      ) : null}
    </View>
  );
};

export default ThemeLandscape;
