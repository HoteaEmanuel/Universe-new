import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Globe, Lock } from "lucide-react";
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
import DateTimePickerField from "./DateTimePickerField";
import { useCreateEventMutation } from "@/queryAndMutation/mutations/event-mutation";
import type { EventVisibility } from "@/queryAndMutation/types";
import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
} from "@/constants/eventForm";

type CreateEventModalProps = {
  open: boolean;
  onClose: () => void;
};

type CreateEventFormValues = {
  title: string;
  description?: string;
  location?: string;
  virtualUrl?: string;
  startAt?: Date;
  endAt?: Date;
  capacity?: string;
};

const CreateEventModal = ({ open, onClose }: CreateEventModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateEventFormValues>();
  const [visibility, setVisibility] = useState<EventVisibility>("public");
  const { mutate: createEvent, isPending } = useCreateEventMutation();

  const watchedValues = watch();
  const startAt = watchedValues.startAt;

  const closeAndReset = () => {
    reset();
    setVisibility("public");
    onClose();
  };

  const onSubmit = (data: CreateEventFormValues) => {
    if (!data.startAt) return;
    createEvent({
      title: data.title,
      description: data.description || undefined,
      location: data.location || undefined,
      virtualUrl: data.virtualUrl || undefined,
      startAt: data.startAt.toISOString(),
      endAt: data.endAt ? data.endAt.toISOString() : undefined,
      capacity: data.capacity ? Number(data.capacity) : undefined,
      visibility,
    });
    closeAndReset();
  };

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => !next && closeAndReset()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create an event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            id="event-title"
            label="Title"
            error={errors.title?.message}
            registration={register("title", {
              required: "Title is required",
              minLength: { value: 3, message: "Title must be at least 3 characters" },
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
          <div className="flex flex-col gap-4">
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
          </div>
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
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Create event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;
