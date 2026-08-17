import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
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
import PollComposeFields from "@/features/polls/components/PollComposeFields";
import {
  TITLE_MAX_LENGTH,
  BODY_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  TAGS_MAX_LENGTH,
} from "@/constants/postForm";

type PostFormValues = {
  title: string;
  body: string;
  location: string;
  tags: string;
};

const CreatePost = () => {
  useEffect(() => {
    document.title = "Create Post";
  }, []);
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
  const tagsValue = watchedValues.tags || "";

  const handleTogglePoll = () => {
    setShowPoll((prev) => !prev);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const onSubmit = async (data: PostFormValues) => {
    const trimmedOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
    const poll =
      showPoll && pollQuestion.trim() && trimmedOptions.length >= 2
        ? { question: pollQuestion.trim(), options: trimmedOptions }
        : undefined;
    const payload: CreatePostPayload = { ...data, images: files, poll };
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

  return (
    <section className="w-full py-6">
      <PostFormCard title="Create a post">
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
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

          <TextareaField
            id="body"
            label="Description (optional)"
            maxLength={BODY_MAX_LENGTH}
            currentLength={watchedValues.body?.length ?? 0}
            error={errors.body?.message}
            placeholder="Write something..."
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
          />

          <div className="flex flex-col gap-1.5">
            <Label className="">Images</Label>
            <MultipleImagesUploader setFiles={setFiles} files={files} />
          </div>

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
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddHashtag(tag)}
                    className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    #{tag}
                  </button>
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
