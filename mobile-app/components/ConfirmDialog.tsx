import { Modal, Pressable, Text, View, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";
import { IconSizes } from "../constants/iconSizes";
import { PressableScale } from "../lib/styled";
import { useConfirmDialogStore } from "../store/confirmDialogStore";

// Themed stand-in for Alert.alert's confirm/cancel shape — same rounded-2xl
// card + violet accent language as PostCard/ComposerSubmitBar, since the
// native OS alert can't be restyled in place. Mounted once in app/_layout.jsx
// and driven by useConfirmDialogStore so call sites (e.g.
// utils/confirmDiscardChanges.ts) stay a plain function call.
const ConfirmDialog = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const { visible, title, message, confirmLabel, cancelLabel, destructive, onConfirm, close } =
    useConfirmDialogStore();

  const handleConfirm = () => {
    close();
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <Pressable
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: "rgba(3, 7, 18, 0.6)" }}
        onPress={close}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="w-full max-w-sm gap-4 rounded-2xl p-5"
          style={{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }}
        >
          <View
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: destructive ? "rgba(204, 71, 90, 0.15)" : "rgba(104, 73, 167, 0.15)" }}
          >
            <Ionicons
              name={destructive ? "trash-outline" : "help-circle-outline"}
              size={IconSizes.xl}
              color={destructive ? Colors.warning : Colors.primary}
            />
          </View>

          <View className="gap-1">
            <Text className="text-base font-bold" style={{ color: theme.title }}>
              {title}
            </Text>
            <Text className="text-sm" style={{ color: theme.text }}>
              {message}
            </Text>
          </View>

          <View className="flex-row gap-3 pt-1">
            <PressableScale
              onPress={close}
              className="flex-1 items-center justify-center rounded-full py-3"
              style={{ borderWidth: 1, borderColor: theme.borderColor }}
            >
              <Text className="text-sm font-semibold" style={{ color: theme.text }}>
                {cancelLabel}
              </Text>
            </PressableScale>
            <PressableScale
              onPress={handleConfirm}
              className="flex-1 items-center justify-center rounded-full py-3"
              style={{ backgroundColor: destructive ? Colors.warning : Colors.primary }}
            >
              <Text className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                {confirmLabel}
              </Text>
            </PressableScale>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ConfirmDialog;
