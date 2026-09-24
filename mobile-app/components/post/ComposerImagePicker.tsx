import { View, Text, Image, Pressable, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { MAX_IMAGES } from "@constants/postForm";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

// A picked local asset (create, or newly-added on edit) or an existing
// remote URL string to keep (edit only) — mirrors UpdatePostPayload's
// `images: (TFile | string)[]`, so the form can hand this straight to the
// update mutation without re-splitting it.
export type ComposerImage = ImagePicker.ImagePickerAsset | string;

const imageUri = (image: ComposerImage) => (typeof image === "string" ? image : image.uri);

type ComposerImagePickerProps = {
  images: ComposerImage[];
  onChange: (images: ComposerImage[]) => void;
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
    onChange(images.filter((image) => imageUri(image) !== uri));
  };

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-2">
        {images.map((image) => (
          <View key={imageUri(image)} className={TILE_CLASS}>
            <Image source={{ uri: imageUri(image) }} className="h-full w-full" />
            <Pressable
              onPress={() => handleRemove(imageUri(image))}
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
