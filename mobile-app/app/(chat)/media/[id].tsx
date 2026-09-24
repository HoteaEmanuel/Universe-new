import { useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Linking,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ChatMediaItem, ChatFileItem } from "@universe/shared";
import ThemedView from "@components/ThemedView";
import SettingsScreenHeader from "@components/settings/SettingsScreenHeader";
import ImageGalleryModal from "@components/chat/ImageGalleryModal";
import { useGetConvoResourcesInfinite } from "@queryAndMutation/queries/conversation-queries";
import { useGetGroupResourcesInfinite } from "@queryAndMutation/queries/group-queries";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { formatFileSize, getFileTypeIcon } from "@utils/chatFile";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type ResourceTab = "images" | "files";
const TABS: { key: ResourceTab; label: string }[] = [
  { key: "images", label: "Photos" },
  { key: "files", label: "Files" },
];

const GRID_GAP = 4;
const GRID_COLUMNS = 3;
const SCREEN_PADDING = 16;

// Each fetched page's own `nextCursor` doubles as that page's month-bucket
// label (see packages/shared's `resources` query / backend's
// GET /conversations|groups/:id/media) — ported as-is from web's
// formatMonthLabel (frontend/src/features/chat/utils/chatMedia.ts).
const formatMonthLabel = (monthStartIso: string) =>
  new Date(monthStartIso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

// Full media/files gallery reached from the DM/group details screen's
// "View media & files" row — ports web's ChatMediaModal + MediaPhotosTab/
// MediaFilesTab (Photos/Files tabs, month-grouped, cursor-paginated) as one
// screen instead of a drawer, since mobile pushes screens rather than
// stacking modals over the thread.
const MediaGallery = () => {
  const { id, isGroup: isGroupParam } = useLocalSearchParams<{ id: string; isGroup?: string }>();
  const isGroup = isGroupParam === "1";
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ResourceTab>("images");
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const convoImages = useGetConvoResourcesInfinite<ChatMediaItem>(
    "images",
    !isGroup && activeTab === "images" ? id : undefined,
  );
  const groupImages = useGetGroupResourcesInfinite<ChatMediaItem>(
    "images",
    isGroup && activeTab === "images" ? id : undefined,
  );
  const convoFiles = useGetConvoResourcesInfinite<ChatFileItem>(
    "files",
    !isGroup && activeTab === "files" ? id : undefined,
  );
  const groupFiles = useGetGroupResourcesInfinite<ChatFileItem>(
    "files",
    isGroup && activeTab === "files" ? id : undefined,
  );

  const imagesQuery = isGroup ? groupImages : convoImages;
  const filesQuery = isGroup ? groupFiles : convoFiles;
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
    activeTab === "images" ? imagesQuery : filesQuery;

  const pages = data?.pages.filter((page) => page.items.length > 0) ?? [];
  const allImageUrls = pages.flatMap((page) => (page.items as ChatMediaItem[]).map((item) => item.url));

  const tileSize = (width - SCREEN_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  const handleOpenFile = (fileUrl: string) => {
    Linking.openURL(fileUrl).catch(() => Alert.alert("Couldn't open file", "Please try again."));
  };

  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title="Media" />

      <View className="flex-row gap-2 px-4 pb-3 pt-3">
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <PressableScale
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: active ? Colors.primary : theme.uiBackground }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: active ? "#ffffff" : theme.text }}
              >
                {tab.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : pages.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm" style={{ color: theme.tabIconColour }}>
            {activeTab === "images" ? "No photos shared yet." : "No files shared yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={pages}
          keyExtractor={(page) => page.nextCursor ?? Math.random().toString()}
          contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: 24, gap: 20 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator className="py-4" color={Colors.primary} /> : null
          }
          renderItem={({ item: page }) => (
            <View className="gap-2">
              <Text className="text-xs font-medium" style={{ color: theme.tabIconColour }}>
                {formatMonthLabel(page.nextCursor as string)}
              </Text>
              {activeTab === "images" ? (
                <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
                  {(page.items as ChatMediaItem[]).map((item, index) => {
                    const flatIndex = allImageUrls.indexOf(item.url);
                    return (
                      <PressableScale
                        key={`${item.messageId}-${index}`}
                        onPress={() => setGalleryIndex(flatIndex >= 0 ? flatIndex : 0)}
                      >
                        <Image
                          source={{ uri: item.url }}
                          style={{ width: tileSize, height: tileSize, borderRadius: 8 }}
                        />
                      </PressableScale>
                    );
                  })}
                </View>
              ) : (
                <View className="gap-1">
                  {(page.items as ChatFileItem[]).map((item) => (
                    <PressableScale
                      key={item.id}
                      onPress={() => handleOpenFile(item.fileUrl)}
                      className="flex-row items-center gap-3 rounded-xl px-2 py-2"
                      style={{ backgroundColor: theme.uiBackground }}
                    >
                      <Ionicons
                        name={getFileTypeIcon(item.mimeType)}
                        size={IconSizes.xl}
                        color={theme.iconMuted}
                      />
                      <View className="min-w-0 flex-1">
                        <Text
                          className="text-sm font-medium"
                          style={{ color: theme.title }}
                          numberOfLines={1}
                        >
                          {item.fileName}
                        </Text>
                        <Text className="text-xs" style={{ color: theme.tabIconColour }}>
                          {formatFileSize(item.fileSize)}
                        </Text>
                      </View>
                    </PressableScale>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}

      <ImageGalleryModal
        images={allImageUrls}
        initialIndex={galleryIndex ?? 0}
        visible={galleryIndex !== null}
        onClose={() => setGalleryIndex(null)}
      />
    </ThemedView>
  );
};

export default MediaGallery;
