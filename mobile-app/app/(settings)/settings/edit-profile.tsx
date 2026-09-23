import { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  useColorScheme,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useForm, Controller } from "react-hook-form";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { validateUsernameFormat, getFullName } from "@universe/shared";
import ThemedView from "../../../components/ThemedView";
import SettingsScreenHeader from "../../../components/settings/SettingsScreenHeader";
import SettingsPrimaryButton from "../../../components/settings/SettingsPrimaryButton";
import ComposerField from "../../../components/post/ComposerField";
import { useAuthStore } from "../../../store/authStore";
import {
  useUpdateUsernameMutation,
  useUpdateBioMutation,
  useUpdateProfilePictureMutation,
} from "../../../queryAndMutation/mutations/user-mutation";
import { useUsernameAvailability } from "../../../hooks/useUsernameAvailability";
import { BIO_MAX_LENGTH } from "../../../constants/profileForm";
import { Colors } from "../../../constants/colors";
import { IconSizes } from "../../../constants/iconSizes";

const AVATAR_SIZE = 96;

type EditProfileValues = {
  username: string;
  bio: string;
};

const EditProfile = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const { user, updateCurrentUser, changeProfilePicture } = useAuthStore();
  const [photoError, setPhotoError] = useState<string | null>(null);

  const { mutateAsync: updateUsername } = useUpdateUsernameMutation();
  const { mutateAsync: updateBio, isPending: isSavingBio } = useUpdateBioMutation();
  const { mutateAsync: updateProfilePicture, isPending: isUploadingPhoto } =
    useUpdateProfilePictureMutation();

  const username = (user?.username as string) ?? "";
  const bio = (user?.bio as string) ?? "";
  const profilePicture = user?.profilePicture as string | undefined;

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileValues>({
    defaultValues: { username, bio },
  });
  const watchedUsername = watch("username");
  const { availability, message: availabilityMessage } = useUsernameAvailability(
    username,
    watchedUsername,
  );

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPhotoError(null);
    try {
      await updateProfilePicture({
        uri: asset.uri,
        name: asset.fileName ?? "profile.jpg",
        type: asset.mimeType ?? "image/jpeg",
      });
      await changeProfilePicture(asset.uri);
    } catch {
      setPhotoError("Could not update profile picture. Please try again.");
    }
  };

  const onSubmit = async (data: EditProfileValues) => {
    const nextUsername = data.username.trim().toLowerCase();
    try {
      if (nextUsername !== username) {
        const updatedUser = await updateUsername(nextUsername);
        updateCurrentUser(updatedUser);
      }
      await updateBio(data.bio);
      updateCurrentUser({ bio: data.bio });
      router.back();
    } catch (error) {
      const apiError = error as { code?: string; status?: number; message?: string };
      setError("username", {
        message:
          apiError?.status === 409 || apiError?.code === "USERNAME_TAKEN"
            ? "That username was just claimed. Please choose another."
            : (apiError?.message ?? "Could not save your profile. Please try again."),
      });
    }
  };

  if (!user) return null;

  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title="Edit Profile" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1">
          <KeyboardAwareScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={24}
          >
            <View className="items-center gap-3 px-6 pb-2 pt-4">
              <Pressable
                onPress={handlePickImage}
                disabled={isUploadingPhoto}
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
                className="relative"
              >
                {profilePicture ? (
                  <Image
                    source={{ uri: profilePicture }}
                    style={{
                      width: AVATAR_SIZE,
                      height: AVATAR_SIZE,
                      borderRadius: AVATAR_SIZE / 2,
                    }}
                  />
                ) : (
                  <Ionicons name="person-circle" size={AVATAR_SIZE} color={theme.iconMuted} />
                )}
                <View
                  className="absolute bottom-0 right-0 items-center justify-center rounded-full"
                  style={{
                    width: 30,
                    height: 30,
                    backgroundColor: Colors.primary,
                    borderWidth: 2,
                    borderColor: theme.background,
                  }}
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="camera" size={IconSizes.sm} color="#ffffff" />
                  )}
                </View>
              </Pressable>
              {photoError ? (
                <Text className="text-2xs" style={{ color: Colors.warning }}>
                  {photoError}
                </Text>
              ) : null}
              <Text className="text-lg font-semibold" style={{ color: theme.title }}>
                {getFullName(user as Record<string, unknown>)}
              </Text>
            </View>

            <View className="gap-stack px-gutter pt-4">
              <Controller
                control={control}
                name="username"
                rules={{
                  validate: (value) => validateUsernameFormat(value.trim().toLowerCase()) ?? true,
                }}
                render={({ field }) => (
                  <View className="gap-1.5">
                    <ComposerField
                      label="Username"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      error={errors.username?.message}
                    />
                    {!errors.username ? (
                      <Text
                        className="text-2xs"
                        style={{
                          color:
                            availability === "unavailable"
                              ? Colors.warning
                              : availability === "available"
                                ? "#22c55e"
                                : theme.tabIconColour,
                        }}
                      >
                        {availability === "checking" ? "Checking availability…" : availabilityMessage}
                      </Text>
                    ) : null}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="bio"
                rules={{
                  validate: (value) =>
                    value.length > BIO_MAX_LENGTH
                      ? `Bio should have less than ${BIO_MAX_LENGTH} characters`
                      : true,
                }}
                render={({ field }) => (
                  <ComposerField
                    label="Bio"
                    placeholder="Write something about yourself..."
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    multiline
                    maxLength={BIO_MAX_LENGTH}
                    currentLength={field.value.length}
                    error={errors.bio?.message}
                  />
                )}
              />

              <SettingsPrimaryButton
                label="Save changes"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting || isSavingBio}
              />
            </View>
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>
    </ThemedView>
  );
};

export default EditProfile;
