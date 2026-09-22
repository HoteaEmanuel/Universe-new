import {
  View,
  Text,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
} from "react-native";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import { Link, router } from "expo-router";
import { Image } from "react-native";
import Logo1 from "../../assets/logo_1.png";
import Spacer from "../../components/Spacer";
import ThemeTextInput from "../../components/ThemeTextInput";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useGoogleAuth } from "../../hooks/useGoogleAuth.js";
import { PressableScale } from "../../lib/styled";
// import Logo from "../../assets/images/.svg";
const Login = () => {
  const { logIn } = useAuthStore();
  const { promptAsync } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const handleGoogleLogin = async () => {
    await promptAsync();
  };
  const [showPassword, setShowPassword] = useState(false);
  const handleNormalLogin = async () => {
    console.log(email, password);
    if (!email || !password || email.trim() === "" || password.trim() === "") {
      setError("Please fill in all fields");
      return;
    }
    try {
      await logIn(email, password);
      console.log("HEEERE");
      router.replace("/home");
    } catch (error) {
      setError("Login failed. Please check your credentials.");
    }
  };
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        // Dismiss the keyboard when tapping outside of input fields
        Keyboard.dismiss();
      }}
    >
      <ThemedView className="items-center gap-10 h-full" safe={true}>
        {/* <View id="stars" />
        <View id="stars2" />
        <View id="stars3" /> */}
        <View className="items-center w-full ">
          <View className="w-60 h-40">
            <Image source={Logo1} className="w-full h-full" />
          </View>

          <ThemedText title={true} className="text-7xl font-kaushan pr-25">
            Universe&apos;
          </ThemedText>
          <Spacer height={15} />
          {/* <ThemedText title={true} className="text-2xl font-bold font-sans">
            Connect. Discover. Share.
          </ThemedText> */}
        </View>
        <View className="items-center w-full gap-5 h-1/2">
          <ThemedText title={true} className="text-4xl font-bold w-3/4">
            Login
          </ThemedText>
          {error ? (
            <ThemedText style={{ color: "red", width: "75%" }}>
              {error}
            </ThemedText>
          ) : null}
          <View className="w-3/4 gap-5">
            <ThemeTextInput
              placeholder="Email"
              className="w-full"
              value={email}
              onChangeText={setEmail}
              style={{ keyboardType: "email-address" }}
            />
            <ThemeTextInput
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              className="w-full"
            >
              {/* <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="gray"
                className="self-end"
                onPress={() => setShowPassword((prev) => !prev)}
              /> */}
            </ThemeTextInput>
          </View>

          <PressableScale
            onPress={handleNormalLogin}
            className="bg-violet-950 items-center p-4 w-3/4 rounded-lg active:bg-violet-700 "
          >
            <ThemedText className="text-xl">Login</ThemedText>
          </PressableScale>

          <View
            flexDirection="row"
            className="gap-2 w-3/4 items-center justify-center"
          >
            <ThemedText>Don&apos;t have an account? -</ThemedText>
            <Link href="/signup">
              <ThemedText className="text-xl underline">Sign Up</ThemedText>
            </Link>
          </View>
          <View className="w-3/4 flex-row items-center gap-2">
            <View className="w-[45%] border h-1 bg-gray-300"></View>
            <ThemedText className="text-xl ">Or</ThemedText>
            <View className="w-[45%] border h-1 bg-gray-300"></View>
          </View>

          <PressableScale
            onPress={handleGoogleLogin}
            className="flex-row w-3/4 p-4 gap-4 border items-center justify-center rounded-lg active:bg-gray-700 "
          >
            <Ionicons name="logo-google" size={24} color="white" />
            <ThemedText className="text-lg">Continue with Google</ThemedText>
          </PressableScale>
        </View>
        <Link href="/profile">
          <ThemedText className="text-sm opacity-50 underline">
            Go to profile (for testing)
          </ThemedText>
        </Link>
        <Link href="/">
          <ThemedText className="text-sm opacity-50 underline">
            Go to index
          </ThemedText>
        </Link>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

export default Login;
