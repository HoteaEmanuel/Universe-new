import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { formatAudioDuration } from "@utils/chatFile";

type AudioMessagePlayerProps = {
  audioUrl: string;
  durationSec?: number;
  isOwn: boolean;
};

// Receive-side counterpart to VoiceRecordButton's push-to-talk send: a plain
// play/pause + elapsed/total time row, no waveform — web's VoiceRecorder
// waveform (wavesurfer.js) is a web-only dependency, and a bare-minimum
// player matches this pass's mobile-native rather than 1:1-ported approach.
const AudioMessagePlayer = ({ audioUrl, durationSec, isOwn }: AudioMessagePlayerProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const iconColor = isOwn ? "#ffffff" : theme.text;

  const handleToggle = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || status.currentTime >= status.duration) {
      player.seekTo(0);
    }
    player.play();
  };

  const totalSec = status.duration || durationSec || 0;
  const remainingSec = Math.max(totalSec - status.currentTime, 0);

  return (
    <View className="min-w-40 flex-row items-center gap-2">
      <PressableScale onPress={handleToggle} hitSlop={8} accessibilityLabel={status.playing ? "Pause" : "Play"}>
        <Ionicons name={status.playing ? "pause-circle" : "play-circle"} size={IconSizes["2xl"]} color={iconColor} />
      </PressableScale>
      <Text className="text-xs tabular-nums" style={{ color: iconColor }}>
        {formatAudioDuration(status.playing ? remainingSec : totalSec)}
      </Text>
    </View>
  );
};

export default AudioMessagePlayer;
