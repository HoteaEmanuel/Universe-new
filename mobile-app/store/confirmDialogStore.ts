import { create } from "zustand";

type ConfirmDialogOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
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
  onConfirm: () => {},

  open: ({ title, message, confirmLabel, cancelLabel, destructive, onConfirm }) =>
    set({
      visible: true,
      title: title ?? "",
      message: message ?? "",
      confirmLabel: confirmLabel ?? "Confirm",
      cancelLabel: cancelLabel ?? "Cancel",
      destructive: destructive ?? false,
      onConfirm,
    }),
  close: () => set({ visible: false }),
}));
