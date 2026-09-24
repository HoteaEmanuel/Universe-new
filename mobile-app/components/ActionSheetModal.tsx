import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

export type ActionSheetItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
};

type ActionSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  items: ActionSheetItem[];
};

// Reusable bottom-sheet quick-actions menu (first user: the conversation
// header's 3-dot button). Rows are plain RN `Pressable`, not
// PressableScale/RNGH - RN's `<Modal>` renders outside the app's single
// GestureHandlerRootView (mounted in app/_layout.jsx), so RNGH-based
// touchables placed inside a Modal don't reliably receive touches. Same
// root cause ConfirmDialog.tsx's Cancel button hit; see that file's notes.
const ActionSheetModal = ({ visible, onClose, items }: ActionSheetModalProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(3, 7, 18, 0.6)" }}
        onPress={onClose}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="rounded-t-2xl"
          style={{
            backgroundColor: theme.uiBackground,
            borderWidth: 1,
            borderColor: theme.borderColor,
            paddingBottom: insets.bottom + 8,
          }}
        >
          {items.map((item, index) => (
            <Pressable
              key={item.key}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              className="flex-row items-center gap-3 px-5 py-4"
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.borderColor,
              })}
            >
              <Ionicons
                name={item.icon}
                size={IconSizes.lg}
                color={item.destructive ? Colors.warning : theme.iconMuted}
              />
              <Text
                className="text-sm font-semibold"
                style={{ color: item.destructive ? Colors.warning : theme.title }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ActionSheetModal;
