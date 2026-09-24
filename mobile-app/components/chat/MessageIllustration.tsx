import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Colors } from "@constants/colors";

type MessageIllustrationProps = {
  size?: number;
};


const MessageIllustration = ({ size = 96 }: MessageIllustrationProps) => {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 96 96">
        <Path d="M88 8 L8 36 L44 52 Z" fill={Colors.primary} />
        {/* Fixed darker shade rather than opacity — opacity blends toward
            whatever's behind it, so it reads as a shadow on the dark theme
            but a highlight (wrong direction) on the light one. */}
        <Path d="M88 8 L44 52 L60 88 Z" fill="#4b3578" />

        {/* Starts at (44,52) — the inner fold notch where the two wing
            panels meet, i.e. the actual center-back of the fuselage, not
            either wing tip — and is drawn after the plane's own fills so
            it's visible emerging from that point. */}
        <Path
          d="M44 52 C34 62 18 58 14 70 C10 82 24 88 30 78 C34 71 24 74 18 82"
          stroke={Colors.primary}
          strokeOpacity={0.5}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="1 6"
          fill="none"
        />
      </Svg>
    </View>
  );
};

export default MessageIllustration;
