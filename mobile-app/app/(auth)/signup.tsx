import { Keyboard, TouchableWithoutFeedback, View, Text } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@universe/shared/schemas/auth.schema.js";
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

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { accountType: "normal", email: "", password: "" },
  });

  const onSubmit = async ({ email, password, accountType }: SignupInput) => {
    try {
      await signUp({ email, password, accountType });
      router.replace("/home");
    } catch {
      setError("root", { message: "Sign up failed. Please try again." });
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await promptAsync();
    } catch {
      setError("root", { message: "Google sign up failed. Please try again." });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: authPalette.pageBg }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <AuthHeroHeader tagline="Join your course community." />

        <AuthCard>
          <View>
            <Text className="text-2xl font-bold" style={{ color: authPalette.textPrimary }}>
              Create your account
            </Text>
            <Text className="text-sm" style={{ color: authPalette.textMuted, marginTop: 4 }}>
              Takes less than a minute.
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
                id="signup-email"
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
                id="signup-password"
                label="Password"
                icon="lock-closed-outline"
                placeholder="Create a password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.password?.message}
                isPassword
                autoCapitalize="none"
                autoComplete="password-new"
                hint="At least 8 characters"
              />
            )}
          />

          <AuthPrimaryButton
            label="Create account"
            onPress={handleSubmit(onSubmit)}
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
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
};

export default SignUp;
