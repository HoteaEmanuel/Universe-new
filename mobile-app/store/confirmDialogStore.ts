import { create } from "zustand";
import type { Ionicons } from "@expo/vector-icons";

type ConfirmDialogOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
};

type ConfirmDialogState = ConfirmDialogOptions & {
  visible: boolean;
  open: (options: Partial<ConfirmDialogOptions> & { onConfirm: () => void }) => void;
  close: () => void;
};

// Backs ConfirmDialog.tsx (mounted once in app/_layout.jsx) so any screen can
// trigger the themed confirm modal imperatively, the same way Alert.alert
// works, without every call site needing to render its own <Modal>.
export const useConfirmDialogStore = create<ConfirmDialogState>((set) => ({
  visible: false,
  title: "",
  message: "",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  destructive: false,
  icon: undefined,
  onConfirm: () => {},

  open: ({ title, message, confirmLabel, cancelLabel, destructive, icon, onConfirm }) =>
    set({
      visible: true,
      title: title ?? "",
      message: message ?? "",
      confirmLabel: confirmLabel ?? "Confirm",
      cancelLabel: cancelLabel ?? "Cancel",
      destructive: destructive ?? false,
      icon,
      onConfirm,
    }),
  close: () => set({ visible: false }),
}));
