// No existing .tsx file imported a raster image before the auth screens
// TS migration, so this declaration never had to exist. expo/tsconfig.base
// doesn't ship one itself — Metro/the Babel transform handle the runtime
// side (an image import resolves to a number/ImageSourcePropType), this is
// only what tsc needs to accept the import.
declare module "*.png" {
  import type { ImageSourcePropType } from "react-native";
  const value: ImageSourcePropType;
  export default value;
}

declare module "*.jpg" {
  import type { ImageSourcePropType } from "react-native";
  const value: ImageSourcePropType;
  export default value;
}

declare module "*.jpeg" {
  import type { ImageSourcePropType } from "react-native";
  const value: ImageSourcePropType;
  export default value;
}

declare module "*.gif" {
  import type { ImageSourcePropType } from "react-native";
  const value: ImageSourcePropType;
  export default value;
}

declare module "*.webp" {
  import type { ImageSourcePropType } from "react-native";
  const value: ImageSourcePropType;
  export default value;
}
