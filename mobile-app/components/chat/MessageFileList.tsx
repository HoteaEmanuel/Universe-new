import { View, Text, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MessageAttachment } from "@universe/shared";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { formatFileSize, getFileTypeIcon } from "@utils/chatFile";

type MessageFileListProps = {
  attachments: MessageAttachment[];
  isOwn: boolean;
};

// Ports frontend/src/features/chat/components/MessageFileList.tsx. Opens
// straight to the file's URL (device handles preview/download) rather than
// an in-app viewer, which is its own scope beyond this pass.
const MessageFileList = ({ attachments, isOwn }: MessageFileListProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const textColor = isOwn ? "#ffffff" : theme.text;

  if (attachments.length === 0) return null;

  const handleOpen = (fileUrl: string) => {
    Linking.openURL(fileUrl).catch(() =>
      Alert.alert("Couldn't open file", "Please try again."),
    );
  };

  return (
    <View className="w-64 gap-1">
      {attachments.map((attachment) => (
        <PressableScale
          key={attachment.id}
          onPress={() => handleOpen(attachment.fileUrl)}
          className="flex-row items-center gap-2 rounded-2xl px-3 py-2"
          style={{ backgroundColor: isOwn ? Colors.primary : theme.uiBackground }}
        >
          <Ionicons name={getFileTypeIcon(attachment.mimeType)} size={IconSizes.xl} color={textColor} />
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-medium" style={{ color: textColor }} numberOfLines={1}>
              {attachment.fileName}
            </Text>
            <Text className="text-xs" style={{ color: isOwn ? "rgba(255,255,255,0.7)" : theme.tabIconColour }}>
              {formatFileSize(attachment.fileSize)}
            </Text>
          </View>
        </PressableScale>
      ))}
    </View>
  );
};

export default MessageFileList;
