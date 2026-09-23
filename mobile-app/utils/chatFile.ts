import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

// React Native's FormData needs { uri, name, type } for a file part, unlike
// web's real File/Blob — same rationale as CreatePostFile in
// queryAndMutation/mutations/post-mutation.ts. `size` rides along only to
// build an optimistic attachment preview before the server responds; it's
// not read by FormData.append.
export type RNFile = { uri: string; name: string; type: string; size?: number };

const WORD_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const EXCEL_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

// Ports frontend/src/features/chat/utils/fileTypeIcon.ts's mime->icon
// mapping to Ionicons names (no matching lucide-equivalent icon set here).
export const getFileTypeIcon = (mimeType: string): ComponentProps<typeof Ionicons>["name"] => {
  if (mimeType === "application/pdf") return "document-text-outline";
  if (WORD_MIME_TYPES.has(mimeType)) return "document-outline";
  if (EXCEL_MIME_TYPES.has(mimeType)) return "grid-outline";
  return "document-attach-outline";
};

// Ports frontend/src/features/chat/utils/formatFileSize.ts.
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
};

// Ports frontend/src/features/chat/utils/waveColors.ts's formatAudioDuration
// (m:ss), used for both the push-to-talk recording timer and voice-message
// playback position/duration.
export const formatAudioDuration = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};
