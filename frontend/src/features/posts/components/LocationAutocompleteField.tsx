import { useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { FiLoader, FiMapPin, FiNavigation } from "react-icons/fi";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/Debounce";
import {
  useSearchLocationsQuery,
  reverseGeocodeLocation,
} from "@/queryAndMutation/queries/location-queries";

type LocationAutocompleteFieldProps = {
  id: string;
  label?: string;
  value: string;
  onSelect: (value: string) => void;
  registration: UseFormRegisterReturn;
  error?: string;
  maxLength?: number;
  currentLength?: number;
};

const LocationAutocompleteField = ({
  id,
  label,
  value,
  onSelect,
  registration,
  error,
  maxLength,
  currentLength = 0,
}: LocationAutocompleteFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const debouncedValue = useDebounce(value, 500);
  const { data: results, isFetching } = useSearchLocationsQuery(debouncedValue);
  const showDropdown =
    isFocused &&
    debouncedValue.trim().length > 2 &&
    (isFetching || (results?.length ?? 0) > 0);

  const errorId = error ? `${id}-error` : undefined;
  const isMaxed = maxLength !== undefined && currentLength >= maxLength;

  const handleSelect = (label: string) => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    onSelect(label);
    setIsFocused(false);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support geolocation");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const label = await reverseGeocodeLocation(
            position.coords.latitude,
            position.coords.longitude,
          );
          if (label) {
            onSelect(label);
          } else {
            toast.error("Couldn't find an address for your location");
          }
        } catch {
          toast.error("Couldn't look up your location");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied"
            : "Couldn't get your location",
        );
        setIsLocating(false);
      },
      { timeout: 10000 },
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      {(label || maxLength !== undefined) && (
        <div className="flex items-center justify-between">
          {label && (
            <Label htmlFor={id} className="">
              {label}
            </Label>
          )}
          {maxLength !== undefined && (
            <span
              className={`text-xs ${isMaxed ? "text-destructive" : "text-muted-foreground"}`}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}
      {error && (
        <p className="error" id={errorId}>
          {error}
        </p>
      )}
      {!error && isMaxed && (
        <p className="text-xs text-destructive">Character limit reached</p>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiMapPin className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            type="text"
            autoComplete="off"
            placeholder="e.g. New York, London"
            maxLength={maxLength}
            aria-invalid={!!error || isMaxed}
            aria-describedby={errorId}
            className="h-10 pl-8"
            {...registration}
            onFocus={() => setIsFocused(true)}
            onBlur={(e: FocusEvent<HTMLInputElement>) => {
              registration.onBlur(e);
              blurTimeout.current = setTimeout(() => setIsFocused(false), 150);
            }}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Escape") setIsFocused(false);
              if (e.key === "Enter") {
               
                e.preventDefault();
                if (results && results.length > 0) handleSelect(results[0].label);
              }
            }}
          />
          {showDropdown && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-input bg-popover shadow-md">
              {isFetching && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  Searching…
                </li>
              )}
              {!isFetching &&
                results?.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(result.label);
                      }}
                    >
                      {result.label}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                disabled={isLocating}
                onClick={handleUseMyLocation}
                aria-label="Use my current location"
              />
            }
          >
            {isLocating ? (
              <FiLoader className="animate-spin" />
            ) : (
              <FiNavigation />
            )}
          </TooltipTrigger>
          <TooltipContent>Use my current location</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default LocationAutocompleteField;
