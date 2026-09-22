import { Keyboard, TouchableWithoutFeedback, View, Text } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@universe/shared/schemas/auth.schema.js";
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
  const insets = useSafeAreaInsets();
  const logIn = useAuthStore((state) => state.logIn);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { promptAsync, isLoading: isGoogleLoading } = useGoogleAuth();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async ({ email, password }: LoginInput) => {
    try {
      await logIn(email, password);
      router.replace("/home");
    } catch {
      setError("root", { message: "Login failed. Please check your credentials." });
    }
  };

  const handleGoogleLogin = async () => {
    await promptAsync();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: authPalette.pageBg }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <AuthHeroHeader tagline="Connect. Discover. Share." />

        <AuthCard>
          <View>
            <Text className="text-2xl font-bold" style={{ color: authPalette.textPrimary }}>
              Login
            </Text>
            <Text className="text-sm" style={{ color: authPalette.textMuted, marginTop: 4 }}>
              Right where you left off.
            </Text>
          </View>

          {errors.root?.message ? (
            <Text className="text-sm" style={{ color: authPalette.error }}>
              {errors.root.message}
            </Text>
          ) : null}

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <AuthTextField
                id="login-email"
                label="Email"
                icon="mail-outline"
                placeholder="you@university.edu"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.email?.message}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <AuthTextField
                id="login-password"
                label="Password"
                icon="lock-closed-outline"
                placeholder="Enter your password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.password?.message}
                isPassword
                autoCapitalize="none"
                autoComplete="password"
              />
            )}
          />

          <AuthPrimaryButton label="Login" onPress={handleSubmit(onSubmit)} loading={isLoading} />

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
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
};

export default Login;
