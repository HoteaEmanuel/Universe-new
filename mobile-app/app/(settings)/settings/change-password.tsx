import { View, Text, Alert, Keyboard, TouchableWithoutFeedback } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useForm, Controller } from "react-hook-form";
import { router } from "expo-router";
import ThemedView from "@components/ThemedView";
import SettingsScreenHeader from "@components/settings/SettingsScreenHeader";
import SettingsPrimaryButton from "@components/settings/SettingsPrimaryButton";
import SettingsPasswordField from "@components/settings/SettingsPasswordField";
import { useAuthStore } from "@store/authStore";
import { useChangePasswordMutation } from "@queryAndMutation/mutations/account-mutation";
import { Colors } from "@constants/colors";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type ChangePasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

const ChangePassword = () => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const user = useAuthStore((state) => state.user);
  // The account already has a password to verify against vs. this being a
  // first-time "set password" for a Google-only account — never derived
  // from googleId, since a Google account can also set a password later.
  const hasPassword = Boolean(user?.hasPassword);

  const { mutateAsync: changePassword, isPending } = useChangePasswordMutation();
  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });
  const newPasswordValue = watch("newPassword");

  const onSubmit = async (data: ChangePasswordValues) => {
    try {
      await changePassword({
        currentPassword: hasPassword ? data.currentPassword : undefined,
        newPassword: data.newPassword,
      });
      reset();
      Alert.alert(
        hasPassword ? "Password changed" : "Password set",
        hasPassword
          ? "Your password was changed successfully."
          : "Your password was set. You can now also sign in with your email and this password.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      const apiError = error as { message?: string };
      setError(hasPassword ? "currentPassword" : "newPassword", {
        message: apiError?.message ?? "Could not change password",
      });
    }
  };

  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title={hasPassword ? "Change Password" : "Set Password"} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1">
          <KeyboardAwareScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={24}
          >
            <View className="gap-stack px-gutter pt-4">
              {!hasPassword ? (
                <Text className="text-sm" style={{ color: theme.text }}>
                  Your account currently signs in with Google only. Set a password to also be
                  able to sign in with your email.
                </Text>
              ) : null}

              {hasPassword ? (
                <Controller
                  control={control}
                  name="currentPassword"
                  rules={{ required: "Enter your current password" }}
                  render={({ field }) => (
                    <SettingsPasswordField
                      label="Current password"
                      autoComplete="current-password"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.currentPassword?.message}
                    />
                  )}
                />
              ) : null}

              <Controller
                control={control}
                name="newPassword"
                rules={{ minLength: { value: 8, message: "Enter a minimum 8 characters password" } }}
                render={({ field }) => (
                  <SettingsPasswordField
                    label="New password"
                    autoComplete="new-password"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.newPassword?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="confirmNewPassword"
                rules={{
                  required: "Confirm your new password",
                  validate: (value) => value === newPasswordValue || "Passwords do not match",
                }}
                render={({ field }) => (
                  <SettingsPasswordField
                    label="Confirm new password"
                    autoComplete="new-password"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.confirmNewPassword?.message}
                  />
                )}
              />

              <SettingsPrimaryButton
                label={hasPassword ? "Change password" : "Set password"}
                onPress={handleSubmit(onSubmit)}
                loading={isPending}
              />
            </View>
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>
    </ThemedView>
  );
};

export default ChangePassword;
