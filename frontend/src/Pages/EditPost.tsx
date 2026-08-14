import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  useDeletePostMutation,
  useUpdatePostMutation,
  type UpdatePostPayload,
} from "../queryAndMutation/mutations/post-mutation";
import { useGetPostQuery } from "../queryAndMutation/queries/post-queries";
import { useAuthStore } from "../store/authStore";
import MultipleImagesUploader from "../components/MultipleImagesUploader.jsx";
import PostFormCard from "@/components/PostFormCard";
import FormField from "@/components/FormField";
import LocationAutocompleteField from "@/components/LocationAutocompleteField";
import TextareaField from "@/components/TextareaField";
import SubmitButton from "@/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const EditPost = () => {
  useEffect(() => {
    document.title = "Edit Post";
  }, []);
  const { id } = useParams();
  const { user } = useAuthStore() as { user?: { id: string } };
  const [files, setFiles] = useState<(File | string)[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PostFormValues>();
  const watchedValues = watch();

  const [imageError, setImageError] = useState("");

  const { data: post, isPending } = useGetPostQuery(id);
  const updatePostMutation = useUpdatePostMutation(user?.id);
  const deletePostMutation = useDeletePostMutation(id ?? "", user?.id);

  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        body: post.body,
        location: post.location ?? "",
        tags: post.tags.join(" "),
      });
      setFiles(post.imagesUrls);
    }
  }, [post, reset]);

  if (isPending || !post) return <p>Fetching the post data</p>;

  const onSubmit = (data: PostFormValues) => {
    if (files[0] === undefined) {
      setImageError("Add an image");
      return;
    }
    const payload: UpdatePostPayload = { ...data, id: id ?? "", images: files };
    updatePostMutation.mutate(payload);
    navigate("/profile");
  };

  return (
    <section className="w-full py-6">
      <PostFormCard title="Edit the post">
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
              required: "Title is required",
              validate: (v) => {
                if (v.length > TITLE_MAX_LENGTH)
                  return `The title should have less than ${TITLE_MAX_LENGTH} characters`;
                return true;
              },
            })}
          />

          <TextareaField
            id="body"
            label="Description"
            maxLength={BODY_MAX_LENGTH}
            currentLength={watchedValues.body?.length ?? 0}
            error={errors.body?.message}
            registration={register("body", {
              required: "The body is required",
              validate: (v) => {
                if (v.length > BODY_MAX_LENGTH || v.length < 5)
                  return `The body should have 5-${BODY_MAX_LENGTH} characters`;
                return true;
              },
            })}
          />

          <div className="flex flex-col gap-1.5">
            <Label className="">Images</Label>
            {imageError && !files[0] && <p className="error">{imageError}</p>}
            <MultipleImagesUploader setFiles={setFiles} files={files} />
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

          <FormField
            id="tags"
            label="Tags"
            placeholder="Event, Learn, Explore"
            maxLength={TAGS_MAX_LENGTH}
            currentLength={watchedValues.tags?.length ?? 0}
            error={errors.tags?.message}
            registration={register("tags", {
              required: "Add a tag",
              validate: (v) => {
                if (v.length === 0) return "Add a tag";
                if (v.length > TAGS_MAX_LENGTH)
                  return `Tags should have less than ${TAGS_MAX_LENGTH} characters`;
                return true;
              },
            })}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/profile")}
            >
              Cancel
            </Button>
            <SubmitButton
              isLoading={isSubmitting}
              loadingText="Saving..."
              className="w-auto"
            >
              Save changes
            </SubmitButton>
          </div>
        </form>
      </PostFormCard>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                deletePostMutation.mutate();
                navigate("/profile");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default EditPost;
