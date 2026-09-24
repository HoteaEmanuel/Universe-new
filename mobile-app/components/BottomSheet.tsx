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
};


const ThemedBottomSheet = forwardRef<BottomSheetHandle, ThemedBottomSheetProps>(
  ({ children, snapPoints, onDismiss }, ref) => {
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
        {/* No bottom padding here — each sheet's own content owns its
            trailing spacing plus safe-area inset, since that varies with
            what the sheet ends on (a button row, a list, ...). */}
        <BottomSheetView>{children}</BottomSheetView>
      </BottomSheetModal>
    );
  },
);

ThemedBottomSheet.displayName = "ThemedBottomSheet";

export default ThemedBottomSheet;
