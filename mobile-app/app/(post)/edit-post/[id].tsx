import { useEffect } from "react";
import { Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import PostForm, { type PostFormSubmitData } from "@components/post/PostForm";
import type { ComposerImage } from "@components/post/ComposerImagePicker";
import ThemedView from "@components/ThemedView";
import { useGetPostQuery } from "@queryAndMutation/queries/post-queries";
import {
  useUpdatePostMutation,
  type CreatePostFile,
} from "@queryAndMutation/mutations/post-mutation";
import { useAuthStore } from "@store/authStore";
import { Colors } from "@constants/colors";

const toImagePayload = (images: ComposerImage[]): (CreatePostFile | string)[] =>
  images.map((image) =>
    typeof image === "string"
      ? image
      : { uri: image.uri, name: image.fileName ?? "photo.jpg", type: image.mimeType ?? "image/jpeg" },
  );

const EditPost = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { data: post, isPending: postPending } = useGetPostQuery(id);
  const { mutateAsync: updatePost, isPending: isSaving } = useUpdatePostMutation(user?.id);

  // Only reachable from the post-details 3-dot menu, which only renders for
  // the post's owner - this is a defensive fallback, not the primary guard.
  useEffect(() => {
    if (post && post.userId !== user?.id) router.back();
  }, [post, user?.id]);

  if (postPending || !post) {
    return (
      <ThemedView safe className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  const handleCancel = () => router.back();

  const onSubmit = async (data: PostFormSubmitData) => {
    try {
      await updatePost({
        id,
        title: data.title,
        body: data.body ?? "",
        location: data.location,
        tags: data.tags,
        images: toImagePayload(data.images),
        type: data.type,
        ...(data.type === "opportunity"
          ? {
              opportunityType: data.opportunityType,
              workplaceType: data.workplaceType,
              companyName: data.companyName,
              applyUrl: data.applyUrl,
              deadlineAt: data.deadlineAt,
            }
          : {}),
      });
      router.back();
    } catch {
      Alert.alert("Couldn't save", "Something went wrong. Please try again.");
    }
  };

  return (
    <PostForm
      heading="Edit post"
      subheading="Update what you shared with your campus."
      initialValues={{
        title: post.title,
        body: post.body ?? "",
        location: post.location ?? "",
        tags: post.tags.join(" "),
        companyName: post.companyName ?? "",
        applyUrl: post.applyUrl ?? "",
        images: post.imagesUrls,
        postType: post.type === "opportunity" ? "opportunity" : "standard",
        opportunityType: post.opportunityType ?? undefined,
        workplaceType: post.workplaceType ?? undefined,
        deadline: post.deadlineAt ? new Date(post.deadlineAt) : undefined,
      }}
      submitLabel="Save changes"
      isSubmitting={isSaving}
      discardTitle="Discard your changes?"
      discardMessage="Your edits won't be saved."
      onSubmit={onSubmit}
      onCancel={handleCancel}
    />
  );
};

export default EditPost;
