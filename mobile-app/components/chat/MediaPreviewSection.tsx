import { View, Text, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ChatMediaItem } from "@universe/shared";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useGetConvoResourcesInfinite } from "@queryAndMutation/queries/conversation-queries";
import { useGetGroupResourcesInfinite } from "@queryAndMutation/queries/group-queries";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type MediaPreviewSectionProps = {
  id: string;
  isGroup: boolean;
};

const THUMBNAIL_COUNT = 4;


const MediaPreviewSection = ({ id, isGroup }: MediaPreviewSectionProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  const convoMedia = useGetConvoResourcesInfinite<ChatMediaItem>("images", isGroup ? undefined : id);
  const groupMedia = useGetGroupResourcesInfinite<ChatMediaItem>("images", isGroup ? id : undefined);
  const { data, isPending } = isGroup ? groupMedia : convoMedia;

  const thumbnails = (data?.pages[0]?.items ?? []).slice(0, THUMBNAIL_COUNT);
  const hasMedia = thumbnails.length > 0;

  return (
    <View className="gap-2">
      <Text className="px-4 text-xs font-semibold uppercase" style={{ color: theme.tabIconColour }}>
        Shared media
      </Text>
      <View
        className="w-full overflow-hidden rounded-2xl shadow-card"
        style={{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }}
      >
        {!isPending && hasMedia ? (
          <View className="flex-row gap-2 px-4 pt-4">
            {thumbnails.map((item, index) => (
              <Image
                key={`${item.messageId}-${index}`}
                source={{ uri: item.url }}
                className="aspect-square flex-1 rounded-lg"
              />
            ))}
          </View>
        ) : !isPending ? (
          <Text className="px-4 pt-4 text-sm" style={{ color: theme.tabIconColour }}>
            No media shared yet.
          </Text>
        ) : null}

        <PressableScale
          onPress={() =>
            router.push({ pathname: "/(chat)/media/[id]", params: { id, isGroup: isGroup ? "1" : "" } })
          }
          className="flex-row items-center gap-3 px-4 py-3.5"
        >
          <Text className="flex-1 text-sm font-semibold" style={{ color: theme.title }}>
            View media & files
          </Text>
          <Ionicons name="chevron-forward" size={IconSizes.md} color={theme.iconMuted} />
        </PressableScale>
      </View>
    </View>
  );
};

export default MediaPreviewSection;
