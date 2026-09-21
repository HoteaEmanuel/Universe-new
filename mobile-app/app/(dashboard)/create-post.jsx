import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { useState } from "react";
import React from "react";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedTextInput from "../../components/ThemeTextInput";
import { Link, router } from "expo-router";
import Spacer from "../../components/Spacer";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "react-hook-form";
import { useCreatePostMutation } from "../../queryAndMutation/mutations/post-mutation";
import FormInput from "../../components/FormInput";
const CreatePost = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues: {
      caption: "",
    },
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      allowsEditing: true,
    });
    if (result.canceled) alert("Image not choosen");
    else setSelectedImages((image) => [...image, ...result.assets]);
  };
  const { mutate: createPost } = useCreatePostMutation();

  let array = [1, 2, 3];
  if (selectedImages.length) console.log("URI: ", selectedImages[0].uri);

  const onSubmit = async (data) => {
    try {
      let post = {
        title: data.title,
        tags: data.tags,
      };
      if (data.caption) post.caption = data.caption;
      if (selectedImages.length) post.images = selectedImages;
      console.log("CREATING POST: ", post);
      createPost(post);
      //router.back();
    } catch (error) {
      reset();
    }
  };

  return (
    <ScrollView>
      <ThemedView safe={true} className="flex gap-5 p-20 min-h-screen">
        <View className="w-full h-full gap-5 p-5">
          <ThemedText className="text-4xl font-bold text-center mt-10 mb-10">
            Create Post
          </ThemedText>
          <ThemedText className="text-xl font-bold">Title *</ThemedText>
          {errors.title && (
            <ThemedText className="text-red-500">
              {errors.title.type === "required" && "Title is required"}
            </ThemedText>
          )}
          <FormInput
            control={control}
            name="title"
            rules={{
              required: true,
            }}
            errors={errors}
            placeholder={"What's on your mind?"}
          />
          <ThemedText className="text-lg font-bold">Caption:</ThemedText>
          {/* {errors.caption && (
            <ThemedText className="text-red-500">
              {errors.caption.type === "required" && "Caption is required"}
            </ThemedText>
          )} */}
          <FormInput
            control={control}
            name="caption"
            placeholder="Caption"
            errors={errors}
            multiline={true}
          />
          <ThemedText className="text-2xl font-bold mt-5">
            Add images
          </ThemedText>
          {selectedImages.length > 0 && (
            <View className="flex flex-row gap-5 w-full p-5 h-60">
              {selectedImages.map((image, index) => (
                <Pressable
                  key={index}
                  style={{
                    width: `${100 / (selectedImages.length + 1)}%`,
                    height: "100%",
                  }}
                >
                  <View className="relative">
                    <Ionicons
                      name="remove"
                      size={10}
                      color="white"
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        zIndex: 10,
                        backgroundColor: "#b91c1c",
                        borderRadius: 999,
                        padding: 1,
                      }}
                      onPress={() => {
                        setSelectedImages((images) =>
                          images.filter((item) => image !== item),
                        );
                      }}
                    />
                    <Image
                      source={{ uri: image.uri }}
                      className="rounded-2xl w-full h-full z-0"
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          )}
          <Pressable
            className="flex flex-row w-full gap-2 text-center justify-center items-center m-auto border border-white p-3 rounded-xl w-40"
            onPress={pickImage}
          >
            <Ionicons name="images-outline" color={"#fff"} size={15} />{" "}
            <ThemedText className="text-xl">Choose images</ThemedText>{" "}
          </Pressable>

          <FormInput
            name={"tags"}
            rules={{ required: true }}
            control={control}
            errors={errors}
            placeholder={"Add tags ( e.g #university )"}
          />

          <Pressable
            className="flex flex-row text-center text-2xl justify-center m-auto border border-white p-2 rounded-xl w-40 violet-bg active:bg-violet-900"
            onPress={handleSubmit(onSubmit)}
          >
            <ThemedText>{isSubmitting ? "Posting..." : "Post"}</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </ScrollView>
  );
};

export default CreatePost;
