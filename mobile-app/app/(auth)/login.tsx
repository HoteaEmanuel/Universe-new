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

const Login = () => {
  const logIn = useAuthStore((state) => state.logIn);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { promptAsync, isLoading: isGoogleLoading } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    try {
      await logIn(email, password);
      router.replace("/home");
    } catch {
      setError("Login failed. Please check your credentials.");
    }
  };

  const handleGoogleLogin = async () => {
    await promptAsync();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: authPalette.pageBg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeroHeader tagline="Connect. Discover. Share." />

          <AuthCard>
            <View>
              <Text style={{ fontSize: 26, fontWeight: "700", color: authPalette.textPrimary }}>
                Login
              </Text>
              <Text style={{ fontSize: 13, color: authPalette.textMuted, marginTop: 4 }}>
                Right where you left off.
              </Text>
            </View>

            {error ? (
              <Text style={{ fontSize: 13, color: "#ff8a8a" }}>{error}</Text>
            ) : null}

            <AuthTextField
              id="login-email"
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
              id="login-password"
              label="Password"
              icon="lock-closed-outline"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
              autoComplete="password"
            />

            <AuthPrimaryButton label="Login" onPress={handleLogin} loading={isLoading} />

            <AuthDivider />

            <GoogleButton
              label="Continue with Google"
              onPress={handleGoogleLogin}
              loading={isGoogleLoading}
            />
          </AuthCard>

          <AuthSwitchLink
            prompt="Don't have an account?"
            actionLabel="Sign Up"
            href="/signup"
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Login;
