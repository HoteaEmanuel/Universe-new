import { useConfirmDialogStore } from "../store/confirmDialogStore";

// Shared confirm-before-discard prompt for any form screen that can lose
// unsaved input on cancel/back — routes through ConfirmDialog.tsx (mounted in
// app/_layout.jsx) so it matches the app's theme instead of the native
// Alert.alert chrome.
export const confirmDiscardChanges = (
  onDiscard: () => void,
  options?: { title?: string; message?: string },
) => {
  useConfirmDialogStore.getState().open({
    title: options?.title ?? "Discard this post?",
    message: options?.message ?? "You'll lose everything you've entered.",
    confirmLabel: "Discard",
    cancelLabel: "Keep editing",
    destructive: true,
    onConfirm: onDiscard,
  });
};
