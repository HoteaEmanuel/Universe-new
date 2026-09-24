import { useState } from "react";
import { View, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import type { OpportunityType, WorkplaceType } from "@universe/shared";
import ComposerField from "@components/post/ComposerField";
import SelectChip from "@components/SelectChip";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { COMPANY_NAME_MAX_LENGTH } from "@constants/postForm";
import { OPPORTUNITY_TYPES, WORKPLACE_TYPES } from "@constants/opportunityLabels";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { formatOpportunityDeadlineDateTime, isValidApplyUrl } from "@utils/opportunity";
import type { CreatePostFormValues } from "@/types/createPost";

type OpportunityFieldsProps = {
  control: Control<CreatePostFormValues>;
  errors: FieldErrors<CreatePostFormValues>;
  opportunityType?: OpportunityType;
  onOpportunityTypeChange: (value: OpportunityType) => void;
  workplaceType?: WorkplaceType;
  onWorkplaceTypeChange: (value: WorkplaceType) => void;
  deadline?: Date;
  onDeadlineChange: (date: Date | undefined) => void;
};

type PickerMode = "date" | "time" | null;


const OpportunityFields = ({
  control,
  errors,
  opportunityType,
  onOpportunityTypeChange,
  workplaceType,
  onWorkplaceTypeChange,
  deadline,
  onDeadlineChange,
}: OpportunityFieldsProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);

  // Android's default display is a self-dismissing dialog per mode, so a
  // valid selection auto-advances date -> time -> closed. iOS's spinner
  // renders inline and fires onChange continuously while scrolling, so
  // there the "Next"/"Done" button below drives the mode transition instead.
  const handleChange = (_event: unknown, selectedDate?: Date) => {
    if (!selectedDate) {
      if (Platform.OS === "android") setPickerMode(null);
      return;
    }
    if (pickerMode === "date") {
      const next = new Date(selectedDate);
      if (deadline) next.setHours(deadline.getHours(), deadline.getMinutes(), 0, 0);
      else next.setHours(9, 0, 0, 0);
      onDeadlineChange(next);
      if (Platform.OS === "android") setPickerMode("time");
    } else {
      const base = deadline ? new Date(deadline) : new Date();
      base.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      onDeadlineChange(base);
      if (Platform.OS === "android") setPickerMode(null);
    }
  };

  return (
    <View
      className="gap-4 rounded-xl p-3.5"
      style={{ borderWidth: 1, borderColor: theme.borderColor, backgroundColor: theme.uiBackground }}
    >
      <View className="flex-row items-center gap-2">
        <Ionicons name="briefcase-outline" size={IconSizes.md} color={Colors.primary} />
        <Text className="text-sm font-semibold" style={{ color: theme.title }}>
          Opportunity details
        </Text>
      </View>

      <View className="gap-1.5">
        <Text className="text-xs font-semibold" style={{ color: theme.title }}>
          Opportunity type
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {OPPORTUNITY_TYPES.map((option) => (
            <SelectChip
              key={option.value}
              label={option.label}
              selected={opportunityType === option.value}
              onPress={() => onOpportunityTypeChange(option.value)}
            />
          ))}
        </View>
      </View>

      <View className="gap-1.5">
        <Text className="text-xs font-semibold" style={{ color: theme.title }}>
          Workplace
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {WORKPLACE_TYPES.map((option) => (
            <SelectChip
              key={option.value}
              label={option.label}
              selected={workplaceType === option.value}
              onPress={() => onWorkplaceTypeChange(option.value)}
            />
          ))}
        </View>
      </View>

      <Controller
        control={control}
        name="companyName"
        rules={{
          validate: (value) => (value.trim().length >= 2 ? true : "Enter the company name"),
        }}
        render={({ field }) => (
          <ComposerField
            label="Company name"
            placeholder="e.g. Acme Corp"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.companyName?.message}
            maxLength={COMPANY_NAME_MAX_LENGTH}
            currentLength={field.value.length}
          />
        )}
      />

      <Controller
        control={control}
        name="applyUrl"
        rules={{
          validate: (value) => (isValidApplyUrl(value) ? true : "Add a valid https:// application link"),
        }}
        render={({ field }) => (
          <ComposerField
            label="Application link"
            placeholder="https://company.com/careers/apply"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.applyUrl?.message}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        )}
      />

      <View className="gap-1.5">
        <Text className="text-xs font-semibold" style={{ color: theme.title }}>
          Deadline (optional)
        </Text>
        <PressableScale
          onPress={() => setPickerMode("date")}
          className="flex-row items-center gap-2 rounded-xl px-3.5 py-3"
          style={{ backgroundColor: theme.background, borderWidth: 1, borderColor: theme.borderColor }}
        >
          <Ionicons name="calendar-outline" size={IconSizes.sm} color={theme.tabIconColour} />
          <Text className="flex-1 text-sm" style={{ color: deadline ? theme.title : theme.tabIconColour }}>
            {deadline ? formatOpportunityDeadlineDateTime(deadline) : "Pick a deadline"}
          </Text>
          {deadline ? (
            <PressableScale onPress={() => onDeadlineChange(undefined)} hitSlop={8}>
              <Ionicons name="close-circle" size={IconSizes.md} color={theme.tabIconColour} />
            </PressableScale>
          ) : null}
        </PressableScale>

        {pickerMode ? (
          <View
            className="mt-1 gap-2 rounded-xl p-3"
            style={{ backgroundColor: theme.background, borderWidth: 1, borderColor: theme.borderColor }}
          >
            <DateTimePicker
              value={deadline ?? new Date()}
              mode={pickerMode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={handleChange}
            />
            {Platform.OS === "ios" ? (
              <PressableScale
                onPress={() => setPickerMode(pickerMode === "date" ? "time" : null)}
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
      </View>
    </View>
  );
};

export default OpportunityFields;
