// Uniwind ships the `className` prop declarations in uniwind/types.d.ts, but
// they don't reach this app's code: npm keeps two copies of react-native in
// this monorepo (root gets 0.87.1, pulled in to satisfy `react-native: "*"`
// peer ranges on hoisted Expo packages; mobile-app keeps its Expo-pinned
// 0.86.3 nested). uniwind lives in the root node_modules, so its
// `declare module 'react-native'` augments the root copy, while our code
// resolves the nested one — different module identity, so the augmentation
// is invisible here.
//
// Runtime is unaffected: metro.config.cjs lists mobile-app/node_modules
// first in nodeModulesPaths, so every package resolves the same 0.86.3 at
// bundle time. This file re-declares the same props against the copy our
// code actually resolves, so .tsx files can use className.
//
// npm `overrides` can't fix the duplication: react-native is a *peer*
// dependency of those Expo packages, and overrides don't apply to peers.
// Delete this file if the two copies are ever collapsed into one.
import "react-native";

declare module "react-native" {
  interface ViewProps {
    className?: string;
  }

  interface TextProps {
    className?: string;
    selectionColorClassName?: string;
  }

  interface PressableProps {
    className?: string;
  }

  interface TextInputProps {
    className?: string;
    placeholderClassName?: string;
    selectionColorClassName?: string;
  }

  interface ImagePropsBase {
    className?: string;
    tintColorClassName?: string;
  }

  interface ScrollViewProps {
    contentContainerClassName?: string;
  }

  interface ActivityIndicatorProps {
    className?: string;
    colorClassName?: string;
  }

  interface SwitchProps {
    className?: string;
  }

  interface FlatListProps<ItemT> {
    columnWrapperClassName?: string;
    contentContainerClassName?: string;
    ListFooterComponentClassName?: string;
    ListHeaderComponentClassName?: string;
  }
}
