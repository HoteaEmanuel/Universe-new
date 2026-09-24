import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { useConfirmDialogStore } from "@store/confirmDialogStore";
import { useAppColorScheme } from "@hooks/useAppColorScheme";


const ConfirmDialog = () => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const { visible, title, message, confirmLabel, cancelLabel, destructive, icon, onConfirm, close } =
    useConfirmDialogStore();
  const resolvedIcon = icon ?? (destructive ? "trash-outline" : "help-circle-outline");

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
              name={resolvedIcon}
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
            <Pressable
              onPress={close}
              className="flex-1 items-center justify-center rounded-full py-3"
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: theme.borderColor,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text className="text-sm font-semibold" style={{ color: theme.text }}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className="flex-1 items-center justify-center rounded-full py-3"
              style={({ pressed }) => ({
                backgroundColor: destructive ? Colors.warning : Colors.primary,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ConfirmDialog;
