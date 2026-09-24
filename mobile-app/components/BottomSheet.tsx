import { forwardRef, useCallback, useMemo, type ReactNode } from "react";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Colors } from "@constants/colors";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

export type BottomSheetHandle = BottomSheetModal;

type ThemedBottomSheetProps = {
  children: ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
  // Set this when `children` is itself a BottomSheetScrollable (e.g.
  // BottomSheetFlatList) rather than static content. BottomSheetView is
  // absolutely positioned and sizes to its content, so it can't host a
  // bounded, virtualized list - the list needs to be the sheet's own
  // scrollable root instead of nested inside it.
  scrollable?: boolean;
};


const ThemedBottomSheet = forwardRef<BottomSheetHandle, ThemedBottomSheetProps>(
  ({ children, snapPoints, onDismiss, scrollable = false }, ref) => {
    const colorScheme = useAppColorScheme();
    const theme = colorScheme === "light" ? Colors.light : Colors.dark;
    const points = useMemo(() => snapPoints, [snapPoints]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.6}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={points}
        enableDynamicSizing={!points}
        onDismiss={onDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.uiBackground }}
        handleIndicatorStyle={{ backgroundColor: theme.borderColor, width: 40 }}
      >
        {scrollable ? children : <BottomSheetView>{children}</BottomSheetView>}
      </BottomSheetModal>
    );
  },
);

ThemedBottomSheet.displayName = "ThemedBottomSheet";

export default ThemedBottomSheet;
