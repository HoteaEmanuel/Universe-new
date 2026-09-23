import { useState } from "react";
import { Modal, View, Image, FlatList, Pressable, Alert, ActivityIndicator, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import { IconSizes } from "@constants/iconSizes";

type ImageGalleryModalProps = {
  images: string[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

const ITEM_GAP = 2;


const ImageGalleryModal = ({ images, initialIndex, visible, onClose }: ImageGalleryModalProps) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [downloadingUri, setDownloadingUri] = useState<string | null>(null);

  if (images.length === 0) return null;

  const handleDownload = async (uri: string) => {
    if (downloadingUri) return;
    setDownloadingUri(uri);
    try {
      const permission = await requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow photo library access to save images.");
        return;
      }
      const file = await File.downloadFileAsync(uri, Paths.cache);
      await Asset.create(file.uri);
      Promise.resolve(file.delete()).catch(() => {});
    } catch (error) {
      console.error("Image download failed:", error);
      Alert.alert("Couldn't save image", "Please try again.");
    } finally {
      setDownloadingUri(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {visible && (
          <FlatList
            data={images}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, i) => ({ length: width, offset: (width + ITEM_GAP) * i, index: i })}
            ItemSeparatorComponent={() => <View style={{ height: ITEM_GAP }} />}
            contentContainerStyle={{ paddingTop: insets.top + 52, paddingBottom: insets.bottom }}
            renderItem={({ item }) => (
              <View style={{ width, aspectRatio: 1 }}>
                <Image source={{ uri: item }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                <Pressable
                  onPress={() => handleDownload(item)}
                  disabled={downloadingUri === item}
                  hitSlop={8}
                  className="absolute bottom-3 right-3 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)", width: 36, height: 36 }}
                  accessibilityLabel="Save image"
                >
                  {downloadingUri === item ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="download-outline" size={IconSizes.xl} color="#ffffff" />
                  )}
                </Pressable>
              </View>
            )}
          />
        )}

       
        <Pressable
          onPress={onClose}
          hitSlop={8}
          className="absolute right-4 items-center justify-center rounded-full"
          style={{ top: insets.top + 8, backgroundColor: "rgba(0,0,0,0.5)", width: 36, height: 36 }}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={IconSizes.xl} color="#ffffff" />
        </Pressable>
      </View>
    </Modal>
  );
};

export default ImageGalleryModal;
