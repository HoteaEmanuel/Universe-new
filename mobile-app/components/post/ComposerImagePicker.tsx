import { View, Text, Image, Pressable, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { MAX_IMAGES } from "@constants/postForm";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type ComposerImagePickerProps = {
  images: ImagePicker.ImagePickerAsset[];
  onChange: (images: ImagePicker.ImagePickerAsset[]) => void;
};

const TILE_CLASS = "aspect-square w-[31%] overflow-hidden rounded-lg";

const ComposerImagePicker = ({ images, onChange }: ComposerImagePickerProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const atLimit = images.length >= MAX_IMAGES;

  const handlePickImages = async () => {
    if (atLimit) {
      Alert.alert("Limit reached", `You can only add up to ${MAX_IMAGES} images.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
    });
    if (!result.canceled) onChange([...images, ...result.assets]);
  };

  const handleRemove = (uri: string) => {
    onChange(images.filter((image) => image.uri !== uri));
  };

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-2">
        {images.map((image) => (
          <View key={image.uri} className={TILE_CLASS}>
            <Image source={{ uri: image.uri }} className="h-full w-full" />
            <Pressable
              onPress={() => handleRemove(image.uri)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Remove image"
              className="absolute right-1 top-1 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", width: 22, height: 22 }}
            >
              <Ionicons name="close" size={IconSizes.xs} color="#ffffff" />
            </Pressable>
          </View>
        ))}
        {!atLimit ? (
          <Pressable
            onPress={handlePickImages}
            className={`${TILE_CLASS} items-center justify-center gap-1`}
            style={{ borderWidth: 1, borderColor: theme.borderColor, borderStyle: "dashed" }}
            accessibilityRole="button"
            accessibilityLabel="Add photos"
          >
            <Ionicons name="image-outline" size={IconSizes.lg} color={theme.iconMuted} />
            <Text className="text-2xs" style={{ color: theme.iconMuted }}>
              Add
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Text className="text-2xs" style={{ color: theme.tabIconColour }}>
        {images.length}/{MAX_IMAGES}
      </Text>
    </View>
  );
};

export default ComposerImagePicker;
