import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  useDeletePostMutation,
  useUpdatePostMutation,
  type UpdatePostPayload,
} from "@/queryAndMutation/mutations/post-mutation";
import { useGetPostQuery } from "@/queryAndMutation/queries/post-queries";
import { useAuthStore } from "@/store/authStore";
import MultipleImagesUploader from "./components/MultipleImagesUploader";
import PostFormCard from "./components/PostFormCard";
import FormField from "@/components/FormField";
import LocationAutocompleteField from "./components/LocationAutocompleteField";
import TextareaField from "@/components/TextareaField";
import SubmitButton from "@/components/SubmitButton";
import DateTimePickerField from "@/components/DateTimePickerField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  OPPORTUNITY_TYPES,
} from "@/constants/postForm";
import type { OpportunityType, WorkplaceType } from "@/queryAndMutation/types";

type PostFormValues = {
  title: string;
  body: string;
  location: string;
  tags: string;
  companyName: string;
  applyUrl: string;
  deadlineAt?: Date;
};

const EditPost = () => {
  useEffect(() => {
    document.title = "Edit Post";
  }, []);
  const { id } = useParams();
  const { user } = useAuthStore();
  const canPublishOpportunity = user?.role === "admin" || (user?.accountType === "business" && user?.identityVerified === "true");
  const [postType, setPostType] = useState<"standard" | "opportunity">("standard");
  const [opportunityType, setOpportunityType] = useState<OpportunityType>("internship");
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>("onsite");
  const [files, setFiles] = useState<(File | string)[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
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
        companyName: post.companyName ?? "",
        applyUrl: post.applyUrl ?? "",
        deadlineAt: post.deadlineAt ? new Date(post.deadlineAt) : undefined,
      });
      setFiles(post.imagesUrls);
      setPostType(post.type === "opportunity" ? "opportunity" : "standard");
      if (post.opportunityType) setOpportunityType(post.opportunityType);
      if (post.workplaceType) setWorkplaceType(post.workplaceType);
    }
  }, [post, reset]);

  if (isPending || !post) return <p>Fetching the post data</p>;

  const onSubmit = (data: PostFormValues) => {
    if (postType === "standard" && files[0] === undefined) {
      setImageError("Add an image");
      return;
    }
    const { deadlineAt, companyName, applyUrl, ...formValues } = data;
    const payload: UpdatePostPayload = {
      ...formValues,
      id: id ?? "",
      images: files,
      type: postType,
      ...(postType === "opportunity" ? {
        opportunityType,
        workplaceType,
        companyName: companyName.trim(),
        applyUrl: applyUrl.trim(),
        deadlineAt: deadlineAt ? deadlineAt.toISOString() : undefined,
      } : {}),
    };
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
          {canPublishOpportunity && (
            <div className="flex flex-col gap-1.5">
              <Label>Post type</Label>
              <div className="inline-flex w-fit rounded-full bg-muted p-1">
                <Button type="button" size="sm" variant={postType === "standard" ? "default" : "ghost"} className="rounded-full" onClick={() => setPostType("standard")}>Post</Button>
                <Button type="button" size="sm" variant={postType === "opportunity" ? "default" : "ghost"} className="rounded-full" onClick={() => setPostType("opportunity")}>Job or internship</Button>
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

          {postType === "opportunity" && (
            <section className="flex flex-col gap-4 rounded-2xl bg-primary/[0.06] p-4 dark:bg-brand-400/10">
              <div>
                <h2 className="font-semibold">Opportunity details</h2>
                <p className="text-sm text-muted-foreground">Students will apply on the external page you provide.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Opportunity type</Label>
                  <Select value={opportunityType} onValueChange={(value: unknown) => setOpportunityType(value as OpportunityType)}>
                    <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{OPPORTUNITY_TYPES.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Workplace</Label>
                  <Select value={workplaceType} onValueChange={(value: unknown) => setWorkplaceType(value as WorkplaceType)}>
                    <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onsite">On-site</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem><SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <FormField id="company-name" label="Company" placeholder="Company or organization" error={errors.companyName?.message} registration={register("companyName", { required: postType === "opportunity" ? "Enter the company name" : false, minLength: { value: 2, message: "Company name is too short" } })} />
              <FormField id="apply-url" type="url" label="External application link" placeholder="https://linkedin.com/jobs/..." error={errors.applyUrl?.message} registration={register("applyUrl", { required: postType === "opportunity" ? "Add an application link" : false, validate: (value) => postType !== "opportunity" || value.startsWith("https://") || "Application links must use HTTPS" })} />
              <Controller
                control={control}
                name="deadlineAt"
                rules={{ validate: (value) => !value || value.getTime() > Date.now() || "Choose a future deadline" }}
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
              {imageError && !files[0] && <p className="error">{imageError}</p>}
              <MultipleImagesUploader setFiles={setFiles} files={files} />
            </div>
          )}

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
