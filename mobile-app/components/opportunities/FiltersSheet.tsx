import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View, Text, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { OpportunityType, WorkplaceType } from "@universe/shared";
import { Colors } from "@constants/colors";
import { OPPORTUNITY_TYPES, WORKPLACE_TYPES } from "@constants/opportunityLabels";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import ThemedBottomSheet from "@components/BottomSheet";
import SelectChip from "@components/SelectChip";

export type OpportunityStatus = "active" | "expired" | "all";
export type OpportunitySort = "newest" | "deadline";

export type OpportunitiesFilterState = {
  opportunityType?: OpportunityType;
  workplaceType?: WorkplaceType;
  status: OpportunityStatus;
  sort: OpportunitySort;
  savedOnly: boolean;
};

export const DEFAULT_OPPORTUNITIES_FILTERS: OpportunitiesFilterState = {
  opportunityType: undefined,
  workplaceType: undefined,
  status: "active",
  sort: "newest",
  savedOnly: false,
};

export type FiltersSheetHandle = { present: () => void; dismiss: () => void };

type FiltersSheetProps = {
  filters: OpportunitiesFilterState;
  onApply: (next: OpportunitiesFilterState) => void;
};

const STATUS_OPTIONS: { value: OpportunityStatus; label: string }[] = [
  { value: "active", label: "Open" },
  { value: "expired", label: "Closed" },
  { value: "all", label: "All statuses" },
];

const SORT_OPTIONS: { value: OpportunitySort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "deadline", label: "Deadline soon" },
];

const FilterSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  return (
    <View className="gap-2.5 px-5 pt-5">
      <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.tabIconColour }}>
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
};

const FiltersSheet = forwardRef<FiltersSheetHandle, FiltersSheetProps>(
  ({ filters, onApply }, ref) => {
    const colorScheme = useAppColorScheme();
    const theme = colorScheme === "light" ? Colors.light : Colors.dark;
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetModal>(null);
    const [draft, setDraft] = useState<OpportunitiesFilterState>(filters);

    useImperativeHandle(ref, () => ({
      present: () => {
        setDraft(filters);
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleApply = () => {
      onApply(draft);
      sheetRef.current?.dismiss();
    };

    const handleReset = () => setDraft(DEFAULT_OPPORTUNITIES_FILTERS);

    return (
      <ThemedBottomSheet ref={sheetRef}>
        <View className="flex-row items-center justify-between px-5 pb-1">
          <Text className="text-lg font-bold" style={{ color: theme.title }}>
            Filters
          </Text>
          <PressableScale onPress={handleReset} hitSlop={8}>
            <Text className="text-sm font-semibold" style={{ color: theme.tabIconColour }}>
              Reset
            </Text>
          </PressableScale>
        </View>

        <FilterSection title="Opportunity type">
          <SelectChip
            label="All opportunities"
            selected={!draft.opportunityType}
            onPress={() => setDraft((d) => ({ ...d, opportunityType: undefined }))}
          />
          {OPPORTUNITY_TYPES.map((option) => (
            <SelectChip
              key={option.value}
              label={option.label}
              selected={draft.opportunityType === option.value}
              onPress={() => setDraft((d) => ({ ...d, opportunityType: option.value }))}
            />
          ))}
        </FilterSection>

        <FilterSection title="Workplace">
          <SelectChip
            label="Any workplace"
            selected={!draft.workplaceType}
            onPress={() => setDraft((d) => ({ ...d, workplaceType: undefined }))}
          />
          {WORKPLACE_TYPES.map((option) => (
            <SelectChip
              key={option.value}
              label={option.label}
              selected={draft.workplaceType === option.value}
              onPress={() => setDraft((d) => ({ ...d, workplaceType: option.value }))}
            />
          ))}
        </FilterSection>

        <FilterSection title="Status">
          {STATUS_OPTIONS.map((option) => (
            <SelectChip
              key={option.value}
              label={option.label}
              selected={draft.status === option.value}
              onPress={() => setDraft((d) => ({ ...d, status: option.value }))}
            />
          ))}
        </FilterSection>

        <FilterSection title="Sort">
          {SORT_OPTIONS.map((option) => (
            <SelectChip
              key={option.value}
              label={option.label}
              selected={draft.sort === option.value}
              onPress={() => setDraft((d) => ({ ...d, sort: option.value }))}
            />
          ))}
        </FilterSection>

        <View
          className="mx-5 mt-5 flex-row items-center justify-between rounded-2xl px-4 py-3.5"
          style={{ backgroundColor: theme.background, borderWidth: 1, borderColor: theme.borderColor }}
        >
          <Text className="text-sm font-semibold" style={{ color: theme.title }}>
            Saved only
          </Text>
          <Switch
            value={draft.savedOnly}
            onValueChange={(value) => setDraft((d) => ({ ...d, savedOnly: value }))}
            trackColor={{ false: theme.borderColor, true: Colors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <View className="flex-row gap-3 px-5 pt-6" style={{ paddingBottom: insets.bottom + 16 }}>
          <PressableScale onPress={handleApply} className="flex-1 items-center rounded-full py-3.5" style={{ backgroundColor: Colors.primary }}>
            <Text className="text-sm font-bold" style={{ color: "#ffffff" }}>
              Apply filters
            </Text>
          </PressableScale>
        </View>
      </ThemedBottomSheet>
    );
  },
);

FiltersSheet.displayName = "FiltersSheet";

export default FiltersSheet;
