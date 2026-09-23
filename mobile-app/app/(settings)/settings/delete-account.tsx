import { useState } from "react";
import {
  View,
  Text,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "@components/ThemedView";
import SettingsScreenHeader from "@components/settings/SettingsScreenHeader";
import SettingsPrimaryButton from "@components/settings/SettingsPrimaryButton";
import SettingsPasswordField from "@components/settings/SettingsPasswordField";
import ComposerField from "@components/post/ComposerField";
import { useAuthStore } from "@store/authStore";
import { useDeleteAccountMutation } from "@queryAndMutation/mutations/account-mutation";
import { Colors } from "@constants/colors";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const WARNING_ICON_SIZE = 40;

const CONSEQUENCES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "image-outline", label: "All your posts and photos" },
  { icon: "chatbubbles-outline", label: "Your messages and conversations" },
  { icon: "people-outline", label: "Your groups, events, and connections" },
  { icon: "person-remove-outline", label: "Your profile, permanently" },
];

const DeleteAccount = () => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const user = useAuthStore((state) => state.user);
  // Not derived from googleId — a Google-linked account can also have set a
  // password later ("Set password" in Change Password), and would then need
  // it here too.
  const hasPassword = Boolean(user?.hasPassword);
  const username = (user?.username as string) ?? "";

  const { mutateAsync: deleteAccount, isPending } = useDeleteAccountMutation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const passwordsMismatch = hasPassword && confirmPassword.length > 0 && password !== confirmPassword;
  const canConfirm =
    confirmUsername === username &&
    (!hasPassword || (password.length > 0 && password === confirmPassword));

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteAccount(hasPassword ? password : undefined);
      Alert.alert("Account deleted", "Your account has been permanently deleted.");
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError?.message ?? "Could not delete account");
    }
  };

  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title="Delete Account" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1">
          <KeyboardAwareScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={24}
          >
            <View className="items-center gap-3 px-gutter pb-2 pt-6">
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 72, height: 72, backgroundColor: `${Colors.warning}1f` }}
              >
                <Ionicons name="warning" size={WARNING_ICON_SIZE} color={Colors.warning} />
              </View>
              <Text
                className="text-center text-2xl font-bold"
                style={{ color: theme.title }}
              >
                Delete your account?
              </Text>
              <Text className="text-center text-base" style={{ color: theme.text }}>
                This is permanent and can't be undone. You'll lose:
              </Text>
            </View>

            <View className="gap-2.5 px-gutter pt-2">
              {CONSEQUENCES.map((item) => (
                <View key={item.label} className="flex-row items-center gap-3">
                  <Ionicons name={item.icon} size={20} color={Colors.warning} />
                  <Text className="flex-1 text-base font-medium" style={{ color: theme.title }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <View
              className="gap-stack mx-gutter mt-section rounded-2xl p-4"
              style={{
                backgroundColor: theme.uiBackground,
                borderWidth: 1,
                borderColor: Colors.warning,
              }}
            >
              {hasPassword ? (
                <>
                  <SettingsPasswordField
                    label="Password"
                    autoComplete="current-password"
                    value={password}
                    onChangeText={setPassword}
                    showRevealToggle={false}
                    preventCopyPaste
                  />
                  <SettingsPasswordField
                    label="Confirm password"
                    autoComplete="current-password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    showRevealToggle={false}
                    preventCopyPaste
                    error={passwordsMismatch ? "Passwords don't match" : undefined}
                  />
                </>
              ) : null}

              <ComposerField
                label={`Type ${username} to confirm`}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                value={confirmUsername}
                onChangeText={setConfirmUsername}
              />

              {error ? (
                <Text className="text-sm font-medium" style={{ color: Colors.warning }}>
                  {error}
                </Text>
              ) : null}
            </View>

            <View className="px-gutter pt-stack">
              <SettingsPrimaryButton
                label={isPending ? "Deleting..." : "Delete account"}
                onPress={handleDelete}
                disabled={!canConfirm}
                loading={isPending}
                danger
              />
            </View>
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>
    </ThemedView>
  );
};

export default DeleteAccount;
