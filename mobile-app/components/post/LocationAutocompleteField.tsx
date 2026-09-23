import { useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { Colors } from "@constants/colors";
import { PressableScale } from "@lib/styled";
import { useDebounce } from "@hooks/useDebounce";
import { useSearchLocationsQuery } from "@queryAndMutation/queries/location-queries";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type LocationAutocompleteFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSelect: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  maxLength?: number;
  currentLength?: number;
};

// Mobile port of frontend/src/features/posts/components/LocationAutocompleteField.tsx.
// Renders suggestions inline below the input (pushing the rest of the
// expanding section down) instead of an absolutely-positioned floating
// dropdown — RN's overflow/z-index handling across a scroll view is a lot
// more fragile than the web's, and this section's content already sits in
// its own bordered card with nothing below it to overlap.
const LocationAutocompleteField = ({
  value,
  onChangeText,
  onSelect,
  onBlur,
  error,
  maxLength,
  currentLength,
}: LocationAutocompleteFieldProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const [isFocused, setIsFocused] = useState(false);

  const debouncedValue = useDebounce(value, 500);
  const { data: results, isFetching } = useSearchLocationsQuery(debouncedValue);
  const showDropdown =
    isFocused && debouncedValue.trim().length > 2 && (isFetching || (results?.length ?? 0) > 0);

  const handleSelect = (label: string) => {
    onSelect(label);
    setIsFocused(false);
  };

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold" style={{ color: theme.title }}>
          Location
        </Text>
        {maxLength ? (
          <Text className="text-2xs" style={{ color: theme.tabIconColour }}>
            {currentLength ?? 0}/{maxLength}
          </Text>
        ) : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          onBlur?.();
          // Same reason as the web version's setTimeout: give a suggestion
          // tap a chance to register before the dropdown unmounts on blur.
          setTimeout(() => setIsFocused(false), 150);
        }}
        placeholder="Add a location"
        placeholderTextColor={theme.tabIconColour}
        maxLength={maxLength}
        autoCorrect={false}
        className="rounded-xl px-3.5 text-sm"
        style={{
          backgroundColor: theme.uiBackground,
          borderWidth: 1,
          borderColor: error ? Colors.warning : theme.borderColor,
          color: theme.title,
          minHeight: 48,
        }}
      />
      {error ? (
        <Text className="text-2xs" style={{ color: Colors.warning }}>
          {error}
        </Text>
      ) : null}
      {showDropdown ? (
        <View
          className="overflow-hidden rounded-xl"
          style={{ borderWidth: 1, borderColor: theme.borderColor }}
        >
          {isFetching ? (
            <View className="flex-row items-center gap-2 px-3.5 py-3">
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text className="text-xs" style={{ color: theme.tabIconColour }}>
                Searching...
              </Text>
            </View>
          ) : (
            results?.map((result, index) => (
              <PressableScale
                key={result.id}
                onPress={() => handleSelect(result.label)}
                className="px-3.5 py-3"
                style={{
                  backgroundColor: theme.uiBackground,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: theme.borderColor,
                }}
              >
                <Text className="text-sm" style={{ color: theme.title }}>
                  {result.label}
                </Text>
              </PressableScale>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
};

export default LocationAutocompleteField;
