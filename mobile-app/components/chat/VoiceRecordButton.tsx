import { useEffect, useRef, useState } from "react";
import { View, Text, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
} from "expo-audio";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { MAX_RECORDING_SEC, VOICE_MESSAGE_MIME_TYPE } from "@constants/chatComposer";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { formatAudioDuration, type RNFile } from "@utils/chatFile";

type VoiceRecordButtonProps = {
  onSend: (audio: RNFile, durationSec: number) => void;
  disabled?: boolean;
};

// Push-to-talk
const VoiceRecordButton = ({ onSend, disabled }: VoiceRecordButtonProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const [isStarting, setIsStarting] = useState(false);
  // Guards the on-release send path against a recording that was already
  // discarded via the Cancel button — `stop()` still resolves normally
  // either way, so without this flag canceling then releasing would send.
  const cancelledRef = useRef(false);
  // Covers a fast tap-and-release that finishes before `record()` resolves:
  // `handlePressOut` sets this instead of stopping (nothing to stop yet),
  // and `handlePressIn` checks it right after `record()` returns.
  const pendingStopRef = useRef(false);

  const elapsedSec = recorderState.durationMillis / 1000;
  const atMaxDuration = elapsedSec >= MAX_RECORDING_SEC;

  const finishRecording = async () => {
    if (!recorder.isRecording) return;
    const finishedElapsedSec = elapsedSec;
    await recorder.stop();
    const wasCancelled = cancelledRef.current;
    cancelledRef.current = false;
    if (wasCancelled || !recorder.uri) return;
    const durationSec = Math.min(Math.round(finishedElapsedSec), MAX_RECORDING_SEC);
    if (durationSec <= 0) return;
    onSend(
      { uri: recorder.uri, name: `voice-message-${Date.now()}.m4a`, type: VOICE_MESSAGE_MIME_TYPE },
      durationSec,
    );
  };

  const handlePressIn = async () => {
    if (disabled || recorder.isRecording || isStarting) return;
    setIsStarting(true);
    pendingStopRef.current = false;
    try {
      let permission = await getRecordingPermissionsAsync();
      if (!permission.granted) permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone access needed",
          "Allow microphone access to record a voice message.",
        );
        return;
      }
      cancelledRef.current = false;
      await recorder.prepareToRecordAsync();
      recorder.record();
      // The user already released before recording actually started.
      if (pendingStopRef.current) finishRecording();
    } finally {
      setIsStarting(false);
    }
  };

  const handlePressOut = () => {
    if (!recorder.isRecording) {
      pendingStopRef.current = true;
      return;
    }
    finishRecording();
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    finishRecording();
  };

  // Auto-stop (and send) at the cap — matches web's VoiceRecorder, which
  // calls `record.stopRecording()` once `MAX_RECORDING_SEC` is hit. Runs as
  // an effect, not inline in render, since it triggers `recorder.stop()`.
  useEffect(() => {
    if (recorderState.isRecording && atMaxDuration) finishRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState.isRecording, atMaxDuration]);

  // The mic PressableScale below must stay the same mounted element across
  // both idle and recording states — it's the one holding the touch
  // responder for the whole press-and-hold gesture. Swapping it out for a
  // different element when `isRecording` flips (as an earlier version did)
  // drops the responder mid-gesture, so releasing your finger never fires
  // `onPressOut` and the recording can never be stopped. The Cancel button
  // and timer render as siblings instead of replacing it.
  return (
    <View className="flex-row items-center gap-2">
      {recorderState.isRecording && (
        <>
          <PressableScale onPress={handleCancel} hitSlop={8} accessibilityLabel="Cancel recording">
            <Ionicons name="close-circle" size={IconSizes.xl} color={theme.iconMuted} />
          </PressableScale>
          <View
            className="flex-row items-center gap-2 rounded-full px-3 py-1.5"
            style={{ backgroundColor: theme.uiBackground }}
          >
            <View className="size-2.5 rounded-full" style={{ backgroundColor: Colors.warning }} />
            <Text className="text-xs font-medium tabular-nums" style={{ color: theme.text }}>
              {formatAudioDuration(elapsedSec)}
            </Text>
          </View>
        </>
      )}
      <PressableScale
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        enabled={!disabled}
        hitSlop={8}
        accessibilityLabel={
          recorderState.isRecording ? "Release to send the voice message" : "Hold to record a voice message"
        }
      >
        <Ionicons
          name={recorderState.isRecording ? "mic" : "mic-outline"}
          size={IconSizes.lg}
          color={recorderState.isRecording ? Colors.warning : disabled ? theme.iconMuted : theme.text}
        />
      </PressableScale>
    </View>
  );
};

export default VoiceRecordButton;
