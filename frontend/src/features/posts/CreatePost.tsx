import { Controller, useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreatePostMutation,
  type CreatePostPayload,
} from "@/queryAndMutation/mutations/post-mutation";
import { useGetAiHashtagsQuery } from "@/queryAndMutation/queries/ai-queries";
import { useDebounce } from "@/hooks/Debounce";
import MultipleImagesUploader from "./components/MultipleImagesUploader";
import PostFormCard from "./components/PostFormCard";
import FormField from "@/components/FormField";
import LocationAutocompleteField from "./components/LocationAutocompleteField";
import TextareaField from "@/components/TextareaField";
import SubmitButton from "@/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateTimePickerField from "@/components/DateTimePickerField";
import PollComposeFields from "@/features/polls/components/PollComposeFields";
import MentionAutocomplete from "@/components/MentionAutocomplete";
import { useMentionAutocomplete } from "@/hooks/useMentionAutocomplete";
import { insertMentionAtCursor } from "@/utils/insertMentionAtCursor";
import {
  TITLE_MAX_LENGTH,
  BODY_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  TAGS_MAX_LENGTH,
  OPPORTUNITY_TYPES,
} from "@/constants/postForm";
import type { OpportunityType, WorkplaceType } from "@/queryAndMutation/types";
import { useAuthStore } from "@/store/authStore";

type PostFormValues = {
  title: string;
  body: string;
  location: string;
  tags: string;
  companyName: string;
  applyUrl: string;
  deadlineAt?: Date;
};

const CreatePost = () => {
  useEffect(() => {
    document.title = "Create Post";
  }, []);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canPublishOpportunity =
    user?.role === "admin" ||
    (user?.accountType === "business" && user?.identityVerified === "true");
  const [postType, setPostType] = useState<"standard" | "opportunity">(
    "standard",
  );
  const [opportunityType, setOpportunityType] =
    useState<OpportunityType>("internship");
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>("onsite");
  const [caption, setCaption] = useState("");
  const bodyInputRef = useRef<HTMLTextAreaElement>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PostFormValues>();
  const debouncedSearch = useDebounce(caption, 1500);
  const { data: aiSuggestedHashTags } = useGetAiHashtagsQuery(
    caption,
    debouncedSearch,
  );

  const { mutateAsync: createPost } = useCreatePostMutation();
  const [files, setFiles] = useState<File[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const watchedValues = watch();
  const titleValue= watchedValues.title || "";
  const tagsValue = watchedValues.tags || "";
  const mentionAutocomplete = useMentionAutocomplete({
    inputRef: bodyInputRef,
    value: watchedValues.body ?? "",
  });

  const handleTogglePoll = () => {
    setShowPoll((prev) => !prev);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const onSubmit = async (data: PostFormValues) => {
    const trimmedOptions = pollOptions
      .map((option) => option.trim())
      .filter(Boolean);
    const poll =
      showPoll && pollQuestion.trim() && trimmedOptions.length >= 2
        ? { question: pollQuestion.trim(), options: trimmedOptions }
        : undefined;
    const { deadlineAt, ...formValues } = data;
    const payload: CreatePostPayload = {
      ...formValues,
      images: files,
      poll: postType === "standard" ? poll : undefined,
      type: postType,
      ...(postType === "opportunity"
        ? {
            opportunityType,
            workplaceType,
            companyName: data.companyName.trim(),
            applyUrl: data.applyUrl.trim(),
            deadlineAt: deadlineAt ? deadlineAt.toISOString() : undefined,
          }
        : {}),
    };
    await createPost(payload);
    navigate("/home");
  };

  const handleAddHashtag = (tag: string) => {
    const words = tagsValue.trim().length ? tagsValue.trim().split(/\s+/) : [];
    if (words.includes(tag)) return;
    setValue("tags", [...words, tag].join(" "), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  console.log(watchedValues.title, watchedValues.tags);

  const disabled =
    isSubmitting ||
    titleValue.trim().length === 0 ||
    tagsValue.trim().length === 0 ||
    (postType === "opportunity" &&
      (watchedValues?.companyName.trim().length === 0 ||
        watchedValues?.applyUrl.trim().length === 0));

  return (
    <section className="w-full py-6">
      <PostFormCard title="Create a post">
        <form className="flex flex-col gap-4 mb-20" onSubmit={handleSubmit(onSubmit)}>
          {canPublishOpportunity && (
            <div className="flex flex-col gap-1.5">
              <Label>Post type</Label>
              <div className="inline-flex w-fit rounded-full bg-muted p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={postType === "standard" ? "default" : "ghost"}
                  className="rounded-full"
                  onClick={() => setPostType("standard")}
                >
                  Post
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={postType === "opportunity" ? "default" : "ghost"}
                  className="rounded-full"
                  onClick={() => setPostType("opportunity")}
                >
                  Job or internship
                </Button>
              </div>
            </div>
          )}

          <FormField
            id="post-title"
            label="Title"
            placeholder="Give your post a title"
            maxLength={TITLE_MAX_LENGTH}
            currentLength={watchedValues.title?.length ?? 0}
            error={errors.title?.message}
            registration={register("title", {
              required: "A title is required",
              validate: (v) => {
                if (v.length < 2 || v.length > TITLE_MAX_LENGTH)
                  return `The title should have between 2-${TITLE_MAX_LENGTH} characters`;
                return true;
              },
            })}
          />

          <div className="relative">
            <TextareaField
              id="body"
              label="Description (optional)"
              maxLength={BODY_MAX_LENGTH}
              currentLength={watchedValues.body?.length ?? 0}
              error={errors.body?.message}
              placeholder="Write something... Use @ to mention someone"
              inputRef={bodyInputRef}
              registration={register("body", {
                validate: (v) => {
                  if (v.length > BODY_MAX_LENGTH)
                    return `The body should have less than ${BODY_MAX_LENGTH} characters`;
                  if (v.length > 0 && v.length < 5)
                    return "The body should have at least 5 characters";
                  return true;
                },
              })}
              onChange={(e) => setCaption(e.target.value)}
              onKeyUp={mentionAutocomplete.refresh}
              onClick={mentionAutocomplete.refresh}
            />
            {mentionAutocomplete.isOpen && (
              <MentionAutocomplete
                users={mentionAutocomplete.users}
                isLoading={mentionAutocomplete.isLoading}
                onSelect={(user) =>
                  insertMentionAtCursor({
                    input: bodyInputRef.current,
                    value: watchedValues.body ?? "",
                    username: user.username,
                    onChange: (body) => {
                      setValue("body", body, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setCaption(body);
                    },
                  })
                }
              />
            )}
          </div>

          {postType === "opportunity" && (
            <section className="flex flex-col gap-4 rounded-2xl bg-primary/[0.06] p-4 dark:bg-brand-400/10">
              <div>
                <h2 className="font-semibold">Opportunity details</h2>
                <p className="text-sm text-muted-foreground">
                  Students will apply on the external page you provide.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Opportunity type</Label>
                  <Select
                    value={opportunityType}
                    onValueChange={(value: unknown) =>
                      setOpportunityType(value as OpportunityType)
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPPORTUNITY_TYPES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Workplace</Label>
                  <Select
                    value={workplaceType}
                    onValueChange={(value: unknown) =>
                      setWorkplaceType(value as WorkplaceType)
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <FormField
                id="company-name"
                label="Company"
                placeholder="Company or organization"
                error={errors.companyName?.message}
                registration={register("companyName", {
                  required:
                    postType === "opportunity"
                      ? "Enter the company name"
                      : false,
                  minLength: { value: 2, message: "Company name is too short" },
                })}
              />
              <FormField
                id="apply-url"
                type="url"
                label="External application link"
                placeholder="https://linkedin.com/jobs/..."
                error={errors.applyUrl?.message}
                registration={register("applyUrl", {
                  required:
                    postType === "opportunity"
                      ? "Add an application link"
                      : false,
                  validate: (value) =>
                    postType !== "opportunity" ||
                    value.startsWith("https://") ||
                    "Application links must use HTTPS",
                })}
              />
              <Controller
                control={control}
                name="deadlineAt"
                rules={{
                  validate: (value) =>
                    !value ||
                    value.getTime() > Date.now() ||
                    "Choose a future deadline",
                }}
                render={({ field }) => (
                  <DateTimePickerField
                    id="application-deadline"
                    label="Application deadline (optional)"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.deadlineAt?.message}
                    minDate={new Date()}
                  />
                )}
              />
            </section>
          )}

          {postType === "standard" && (
            <div className="flex flex-col gap-1.5">
              <Label className="">Images</Label>
              <MultipleImagesUploader setFiles={setFiles} files={files} />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {!showPoll ? (
              <Button
                type="button"
                variant="ghost"
                className="w-fit"
                onClick={handleTogglePoll}
              >
                Add a poll
              </Button>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Label>Poll</Label>
                  <button
                    type="button"
                    onClick={handleTogglePoll}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Remove poll
                  </button>
                </div>
                <PollComposeFields
                  question={pollQuestion}
                  onQuestionChange={setPollQuestion}
                  options={pollOptions}
                  onOptionsChange={setPollOptions}
                />
              </>
            )}
          </div>

          <LocationAutocompleteField
            id="location"
            label="Location"
            value={watchedValues.location ?? ""}
            onSelect={(value) =>
              setValue("location", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            maxLength={LOCATION_MAX_LENGTH}
            currentLength={watchedValues.location?.length ?? 0}
            error={errors.location?.message}
            registration={register("location", {
              validate: (v) => {
                if (v.length > LOCATION_MAX_LENGTH)
                  return `The location should have less than ${LOCATION_MAX_LENGTH} characters`;
                return true;
              },
            })}
          />

          <div className="flex flex-col gap-1.5">
            <FormField
              id="tags"
              label="Tags"
              placeholder="Event Learn Explore"
              maxLength={TAGS_MAX_LENGTH}
              currentLength={tagsValue.length}
              error={errors.tags?.message}
              registration={register("tags", {
                required: "Add a tag",
                validate: (v) => {
                  if (v.length === 0) return "Add a tag";
                  if (v.length > TAGS_MAX_LENGTH)
                    return `Tags should have less than ${TAGS_MAX_LENGTH} characters`;
                  const regex = /^[A-Za-z0-9]+( [A-Za-z0-9]+)*$/;
                  if (!regex.test(v))
                    return "Tags should be space separated words";
                  return true;
                },
              })}
            />
            {(aiSuggestedHashTags?.hashtags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {aiSuggestedHashTags!.hashtags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full bg-muted px-2 text-xs text-muted-foreground"
                    onClick={() => handleAddHashtag(tag)}
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/home")}
            >
              Cancel
            </Button>
            <SubmitButton
              isLoading={isSubmitting}
              loadingText="Creating..."
              className="w-auto"
              disabled={disabled}
            >
              Share
            </SubmitButton>
          </div>
        </form>
      </PostFormCard>
    </section>
  );
};

export default CreatePost;
