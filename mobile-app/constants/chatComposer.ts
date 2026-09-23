// Mirrors frontend/src/features/chat/utils/fileConstraints.ts and this
// backend's lib/fileUpload.ts / lib/audioUpload.ts limits — kept local
// rather than shared since they're plain numbers/lists, not shared
// behavior (same rationale as constants/postForm.ts).
export const MAX_FILES = 10;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// expo-audio's RecordingPresets.HIGH_QUALITY is the only preset that
// produces a `.m4a` (audio/mp4) file on both iOS and Android — its
// LOW_QUALITY preset switches Android to `.3gp`/amr_nb, which isn't in the
// backend's ALLOWED_AUDIO_MIME_TYPES and would be rejected on upload.
export const MAX_RECORDING_SEC = 120;
export const VOICE_MESSAGE_MIME_TYPE = "audio/mp4";
