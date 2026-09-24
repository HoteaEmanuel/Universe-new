import { useEffect, useState, type ReactNode } from "react";
import { View, Text, Keyboard, TouchableWithoutFeedback } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useForm, Controller } from "react-hook-form";
import type { OpportunityType, WorkplaceType } from "@universe/shared";
import ThemedView from "@components/ThemedView";
import ComposerField from "@components/post/ComposerField";
import ExpandingSection from "@components/post/ExpandingSection";
import ComposerImagePicker, { type ComposerImage } from "@components/post/ComposerImagePicker";
import ComposerSubmitBar from "@components/post/ComposerSubmitBar";
import LocationAutocompleteField from "@components/post/LocationAutocompleteField";
import PostTypeToggle, { type ComposerPostType } from "@components/post/PostTypeToggle";
import OpportunityFields from "@components/post/OpportunityFields";
import { PressableScale } from "@lib/styled";
import { useAuthStore } from "@store/authStore";
import { useSuggestHashtagsQuery } from "@queryAndMutation/queries/ai-queries";
import { useDebounce } from "@hooks/useDebounce";
import { confirmDiscardChanges } from "@utils/confirmDiscardChanges";
import { isValidApplyUrl } from "@utils/opportunity";
import { Colors } from "@constants/colors";
import { TITLE_MAX_LENGTH, BODY_MAX_LENGTH, LOCATION_MAX_LENGTH, TAGS_MAX_LENGTH } from "@constants/postForm";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import type { CreatePostFormValues } from "@/types/createPost";

type SectionKey = "photos" | "location" | "tags";

export type PostFormSubmitData = {
  title: string;
  body?: string;
  location?: string;
  tags: string;
  images: ComposerImage[];
  type: ComposerPostType;
  opportunityType?: OpportunityType;
  workplaceType?: WorkplaceType;
  companyName?: string;
  applyUrl?: string;
  deadlineAt?: string;
};

export type PostFormInitialValues = {
  title: string;
  body: string;
  location: string;
  tags: string;
  companyName: string;
  applyUrl: string;
  images: ComposerImage[];
  postType: ComposerPostType;
  opportunityType?: OpportunityType;
  workplaceType?: WorkplaceType;
  deadline?: Date;
};

const DEFAULT_INITIAL_VALUES: PostFormInitialValues = {
  title: "",
  body: "",
  location: "",
  tags: "",
  companyName: "",
  applyUrl: "",
  images: [],
  postType: "standard",
};

type PostFormProps = {
  heading: string;
  subheading: string;
  headingAccessory?: ReactNode;
  initialValues?: Partial<PostFormInitialValues>;
  submitLabel: string;
  isSubmitting: boolean;
  discardTitle?: string;
  discardMessage?: string;
  onSubmit: (data: PostFormSubmitData) => void;
  onCancel: () => void;
  // Passed by create-post.tsx (a dashboard tab, rendered under GlassTabBar's
  // floating bar) via useTabBarClearance. Left undefined by the edit-post
  // screen, which is a pushed stack screen with no tab bar to clear.
  submitBarExtraBottomInset?: number;
};

// Shared by create-post.tsx and the edit-post screen — the two only differ
// in heading copy, starting values, and what happens on submit/cancel.
// Everything about the fields themselves (validation, hashtag suggestions,
// the opportunity sub-form, the accordion rows) lives here once.
const PostForm = ({
  heading,
  subheading,
  headingAccessory,
  initialValues,
  submitLabel,
  isSubmitting,
  discardTitle,
  discardMessage,
  onSubmit,
  onCancel,
  submitBarExtraBottomInset,
}: PostFormProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const initial = { ...DEFAULT_INITIAL_VALUES, ...initialValues };
  const user = useAuthStore((state) => state.user);
  const canPublishOpportunity =
    user?.role === "admin" ||
    (user?.accountType === "business" && user?.identityVerified === "true");

  const [images, setImages] = useState<ComposerImage[]>(initial.images);
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    photos: false,
    location: false,
    tags: false,
  });
  const [postType, setPostType] = useState<ComposerPostType>(initial.postType);
  const [opportunityType, setOpportunityType] = useState<OpportunityType | undefined>(
    initial.opportunityType,
  );
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType | undefined>(
    initial.workplaceType,
  );
  const [deadline, setDeadline] = useState<Date | undefined>(initial.deadline);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePostFormValues>({
    defaultValues: {
      title: initial.title,
      body: initial.body,
      location: initial.location,
      tags: initial.tags,
      companyName: initial.companyName,
      applyUrl: initial.applyUrl,
    },
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
  // starts collapsed, so a disabled submit button with unexplained AI
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
      confirmDiscardChanges(onCancel, { title: discardTitle, message: discardMessage });
    } else {
      onCancel();
    }
  };

  const submit = (data: CreatePostFormValues) => {
    onSubmit({
      title: data.title,
      body: data.body || undefined,
      location: data.location || undefined,
      tags: data.tags,
      images,
      type: postType,
      ...(isOpportunity
        ? {
            opportunityType,
            workplaceType,
            companyName: data.companyName.trim(),
            applyUrl: data.applyUrl.trim(),
            deadlineAt: deadline?.toISOString(),
          }
        : {}),
    });
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
                  {heading}
                </Text>
                <Text className="text-sm" style={{ color: theme.text }}>
                  {subheading}
                </Text>
              </View>
              {headingAccessory}
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
        onSubmit={handleSubmit(submit)}
        submitLabel={submitLabel}
        disabled={disabled}
        loading={isSubmitting}
        extraBottomInset={submitBarExtraBottomInset}
      />
    </ThemedView>
  );
};

export default PostForm;
