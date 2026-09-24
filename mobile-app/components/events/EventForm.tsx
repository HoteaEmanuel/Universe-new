import { useEffect, useState } from "react";
import { View, Text, Keyboard, TouchableWithoutFeedback, Alert, Platform } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import type { EventDetails, EventVisibility } from "@universe/shared";
import ThemedView from "@components/ThemedView";
import ComposerField from "@components/post/ComposerField";
import LocationAutocompleteField from "@components/post/LocationAutocompleteField";
import ComposerSubmitBar from "@components/post/ComposerSubmitBar";
import SelectChip from "@components/SelectChip";
import { PressableScale } from "@lib/styled";
import { useCreateEventMutation, useUpdateEventMutation } from "@queryAndMutation/mutations/event-mutation";
import { confirmDiscardChanges } from "@utils/confirmDiscardChanges";
import { formatEventDateTimeLabel } from "@utils/event";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import {
  EVENT_TITLE_MAX_LENGTH,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
} from "@constants/eventForm";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type EventFormValues = {
  title: string;
  description: string;
  location: string;
  virtualUrl: string;
  capacity: string;
};

type PickerTarget = "start" | "end" | null;
type PickerMode = "date" | "time";

type EventFormProps = { mode: "create" } | { mode: "edit"; event: EventDetails };

const VISIBILITY_OPTIONS: { value: EventVisibility; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "public", label: "Public", icon: "globe-outline" },
  { value: "private", label: "Private", icon: "lock-closed-outline" },
];

// Single form for both create and edit — same fields/validation either way
// (per packages/shared's UpdateEventPayload = CreateEventPayload minus
// visibility/hostGroupId), matching web's EventFormModal split into one
// component rather than two near-identical screens. Visibility only shows
// in create mode since it can't be changed after creation.
const EventForm = (props: EventFormProps) => {
  const { mode } = props;
  const event = mode === "edit" ? props.event : undefined;
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  const { mutateAsync: createEvent, isPending: isCreating } = useCreateEventMutation();
  const { mutateAsync: updateEvent, isPending: isUpdating } = useUpdateEventMutation(event?.id);
  const isSaving = mode === "create" ? isCreating : isUpdating;

  const [startAt, setStartAt] = useState<Date | undefined>(event ? new Date(event.startAt) : undefined);
  const [endAt, setEndAt] = useState<Date | undefined>(event?.endAt ? new Date(event.endAt) : undefined);
  const [initialDates] = useState<{ startAt?: number; endAt?: number }>({
    startAt: event ? new Date(event.startAt).getTime() : undefined,
    endAt: event?.endAt ? new Date(event.endAt).getTime() : undefined,
  });
  const [visibility, setVisibility] = useState<EventVisibility>("public");
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>("date");

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<EventFormValues>({
    defaultValues: event
      ? {
          title: event.title,
          description: event.description ?? "",
          location: event.location ?? "",
          virtualUrl: event.virtualUrl ?? "",
          capacity: event.capacity ? String(event.capacity) : "",
        }
      : { title: "", description: "", location: "", virtualUrl: "", capacity: "" },
  });
  const titleValue = watch("title");

  // Only needed for edit — event data can arrive a tick after first render
  // (the screen mounts as soon as the cached/fetched query resolves), so
  // this catches the case where defaultValues above were still empty.
  useEffect(() => {
    if (!event) return;
    reset({
      title: event.title,
      description: event.description ?? "",
      location: event.location ?? "",
      virtualUrl: event.virtualUrl ?? "",
      capacity: event.capacity ? String(event.capacity) : "",
    });
    setStartAt(new Date(event.startAt));
    setEndAt(event.endAt ? new Date(event.endAt) : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  // Android's default display is a self-dismissing dialog per mode, so a
  // valid selection auto-advances date -> time -> closed. iOS's spinner
  // renders inline and fires onChange continuously while scrolling, so
  // there the "Next"/"Done" button below drives the mode transition instead
  // — same pattern as OpportunityFields.tsx's deadline picker.
  const handlePickerChange = (_e: unknown, selectedDate?: Date) => {
    if (!selectedDate) {
      if (Platform.OS === "android") setPickerTarget(null);
      return;
    }
    const current = pickerTarget === "start" ? startAt : endAt;
    const setter = pickerTarget === "start" ? setStartAt : setEndAt;
    if (pickerMode === "date") {
      const next = new Date(selectedDate);
      if (current) next.setHours(current.getHours(), current.getMinutes(), 0, 0);
      else next.setHours(9, 0, 0, 0);
      setter(next);
      if (Platform.OS === "android") setPickerMode("time");
    } else {
      const base = current ? new Date(current) : new Date();
      base.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      setter(base);
      if (Platform.OS === "android") setPickerTarget(null);
    }
  };

  const openPicker = (target: PickerTarget) => {
    setPickerTarget(target);
    setPickerMode("date");
  };

  const endBeforeStart = !!(startAt && endAt && endAt <= startAt);
  const hasDateChanges =
    startAt?.getTime() !== initialDates.startAt || (endAt?.getTime() ?? null) !== (initialDates.endAt ?? null);
  const hasChanges = mode === "create" ? isDirty || !!startAt : isDirty || hasDateChanges;
  const disabled = !startAt || titleValue.trim().length < 3 || endBeforeStart;

  const handleCancel = () => {
    if (hasChanges) {
      confirmDiscardChanges(() => router.back(), {
        title: "Discard changes?",
        message:
          mode === "create"
            ? "You'll lose everything you've entered."
            : "You'll lose everything you've edited.",
      });
    } else {
      router.back();
    }
  };

  const onSubmit = async (data: EventFormValues) => {
    if (!startAt) return;
    const payload = {
      title: data.title,
      description: data.description || undefined,
      location: data.location || undefined,
      virtualUrl: data.virtualUrl || undefined,
      startAt: startAt.toISOString(),
      endAt: endAt ? endAt.toISOString() : undefined,
      capacity: data.capacity ? Number(data.capacity) : undefined,
    };
    try {
      if (mode === "create") {
        const created = await createEvent({ ...payload, visibility });
        router.replace(`/event-details/${created.id}`);
      } else {
        await updateEvent(payload);
        router.back();
      }
    } catch {
      Alert.alert(
        mode === "create" ? "Couldn't create event" : "Couldn't save changes",
        "Something went wrong. Please try again.",
      );
    }
  };

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
            <View className="flex-row items-center gap-3 px-gutter pb-2 pt-10">
              <PressableScale onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="chevron-back" size={IconSizes.xl} color={theme.iconMuted} />
              </PressableScale>
              <Text className="text-2xl font-bold" style={{ color: theme.title }}>
                {mode === "create" ? "Create event" : "Edit event"}
              </Text>
            </View>

            <View className="gap-stack px-gutter">
              <Controller
                control={control}
                name="title"
                rules={{
                  required: "A title is required",
                  validate: (value) =>
                    value.trim().length < 3 || value.length > EVENT_TITLE_MAX_LENGTH
                      ? `The title should have between 3-${EVENT_TITLE_MAX_LENGTH} characters`
                      : true,
                }}
                render={({ field }) => (
                  <ComposerField
                    label="Title"
                    placeholder="e.g. Career Fair 2026"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.title?.message}
                    maxLength={EVENT_TITLE_MAX_LENGTH}
                    currentLength={field.value.length}
                    autoFocus
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                rules={{
                  validate: (value) =>
                    value.length > EVENT_DESCRIPTION_MAX_LENGTH
                      ? `The description should have less than ${EVENT_DESCRIPTION_MAX_LENGTH} characters`
                      : true,
                }}
                render={({ field }) => (
                  <ComposerField
                    label="Description (optional)"
                    placeholder="What's this event about?"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.description?.message}
                    maxLength={EVENT_DESCRIPTION_MAX_LENGTH}
                    currentLength={field.value.length}
                    multiline
                  />
                )}
              />

              <View className="gap-1.5">
                <Text className="text-xs font-semibold" style={{ color: theme.title }}>
                  Starts
                </Text>
                <PressableScale
                  onPress={() => openPicker("start")}
                  className="flex-row items-center gap-2 rounded-xl px-3.5 py-3"
                  style={{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }}
                >
                  <Ionicons name="calendar-outline" size={IconSizes.sm} color={theme.tabIconColour} />
                  <Text className="flex-1 text-sm" style={{ color: startAt ? theme.title : theme.tabIconColour }}>
                    {startAt ? formatEventDateTimeLabel(startAt) : "Pick a start date"}
                  </Text>
                </PressableScale>
              </View>

              <View className="gap-1.5">
                <Text className="text-xs font-semibold" style={{ color: theme.title }}>
                  Ends (optional)
                </Text>
                <PressableScale
                  onPress={() => openPicker("end")}
                  className="flex-row items-center gap-2 rounded-xl px-3.5 py-3"
                  style={{
                    backgroundColor: theme.uiBackground,
                    borderWidth: 1,
                    borderColor: endBeforeStart ? Colors.warning : theme.borderColor,
                  }}
                >
                  <Ionicons name="calendar-outline" size={IconSizes.sm} color={theme.tabIconColour} />
                  <Text className="flex-1 text-sm" style={{ color: endAt ? theme.title : theme.tabIconColour }}>
                    {endAt ? formatEventDateTimeLabel(endAt) : "Pick an end date"}
                  </Text>
                  {endAt ? (
                    <PressableScale onPress={() => setEndAt(undefined)} hitSlop={8}>
                      <Ionicons name="close-circle" size={IconSizes.md} color={theme.tabIconColour} />
                    </PressableScale>
                  ) : null}
                </PressableScale>
                {endBeforeStart ? (
                  <Text className="text-2xs" style={{ color: Colors.warning }}>
                    End must be after the start.
                  </Text>
                ) : null}
              </View>

              {pickerTarget ? (
                <View
                  className="gap-2 rounded-xl p-3"
                  style={{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }}
                >
                  <DateTimePicker
                    value={(pickerTarget === "start" ? startAt : endAt) ?? new Date()}
                    mode={pickerMode}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={pickerTarget === "end" ? startAt : undefined}
                    onChange={handlePickerChange}
                  />
                  {Platform.OS === "ios" ? (
                    <PressableScale
                      onPress={() =>
                        pickerMode === "date" ? setPickerMode("time") : setPickerTarget(null)
                      }
                      className="items-center rounded-full py-2"
                      style={{ backgroundColor: Colors.primary }}
                    >
                      <Text className="text-xs font-bold" style={{ color: "#ffffff" }}>
                        {pickerMode === "date" ? "Next: pick time" : "Done"}
                      </Text>
                    </PressableScale>
                  ) : null}
                </View>
              ) : null}

              <Controller
                control={control}
                name="location"
                rules={{
                  validate: (value) =>
                    value.length > EVENT_LOCATION_MAX_LENGTH
                      ? `The location should have less than ${EVENT_LOCATION_MAX_LENGTH} characters`
                      : true,
                }}
                render={({ field }) => (
                  <LocationAutocompleteField
                    value={field.value}
                    onChangeText={field.onChange}
                    onSelect={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.location?.message}
                    maxLength={EVENT_LOCATION_MAX_LENGTH}
                    currentLength={field.value.length}
                  />
                )}
              />

              <Controller
                control={control}
                name="virtualUrl"
                render={({ field }) => (
                  <ComposerField
                    label="Virtual link (optional)"
                    placeholder="https://..."
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                )}
              />

              <Controller
                control={control}
                name="capacity"
                rules={{
                  validate: (value) => !value || Number(value) > 0 || "Capacity must be at least 1",
                }}
                render={({ field }) => (
                  <ComposerField
                    label="Capacity (optional)"
                    placeholder="Leave empty for unlimited"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.capacity?.message}
                    keyboardType="number-pad"
                  />
                )}
              />

              {mode === "create" ? (
                <View className="gap-1.5">
                  <Text className="text-xs font-semibold" style={{ color: theme.title }}>
                    Visibility
                  </Text>
                  <View className="flex-row gap-2">
                    {VISIBILITY_OPTIONS.map((option) => (
                      <SelectChip
                        key={option.value}
                        label={option.label}
                        selected={visibility === option.value}
                        onPress={() => setVisibility(option.value)}
                      />
                    ))}
                  </View>
                  <Text className="text-2xs" style={{ color: theme.tabIconColour }}>
                    {visibility === "public"
                      ? "Discoverable and announced in the feed."
                      : "Only visible to people you invite — not posted to the feed."}
                  </Text>
                </View>
              ) : null}
            </View>
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>

      <ComposerSubmitBar
        onCancel={handleCancel}
        onSubmit={handleSubmit(onSubmit)}
        submitLabel={mode === "create" ? "Create" : "Save"}
        disabled={disabled}
        loading={isSaving}
      />
    </ThemedView>
  );
};

export default EventForm;
