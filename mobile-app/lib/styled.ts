import { withUniwind } from "uniwind";
import { PressableScale as RNPressableScale } from "pressto";

// Third-party components that need withUniwind to accept `className` (RN's
// own View/Text/Pressable/etc. already support it natively — see the
// migrate-nativewind-to-uniwind skill). Wrapped once here and imported
// everywhere it's used, per that skill's guidance: never call withUniwind
// on the same component in more than one place.
export const PressableScale = withUniwind(RNPressableScale);
