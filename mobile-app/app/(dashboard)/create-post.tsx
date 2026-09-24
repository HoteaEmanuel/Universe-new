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
import { useEffect, useState } from "react";
import { View, Text, Keyboard, TouchableWithoutFeedback, Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import type * as ImagePicker from "expo-image-picker";
import type { OpportunityType, WorkplaceType } from "@universe/shared";
import ThemedView from "@components/ThemedView";
import ComposerField from "@components/post/ComposerField";
import ExpandingSection from "@components/post/ExpandingSection";
import ComposerImagePicker from "@components/post/ComposerImagePicker";
import ComposerSubmitBar from "@components/post/ComposerSubmitBar";
import LocationAutocompleteField from "@components/post/LocationAutocompleteField";
import PostTypeToggle from "@components/post/PostTypeToggle";
import OpportunityFields from "@components/post/OpportunityFields";
import { PressableScale } from "@lib/styled";
import { useAuthStore } from "@store/authStore";
import { useCreatePostMutation } from "@queryAndMutation/mutations/post-mutation";
import { useSuggestHashtagsQuery } from "@queryAndMutation/queries/ai-queries";
import { useDebounce } from "@hooks/useDebounce";
import { confirmDiscardChanges } from "@utils/confirmDiscardChanges";
import { isValidApplyUrl } from "@utils/opportunity";
import { Colors } from "@constants/colors";
import { TITLE_MAX_LENGTH, BODY_MAX_LENGTH, LOCATION_MAX_LENGTH, TAGS_MAX_LENGTH } from "@constants/postForm";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import type { CreatePostFormValues } from "@/types/createPost";

type SectionKey = "photos" | "location" | "tags";

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

const CreatePost = () => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const { mutateAsync: createPost, isPending } = useCreatePostMutation();
  const user = useAuthStore((state) => state.user);
  const canPublishOpportunity =
    user?.role === "admin" ||
    (user?.accountType === "business" && user?.identityVerified === "true");

  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    photos: false,
    location: false,
    tags: false,
  });
  const [postType, setPostType] = useState<"standard" | "opportunity">("standard");
  const [opportunityType, setOpportunityType] = useState<OpportunityType | undefined>();
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType | undefined>();
  const [deadline, setDeadline] = useState<Date | undefined>();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreatePostFormValues>({
    defaultValues: { title: "", body: "", location: "", tags: "", companyName: "", applyUrl: "" },
  });
  const titleValue = watch("title");
  const bodyValue = watch("body");
  const tagsValue = watch("tags");
  const locationValue = watch("location");
  const companyNameValue = watch("companyName");
  const applyUrlValue = watch("applyUrl");

  const debouncedBody = useDebounce(bodyValue, 1500);
  const { data: suggestedHashtags } = useSuggestHashtagsQuery(bodyValue, debouncedBody);
  const [hasAutoExpandedTags, setHasAutoExpandedTags] = useState(false);

  const toggleSection = (key: SectionKey) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // Tags are required to post (see constants/postForm.ts), but the row
  // starts collapsed, so a disabled Post button with unexplained AI
  // suggestions sitting hidden behind an accordion is the exact "no
  // feedback" complaint this was built to fix — surface them by opening
  // the row once, the first time a suggestion set lands.
  useEffect(() => {
    if (!hasAutoExpandedTags && (suggestedHashtags?.length ?? 0) > 0) {
      setExpanded((prev) => ({ ...prev, tags: true }));
      setHasAutoExpandedTags(true);
    }
  }, [suggestedHashtags, hasAutoExpandedTags]);

  const handleAddHashtag = (tag: string) => {
    const words = tagsValue.trim().length ? tagsValue.trim().split(/\s+/) : [];
    if (words.includes(tag)) return;
    setValue("tags", [...words, tag].join(" "), { shouldValidate: true, shouldDirty: true });
  };

  const isOpportunity = postType === "opportunity";
  const opportunityFieldsValid =
    !isOpportunity ||
    (!!opportunityType &&
      !!workplaceType &&
      companyNameValue.trim().length >= 2 &&
      isValidApplyUrl(applyUrlValue));

  const disabled =
    titleValue.trim().length < 2 || tagsValue.trim().length === 0 || !opportunityFieldsValid;
  const hasContent =
    titleValue.trim().length > 0 ||
    bodyValue.trim().length > 0 ||
    locationValue.trim().length > 0 ||
    tagsValue.trim().length > 0 ||
    companyNameValue.trim().length > 0 ||
    applyUrlValue.trim().length > 0 ||
    images.length > 0;

  const handleCancel = () => {
    if (hasContent) {
      confirmDiscardChanges(() => router.navigate("/home"));
    } else {
      router.navigate("/home");
    }
  };

  const onSubmit = async (data: CreatePostFormValues) => {
    try {
      await createPost({
        title: data.title,
        body: data.body || undefined,
        location: data.location || undefined,
        tags: data.tags,
        images: images.map((image) => ({
          uri: image.uri,
          name: image.fileName ?? "photo.jpg",
          type: image.mimeType ?? "image/jpeg",
        })),
        ...(isOpportunity
          ? {
              type: "opportunity" as const,
              opportunityType,
              workplaceType,
              companyName: data.companyName.trim(),
              applyUrl: data.applyUrl.trim(),
              deadlineAt: deadline?.toISOString(),
            }
          : {}),
      });
      reset();
      setImages([]);
      setPostType("standard");
      setOpportunityType(undefined);
      setWorkplaceType(undefined);
      setDeadline(undefined);
      router.navigate("/home");
    } catch {
      Alert.alert("Couldn't post", "Something went wrong. Please try again.");
    }
  };

  const tagsCount = tagsValue.trim().length ? tagsValue.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <ThemedView safe fullHeight style={{ paddingBottom: 0 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1">
          <KeyboardAwareScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={24}
          >
            <View className="flex-row items-center gap-4 px-gutter pb-2 pt-10">
              <View className="flex-1 gap-1">
                <Text className="text-3xl font-bold" style={{ color: theme.title }}>
                  New post
                </Text>
                <Text className="text-sm" style={{ color: theme.text }}>
                  Share what's on your mind with your campus.
                </Text>
              </View>
              <ComposeStackMark />
            </View>

            <View className="gap-section px-gutter">
              {canPublishOpportunity ? (
                <PostTypeToggle value={postType} onChange={setPostType} />
              ) : null}

              <View className="gap-stack">
                <Controller
                  control={control}
                  name="title"
                  rules={{
                    required: "A title is required",
                    validate: (value) =>
                      value.length < 2 || value.length > TITLE_MAX_LENGTH
                        ? `The title should have between 2-${TITLE_MAX_LENGTH} characters`
                        : true,
                  }}
                  render={({ field }) => (
                    <ComposerField
                      label="Title"
                      placeholder="Give your post a title"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.title?.message}
                      maxLength={TITLE_MAX_LENGTH}
                      currentLength={field.value.length}
                      autoFocus
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="body"
                  rules={{
                    validate: (value) => {
                      if (value.length > BODY_MAX_LENGTH)
                        return `The body should have less than ${BODY_MAX_LENGTH} characters`;
                      if (value.length > 0 && value.length < 5)
                        return "The body should have at least 5 characters";
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <ComposerField
                      label="Description (optional)"
                      placeholder="Write something..."
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.body?.message}
                      maxLength={BODY_MAX_LENGTH}
                      currentLength={field.value.length}
                      multiline
                    />
                  )}
                />
              </View>

              {isOpportunity ? (
                <OpportunityFields
                  control={control}
                  errors={errors}
                  opportunityType={opportunityType}
                  onOpportunityTypeChange={setOpportunityType}
                  workplaceType={workplaceType}
                  onWorkplaceTypeChange={setWorkplaceType}
                  deadline={deadline}
                  onDeadlineChange={setDeadline}
                />
              ) : null}

              <View className="gap-2">
                <ExpandingSection
                  label="Photos"
                  icon="image-outline"
                  summary={images.length ? `${images.length} added` : undefined}
                  expanded={expanded.photos}
                  onToggle={() => toggleSection("photos")}
                >
                  <ComposerImagePicker images={images} onChange={setImages} />
                </ExpandingSection>

                <ExpandingSection
                  label="Location"
                  icon="location-outline"
                  summary={locationValue.trim() || undefined}
                  expanded={expanded.location}
                  onToggle={() => toggleSection("location")}
                >
                  <Controller
                    control={control}
                    name="location"
                    rules={{
                      validate: (value) =>
                        value.length > LOCATION_MAX_LENGTH
                          ? `The location should have less than ${LOCATION_MAX_LENGTH} characters`
                          : true,
                    }}
                    render={({ field }) => (
                      <LocationAutocompleteField
                        value={field.value}
                        onChangeText={field.onChange}
                        onSelect={(value) =>
                          setValue("location", value, { shouldValidate: true, shouldDirty: true })
                        }
                        onBlur={field.onBlur}
                        error={errors.location?.message}
                        maxLength={LOCATION_MAX_LENGTH}
                        currentLength={field.value.length}
                      />
                    )}
                  />
                </ExpandingSection>

                <ExpandingSection
                  label="Tags"
                  icon="pricetag-outline"
                  summary={tagsCount ? `${tagsCount} added` : undefined}
                  expanded={expanded.tags}
                  onToggle={() => toggleSection("tags")}
                >
                  <Controller
                    control={control}
                    name="tags"
                    rules={{
                      required: "Add a tag",
                      validate: (value) => {
                        if (value.length === 0) return "Add a tag";
                        if (value.length > TAGS_MAX_LENGTH)
                          return `Tags should have less than ${TAGS_MAX_LENGTH} characters`;
                        if (!/^[A-Za-z0-9]+( [A-Za-z0-9]+)*$/.test(value))
                          return "Tags should be space separated words";
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <ComposerField
                        label="Tags"
                        placeholder="Event Learn Explore"
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.tags?.message}
                        maxLength={TAGS_MAX_LENGTH}
                        currentLength={field.value.length}
                        autoCapitalize="none"
                      />
                    )}
                  />
                  {(suggestedHashtags?.length ?? 0) > 0 ? (
                    <View className="flex-row flex-wrap gap-2">
                      {suggestedHashtags!.map((tag) => (
                        <PressableScale
                          key={tag}
                          onPress={() => handleAddHashtag(tag)}
                          className="rounded-full px-3 py-1.5"
                          style={{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }}
                        >
                          <Text className="text-xs" style={{ color: theme.text }}>
                            #{tag}
                          </Text>
                        </PressableScale>
                      ))}
                    </View>
                  ) : null}
                </ExpandingSection>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>

      <ComposerSubmitBar
        onCancel={handleCancel}
        onSubmit={handleSubmit(onSubmit)}
        disabled={disabled}
        loading={isPending}
      />
    </ThemedView>
  );
};

export default CreatePost;
