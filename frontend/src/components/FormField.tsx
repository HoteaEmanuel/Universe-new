import type { UseFormRegisterReturn } from "react-hook-form";
import type { IconType } from "react-icons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type FormFieldProps = {
  id: string;
  label?: string;
  icon?: IconType;
  error?: string;
  registration: UseFormRegisterReturn;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  currentLength?: number;
  disabled?: boolean;
};

const FormField = ({
  id,
  label,
  icon: Icon,
  error,
  registration,
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  currentLength = 0,
  disabled = false,
}: FormFieldProps) => {
  const errorId = error ? `${id}-error` : undefined;
  const isMaxed = maxLength !== undefined && currentLength >= maxLength;
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
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={!!error || isMaxed}
          aria-describedby={errorId}
          className={Icon ? "h-10 pl-8" : "h-10"}
          {...registration}
        />
      </div>
    </div>
  );
};

export default FormField;
