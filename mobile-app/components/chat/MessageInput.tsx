import { useRef, useState } from "react";
import { View, Text, TextInput, Image, Alert, type TextInputSelectionChangeEvent } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import EmojiPicker, { type EmojiType } from "rn-emoji-keyboard";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { MAX_IMAGES } from "@constants/postForm";
import { MAX_FILES, MAX_FILE_SIZE, ALLOWED_FILE_MIME_TYPES } from "@constants/chatComposer";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import {
  useSendMessageMutation,
  useSendFilesMessageMutation,
  useSendVoiceMessageMutation,
} from "@queryAndMutation/mutations/conversation-mutation";
import {
  useSendMessageToGroupMutation,
  useSendFilesMessageToGroupMutation,
  useSendVoiceMessageToGroupMutation,
} from "@queryAndMutation/mutations/group-mutation";
import { formatFileSize, getFileTypeIcon, type RNFile } from "@utils/chatFile";
import VoiceRecordButton from "./VoiceRecordButton";

type MessageInputProps = {
  variant: "direct" | "group";
  id: string;
  disabled?: boolean;
  onSent?: () => void;
};

const toImageFile = (asset: ImagePicker.ImagePickerAsset): RNFile => ({
  uri: asset.uri,
  name: asset.fileName ?? "photo.jpg",
  type: asset.mimeType ?? "image/jpeg",
  size: asset.fileSize,
});

// Structural port of frontend/src/features/chat/components/MessageInput.tsx,
// now extended past the text-only version from the prior thread-structure
// pass with images/files/emoji/voice — see context/current-feature.md for
// what's still deliberately out of scope (polls, @mentions, typing emission).
const MessageInput = ({ variant, id, disabled, onSent }: MessageInputProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const [text, setText] = useState("");
  const [images, setImages] = useState<RNFile[]>([]);
  const [files, setFiles] = useState<RNFile[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [forcedSelection, setForcedSelection] = useState<{ start: number; end: number } | undefined>();

  const directMutation = useSendMessageMutation(variant === "direct" ? id : undefined);
  const groupMutation = useSendMessageToGroupMutation(variant === "group" ? id : undefined);
  const { mutate, isPending } = variant === "direct" ? directMutation : groupMutation;
  const directFilesMutation = useSendFilesMessageMutation(variant === "direct" ? id : undefined);
  const groupFilesMutation = useSendFilesMessageToGroupMutation(variant === "group" ? id : undefined);
  const { mutate: mutateFiles, isPending: isSendingFiles } =
    variant === "direct" ? directFilesMutation : groupFilesMutation;
  const directVoiceMutation = useSendVoiceMessageMutation(variant === "direct" ? id : undefined);
  const groupVoiceMutation = useSendVoiceMessageToGroupMutation(variant === "group" ? id : undefined);
  const { mutate: mutateVoice } = variant === "direct" ? directVoiceMutation : groupVoiceMutation;

  const canSend =
    (text.trim().length > 0 || images.length > 0 || files.length > 0) && !isPending && !isSendingFiles;

  const handlePickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Limit reached", `You can only attach up to ${MAX_IMAGES} images.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
    });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets.map(toImageFile)]);
  };

  // Same validations as web's MultipleFilesUploader (file-too-large,
  // MAX_FILES) — an invalid-type toast isn't needed here since the native
  // picker's `type` filter already restricts what's selectable.
  const handlePickFiles = async () => {
    if (files.length >= MAX_FILES) {
      Alert.alert("Limit reached", `You can only attach up to ${MAX_FILES} files.`);
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_FILE_MIME_TYPES,
      multiple: true,
    });
    if (result.canceled) return;
    const tooLarge = result.assets.filter((asset) => (asset.size ?? 0) > MAX_FILE_SIZE);
    const withinSize = result.assets.filter((asset) => (asset.size ?? 0) <= MAX_FILE_SIZE);
    const remaining = MAX_FILES - files.length;
    const toAdd = withinSize.slice(0, remaining);
    if (tooLarge.length > 0) {
      Alert.alert(
        "File too large",
        `${tooLarge.map((f) => f.name).join(", ")} ${tooLarge.length > 1 ? "are" : "is"} larger than ${formatFileSize(MAX_FILE_SIZE)}.`,
      );
    } else if (withinSize.length > remaining) {
      Alert.alert("Limit reached", `You can only attach up to ${MAX_FILES} files.`);
    }
    setFiles((prev) => [
      ...prev,
      ...toAdd.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? "application/octet-stream",
        size: asset.size,
      })),
    ]);
  };

  const handleEmojiPick = ({ emoji }: EmojiType) => {
    const { start, end } = selectionRef.current;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    const caret = start + emoji.length;
    selectionRef.current = { start: caret, end: caret };
    setForcedSelection({ start: caret, end: caret });
    requestAnimationFrame(() => setForcedSelection(undefined));
  };

  const handleSelectionChange = (e: TextInputSelectionChangeEvent) => {
    selectionRef.current = e.nativeEvent.selection;
  };

  const handleSend = () => {
    if (!canSend) return;
    const trimmedText = text.trim();
    const hasFiles = files.length > 0;

    // Backend has no single endpoint accepting both images and files, so —
    // same as web — a message with both fires two sends: images (+ text)
    // and files (text only rides along if there were no images).
    if (images.length > 0 || !hasFiles) {
      mutate({ messageText: trimmedText, images });
    }
    if (hasFiles) {
      mutateFiles({ messageText: images.length > 0 ? "" : trimmedText, files });
    }
    setText("");
    setImages([]);
    setFiles([]);
    onSent?.();
  };

  const handleSendVoice = (audio: RNFile, durationSec: number) => {
    mutateVoice({ audio, durationSec });
    onSent?.();
  };

  if (disabled) {
    return (
      <View className="px-4 py-3">
        <Text className="text-sm" style={{ color: theme.tabIconColour }}>
          You can&apos;t send messages to this conversation.
        </Text>
      </View>
    );
  }

  const showSend = text.trim().length > 0 || images.length > 0 || files.length > 0;

  return (
    <View className="px-4 py-2.5">
      {images.length > 0 && (
        <View className="flex-row flex-wrap gap-2 pb-2">
          {images.map((image, index) => (
            <View key={image.uri} className="relative">
              <Image source={{ uri: image.uri }} className="size-14 rounded-lg" />
              <PressableScale
                onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                hitSlop={8}
                className="absolute -right-1.5 -top-1.5 rounded-full"
                style={{ backgroundColor: theme.background }}
                accessibilityLabel="Remove image"
              >
                <Ionicons name="close-circle" size={IconSizes.lg} color={theme.iconMuted} />
              </PressableScale>
            </View>
          ))}
        </View>
      )}
      {files.length > 0 && (
        <View className="gap-1.5 pb-2">
          {files.map((file, index) => (
            <View
              key={`${file.name}-${index}`}
              className="flex-row items-center gap-2 rounded-lg px-2.5 py-2"
              style={{ backgroundColor: theme.uiBackground }}
            >
              <Ionicons name={getFileTypeIcon(file.type)} size={IconSizes.lg} color={theme.iconMuted} />
              <View className="flex-1">
                <Text className="text-xs font-medium" style={{ color: theme.text }} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text className="text-2xs" style={{ color: theme.tabIconColour }}>
                  {formatFileSize(file.size ?? 0)}
                </Text>
              </View>
              <PressableScale
                onPress={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                hitSlop={8}
                accessibilityLabel={`Remove ${file.name}`}
              >
                <Ionicons name="close" size={IconSizes.md} color={theme.iconMuted} />
              </PressableScale>
            </View>
          ))}
        </View>
      )}
      <View className="flex-row items-end gap-2">
        <PressableScale onPress={handlePickImages} hitSlop={8} className="pb-2" accessibilityLabel="Attach images">
          <Ionicons name="image-outline" size={IconSizes.lg} color={theme.text} />
        </PressableScale>
        <PressableScale onPress={handlePickFiles} hitSlop={8} className="pb-2" accessibilityLabel="Attach files">
          <Ionicons name="attach-outline" size={IconSizes.lg} color={theme.text} />
        </PressableScale>
        <View
          className="flex-1 justify-center rounded-2xl px-3.5"
          style={{ backgroundColor: theme.uiBackground, minHeight: 40 }}
        >
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            onSelectionChange={handleSelectionChange}
            selection={forcedSelection}
            placeholder="Send a message"
            placeholderTextColor={theme.tabIconColour}
            multiline
            style={{ color: theme.text, maxHeight: 96, paddingVertical: 9 }}
            className="text-sm"
          />
        </View>
        <PressableScale
          onPress={() => setEmojiOpen(true)}
          hitSlop={8}
          className="pb-2"
          accessibilityLabel="Add emoji"
        >
          <Ionicons name="happy-outline" size={IconSizes.lg} color={theme.text} />
        </PressableScale>
        {showSend ? (
          <PressableScale onPress={handleSend} enabled={canSend} hitSlop={8} className="pb-2">
            <Ionicons name="send" size={IconSizes.lg} color={canSend ? Colors.primary : theme.iconMuted} />
          </PressableScale>
        ) : (
          <View className="pb-2">
            <VoiceRecordButton onSend={handleSendVoice} />
          </View>
        )}
      </View>
      <EmojiPicker
        open={emojiOpen}
        onClose={() => setEmojiOpen(false)}
        onEmojiSelected={handleEmojiPick}
        theme={
          colorScheme === "dark"
            ? {
                backdrop: "#00000088",
                knob: theme.iconMuted,
                container: theme.background,
                header: theme.text,
                skinTonesContainer: theme.uiBackground,
                category: {
                  icon: theme.iconMuted,
                  iconActive: Colors.primary,
                  container: theme.uiBackground,
                  containerActive: theme.uiBackground,
                },
                search: {
                  text: theme.text,
                  placeholder: theme.tabIconColour,
                  icon: theme.iconMuted,
                  background: theme.uiBackground,
                },
              }
            : undefined
        }
      />
    </View>
  );
};

export default MessageInput;
