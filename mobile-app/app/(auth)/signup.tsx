import { useState } from "react";
import {
  View,
  Text,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import AuthHeroHeader from "../../components/auth/AuthHeroHeader";
import AuthCard from "../../components/auth/AuthCard";
import AuthTextField from "../../components/auth/AuthTextField";
import AuthPrimaryButton from "../../components/auth/AuthPrimaryButton";
import AuthDivider from "../../components/auth/AuthDivider";
import GoogleButton from "../../components/auth/GoogleButton";
import AuthSwitchLink from "../../components/auth/AuthSwitchLink";
import { authPalette } from "../../components/auth/authPalette";

const SignUp = () => {
  const insets = useSafeAreaInsets();
  const signUp = useAuthStore((state) => state.signUp);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { promptAsync, isLoading: isGoogleLoading } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    try {
      await signUp({ email, password });
      router.replace("/home");
    } catch {
      setError("Sign up failed. Please try again.");
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await promptAsync();
    } catch {
      setError("Google sign up failed. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: authPalette.pageBg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeroHeader tagline="Join your course community." />

          <AuthCard>
            <View>
              <Text style={{ fontSize: 24, fontWeight: "700", color: authPalette.textPrimary }}>
                Create your account
              </Text>
              <Text style={{ fontSize: 13, color: authPalette.textMuted, marginTop: 4 }}>
                Takes less than a minute.
              </Text>
            </View>

            {error ? (
              <Text style={{ fontSize: 13, color: "#ff8a8a" }}>{error}</Text>
            ) : null}

            <AuthTextField
              id="signup-email"
              label="Email"
              icon="mail-outline"
              placeholder="you@university.edu"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />

            <AuthTextField
              id="signup-password"
              label="Password"
              icon="lock-closed-outline"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
              autoComplete="password-new"
              hint="At least 8 characters"
            />

            <AuthPrimaryButton
              label="Create account"
              onPress={handleSignUp}
              loading={isLoading}
            />

            <AuthDivider />

            <GoogleButton
              label="Continue with Google"
              onPress={handleGoogleSignUp}
              loading={isGoogleLoading}
            />
          </AuthCard>

          <AuthSwitchLink
            prompt="Already have an account?"
            actionLabel="Login"
            href="/login"
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
