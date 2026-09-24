/**
 * DIRECTION CONTRACT — impeccable, surface-scope round, key 882b4450
 * (code-led: no native simulator/emulator available this session, so this
 * commits to no rendered comp — see the skill's code-led path.)
 *
 * THESIS: Composing a post is one screen, not a wizard — title and body
 *   stay in view while photos/location/tags collapse into precise,
 *   grid-locked rows that expand on demand and hold a confirmed-state chip
 *   once filled.
 * OWN-WORLD: Universe's established mobile brand as it actually ships today
 *   — Colors.light/dark (constants/colors.js) + Colors.primary violet CTA,
 *   the same system PostCard.tsx/ProfileHeader.tsx use, not Uniwind's
 *   semantic color classes (unadopted by any real screen — see PostCard.tsx's
 *   own comment on why). Uniwind utility classes are still used, but only
 *   for spacing/radius/type-scale, matching that same established split.
 * STORY: A poster writes a title and body immediately, then optionally opens
 *   Photos/Location/Tags — each confirms what's inside without leaving the
 *   screen — and posts via a thumb-reachable sticky bar.
 * FIRST VIEWPORT: Title field, then body field, both always open; three
 *   closed accordion rows below; Cancel/Post pinned to the bottom, sticky to
 *   the keyboard.
 * FORM: Sticky Bar + Expanding Sections — one of three structures dealt from
 *   seven grounded candidates (concept-seed.mjs --scope surface --mode
 *   operate, key 882b4450), locked by the user over THE ROLL (Guided
 *   Sequential Reveal) and Step Wizard/Sheet.
 */
import { Alert, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import PostForm, { type PostFormSubmitData } from "@components/post/PostForm";
import { useCreatePostMutation } from "@queryAndMutation/mutations/post-mutation";
import type { CreatePostFile } from "@queryAndMutation/mutations/post-mutation";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { useTabBarClearance } from "@hooks/useTabBarClearance";
import type { ComposerImage } from "@components/post/ComposerImagePicker";

// A small fanned stack of post cards, topped with a "+" badge — the
// heading's decorative mark, deliberately built from the same rounded-card
// shape PostCard.tsx renders real posts as, rather than an abstract gradient
// wash, so it reads as "a new post" rather than generic hero chrome.
const ComposeStackMark = () => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <View style={{ width: 88, height: 88 }}>
      <View
        style={{
          position: "absolute",
          top: 22,
          left: 2,
          width: 54,
          height: 66,
          borderRadius: 14,
          backgroundColor: Colors.primary,
          opacity: 0.65,
          transform: [{ rotate: "-22deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 4,
          left: 26,
          width: 54,
          height: 66,
          borderRadius: 14,
          backgroundColor: theme.uiBackground,
          borderWidth: 1.5,
          borderColor: Colors.primary,
          padding: 9,
          gap: 5,
          transform: [{ rotate: "9deg" }],
        }}
      >
        <View style={{ height: 4, width: "70%", borderRadius: 2, backgroundColor: Colors.primary }} />
        <View
          style={{ height: 4, width: "45%", borderRadius: 2, backgroundColor: theme.borderColor }}
        />
        <View
          style={{
            flex: 1,
            width: "100%",
            marginTop: 2,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.borderColor,
          }}
        >
          <Ionicons name="image" size={IconSizes.xs} color={Colors.primary} style={{ opacity: 0.55 }} />
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.primary,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Ionicons name="add" size={18} color="#ffffff" />
      </View>
    </View>
  );
};

const isLocalImage = (image: ComposerImage): image is Exclude<ComposerImage, string> =>
  typeof image !== "string";

const CreatePost = () => {
  const tabBarClearance = useTabBarClearance();
  const { mutateAsync: createPost, isPending } = useCreatePostMutation();

  const handleCancel = () => router.navigate("/home");

  const onSubmit = async (data: PostFormSubmitData) => {
    try {
      await createPost({
        title: data.title,
        body: data.body,
        location: data.location,
        tags: data.tags,
        images: data.images.filter(isLocalImage).map(
          (image): CreatePostFile => ({
            uri: image.uri,
            name: image.fileName ?? "photo.jpg",
            type: image.mimeType ?? "image/jpeg",
          }),
        ),
        ...(data.type === "opportunity"
          ? {
              type: "opportunity" as const,
              opportunityType: data.opportunityType,
              workplaceType: data.workplaceType,
              companyName: data.companyName,
              applyUrl: data.applyUrl,
              deadlineAt: data.deadlineAt,
            }
          : {}),
      });
      router.navigate("/home");
    } catch {
      Alert.alert("Couldn't post", "Something went wrong. Please try again.");
    }
  };

  return (
    <PostForm
      heading="New post"
      subheading="Share what's on your mind with your campus."
      headingAccessory={<ComposeStackMark />}
      submitLabel="Post"
      isSubmitting={isPending}
      onSubmit={onSubmit}
      onCancel={handleCancel}
      submitBarExtraBottomInset={tabBarClearance}
    />
  );
};

export default CreatePost;
