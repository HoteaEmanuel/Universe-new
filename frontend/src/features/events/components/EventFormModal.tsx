import { useEffect, useState, type KeyboardEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FormField from "@/components/FormField";
import TextareaField from "@/components/TextareaField";
import LocationAutocompleteField from "@/features/posts/components/LocationAutocompleteField";
import MultipleImagesUploader from "@/features/posts/components/MultipleImagesUploader";
import DateTimePickerField from "./DateTimePickerField";
import StepWizardHeader from "@/components/StepWizardHeader";
import { useStepWizard } from "@/hooks/useStepWizard";
import {
  useCreateEventMutation,
  useUpdateEventMutation,
} from "@/queryAndMutation/mutations/event-mutation";
import { useEventStore } from "@/store/eventStore";
import type { EventDetails, EventVisibility } from "@/queryAndMutation/types";
import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
} from "@/constants/eventForm";

type EventFormModalProps =
  | { mode: "create"; open: boolean; onClose: () => void }
  | { mode: "edit"; event: EventDetails; open: boolean; onClose: () => void };

type EventFormValues = {
  title: string;
  description?: string;
  location?: string;
  virtualUrl?: string;
  startAt?: Date;
  endAt?: Date;
  capacity?: string;
};

const STEP_LABELS = [
  "Basics",
  "Date & time",
  "Location",
  "Cover image",
  "Final details",
] as const;
const TOTAL_STEPS = STEP_LABELS.length;

const FIELDS_BY_STEP: (keyof EventFormValues)[][] = [
  ["title", "description"],
  ["startAt", "endAt"],
  ["location"],
  [],
  ["virtualUrl", "capacity"],
];

const EventFormModal = (props: EventFormModalProps) => {
  const { mode, open, onClose } = props;
  const event = mode === "edit" ? props.event : undefined;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    control,
    formState: { errors },
  } = useForm<EventFormValues>();
  const { stepIndex, isLastStep, goBack, goNext: advanceStep, reset: resetStep } =
    useStepWizard(TOTAL_STEPS);
  const [visibility, setVisibility] = useState<EventVisibility>("public");
  const [coverImageFiles, setCoverImageFiles] = useState<(File | string)[]>([]);
  const { mutate: createEvent, isPending: isCreating } = useCreateEventMutation();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEventMutation(event?.id);
  const isPending = mode === "create" ? isCreating : isUpdating;
  const { updateEventCoverImage } = useEventStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    resetStep();
    if (mode === "edit" && event) {
      reset({
        title: event.title,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        virtualUrl: event.virtualUrl ?? undefined,
        startAt: new Date(event.startAt),
        endAt: event.endAt ? new Date(event.endAt) : undefined,
        capacity: event.capacity ? String(event.capacity) : undefined,
      });
      setCoverImageFiles(event.coverImageUrl ? [event.coverImageUrl] : []);
    } else {
      reset();
      setVisibility("public");
      setCoverImageFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, event]);

  const watchedValues = watch();
  const startAt = watchedValues.startAt;

  const closeAndReset = () => {
    reset();
    resetStep();
    setVisibility("public");
    setCoverImageFiles([]);
    onClose();
  };

  const goNext = async () => {
    const valid = await trigger(FIELDS_BY_STEP[stepIndex]);
    if (valid) advanceStep();
  };

  const handleFormKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !isLastStep) e.preventDefault();
  };

  const onSubmit = (data: EventFormValues) => {
    if (!data.startAt) return;
    const coverImage = coverImageFiles[0];

    const payload = {
      title: data.title,
      description: data.description || undefined,
      location: data.location || undefined,
      virtualUrl: data.virtualUrl || undefined,
      startAt: data.startAt.toISOString(),
      endAt: data.endAt ? data.endAt.toISOString() : undefined,
      capacity: data.capacity ? Number(data.capacity) : undefined,
    };

    const invalidateEventQueries = (eventId: string) => {
      queryClient.invalidateQueries({ queryKey: ["events-discover"] });
      queryClient.invalidateQueries({ queryKey: ["events-mine"] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    };

    if (mode === "create") {
      createEvent(
        { ...payload, visibility },
        {
          onSuccess: (createdEvent) => {
            if (coverImage instanceof File) {
              updateEventCoverImage(createdEvent.id, coverImage)
                .then(() => invalidateEventQueries(createdEvent.id))
                .catch(() =>
                  toast.error("Event created, but the cover image failed to upload"),
                );
            }
          },
        },
      );
    } else if (event) {
      updateEvent(payload, {
        onSuccess: () => {
          if (coverImage instanceof File) {
            updateEventCoverImage(event.id, coverImage)
              .then(() => invalidateEventQueries(event.id))
              .catch(() =>
                toast.error("Event updated, but the cover image failed to upload"),
              );
          }
        },
      });
    }

    closeAndReset();
  };

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => !next && closeAndReset()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit event" : "Create an event"}</DialogTitle>
        </DialogHeader>
        <StepWizardHeader
          current={stepIndex + 1}
          total={TOTAL_STEPS}
          label={STEP_LABELS[stepIndex]}
          onBack={goBack}
        />
        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={handleFormKeyDown}
          className="flex flex-col gap-4"
        >
          <div key={stepIndex} className="animate-fade-in-up flex flex-col gap-4">
            {stepIndex === 0 && (
              <>
                <FormField
                  id="event-title"
                  label="Title"
                  error={errors.title?.message}
                  registration={register("title", {
                    required: "Title is required",
                    minLength: {
                      value: 3,
                      message: "Title must be at least 3 characters",
                    },
                  })}
                  placeholder="e.g. Career Fair 2026"
                />
                <TextareaField
                  id="event-description"
                  label="Description (optional)"
                  maxLength={EVENT_DESCRIPTION_MAX_LENGTH}
                  currentLength={watchedValues.description?.length ?? 0}
                  registration={register("description", {
                    validate: (v) =>
                      !v ||
                      v.length <= EVENT_DESCRIPTION_MAX_LENGTH ||
                      `Description should have less than ${EVENT_DESCRIPTION_MAX_LENGTH} characters`,
                  })}
                  placeholder="What's this event about?"
                  rows={3}
                />
              </>
            )}

            {stepIndex === 1 && (
              <>
                <Controller
                  control={control}
                  name="startAt"
                  rules={{ required: "Start date is required" }}
                  render={({ field }) => (
                    <DateTimePickerField
                      id="event-start"
                      label="Starts"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.startAt?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="endAt"
                  rules={{
                    validate: (v) =>
                      !v || !startAt || v > startAt || "End must be after the start",
                  }}
                  render={({ field }) => (
                    <DateTimePickerField
                      id="event-end"
                      label="Ends (optional)"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.endAt?.message}
                      minDate={startAt}
                    />
                  )}
                />
              </>
            )}

            {stepIndex === 2 && (
              <LocationAutocompleteField
                id="event-location"
                label="Location (optional)"
                value={watchedValues.location ?? ""}
                onSelect={(value) =>
                  setValue("location", value, { shouldValidate: true, shouldDirty: true })
                }
                maxLength={EVENT_LOCATION_MAX_LENGTH}
                currentLength={watchedValues.location?.length ?? 0}
                error={errors.location?.message}
                registration={register("location", {
                  validate: (v) =>
                    !v ||
                    v.length <= EVENT_LOCATION_MAX_LENGTH ||
                    `Location should have less than ${EVENT_LOCATION_MAX_LENGTH} characters`,
                })}
              />
            )}

            {stepIndex === 3 && (
              <div className="flex flex-col gap-1.5">
                <Label>Cover image (optional)</Label>
                <MultipleImagesUploader
                  files={coverImageFiles}
                  setFiles={setCoverImageFiles}
                  maxImages={1}
                />
              </div>
            )}

            {stepIndex === 4 && (
              <>
                <FormField
                  id="event-virtual-url"
                  label="Virtual link (optional)"
                  registration={register("virtualUrl")}
                  placeholder="https://..."
                />
                <FormField
                  id="event-capacity"
                  label="Capacity (optional)"
                  type="number"
                  error={errors.capacity?.message}
                  registration={register("capacity", {
                    validate: (v) =>
                      !v || Number(v) > 0 || "Capacity must be at least 1",
                  })}
                  placeholder="Leave empty for unlimited"
                />
                {mode === "create" && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Visibility</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={visibility === "public" ? "default" : "outline"}
                        className="flex-1 justify-start gap-2"
                        onClick={() => setVisibility("public")}
                      >
                        <Globe />
                        Public
                      </Button>
                      <Button
                        type="button"
                        variant={visibility === "private" ? "default" : "outline"}
                        className="flex-1 justify-start gap-2"
                        onClick={() => setVisibility("private")}
                      >
                        <Lock />
                        Private
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {visibility === "public"
                        ? "Discoverable and announced in the feed."
                        : "Only visible to people you invite - not posted to the feed."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeAndReset}>
              Cancel
            </Button>
            {isLastStep ? (
              <Button key="submit-btn" type="submit" disabled={isPending}>
                {mode === "edit" ? "Save changes" : "Create event"}
              </Button>
            ) : (
              <Button key="next-btn" type="button" onClick={goNext}>
                Next
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormModal;
