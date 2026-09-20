import { View, Text, TouchableWithoutFeedback, Keyboard } from "react-native";
import React from "react";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemeTextInput from "../../components/ThemeTextInput";
import { Pressable } from "react-native";
import Spacer from "../../components/Spacer";
import Logo1 from "../../assets/logo_1.png";
import { Image } from "react-native";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useGoogleAuth } from "../hooks/useGoogleAuth.js";
const SignUp = () => {
  const { signUp } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { promptAsync } = useGoogleAuth();
  const handleSignUp = async () => {
    if (!email || !password || email.trim() === "" || password.trim() === "") {
      setError("Please fill in all fields");
      return;
    }
    try {
      await signUp({ email, password });
      router.replace("/home");
    } catch (err) {
      setError("Sign up failed. Please try again.");
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await promptAsync();
    } catch (err) {
      setError("Google sign up failed. Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ThemedView className="items-center gap-10" safe={true}>
        <View className="items-center w-full ">
          <Image source={Logo1} className="w-60 h-40" />
          <ThemedText title={true} className="text-7xl font-kaushan pr-25">
            Universe'
          </ThemedText>
          <Spacer height={15} />
          <ThemedText title={true} className="text-2xl font-bold font-sans">
            Connect. Discover. Share.
          </ThemedText>
        </View>
        <View className="items-center w-full gap-5 h-1/2">
          <ThemedText title={true} className="text-4xl font-bold w-3/4">
            Sign Up
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
            />
            <ThemeTextInput
              placeholder="Password"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              className="w-full"
            />
          </View>

          <Pressable
            onPress={handleSignUp}
            className="bg-violet-950 items-center p-4 w-3/4 rounded-lg active:bg-violet-700 "
          >
            <ThemedText className="text-xl">Sign Up</ThemedText>
          </Pressable>

          <View
            flexDirection="row"
            className="gap-2 w-3/4 items-center justify-center"
          >
            <ThemedText>Already have an account? -</ThemedText>
            <Link href="/login">
              <ThemedText className="text-xl underline">Login</ThemedText>
            </Link>
          </View>
          <ThemedText className="text-sm opacity-50">Or</ThemedText>
          <Pressable
            className="flex-row w-3/4 p-4 gap-4 border items-center justify-center rounded-lg active:bg-gray-700 "
            onPress={handleGoogleSignUp}
          >
            <Ionicons name="logo-google" size={24} color="white" />
            <ThemedText className="text-lg">Continue with Google</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

export default SignUp;
