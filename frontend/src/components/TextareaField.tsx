import type { ChangeEvent, MouseEvent, KeyboardEvent, RefObject } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TextareaFieldProps = {
  id: string;
  label?: string;
  error?: string;
  registration: UseFormRegisterReturn;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  currentLength?: number;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyUp?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onClick?: (e: MouseEvent<HTMLTextAreaElement>) => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
};

const TextareaField = ({
  id,
  label,
  error,
  registration,
  placeholder,
  rows = 6,
  maxLength,
  currentLength = 0,
  onChange,
  onKeyUp,
  onClick,
  inputRef,
}: TextareaFieldProps) => {
  const errorId = error ? `${id}-error` : undefined;
  const isMaxed = maxLength !== undefined && currentLength >= maxLength;
  return (
    <div className="flex flex-col gap-1.5">
      {(label || maxLength !== undefined) && (
        <div className="flex items-center justify-between">
          {label && <Label htmlFor={id} className="">{label}</Label>}
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
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={!!error || isMaxed}
        aria-describedby={errorId}
        className="resize-none"
        {...registration}
        ref={(element: HTMLTextAreaElement | null) => {
          registration.ref(element);
          if (inputRef) inputRef.current = element;
        }}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          registration.onChange(e);
          onChange?.(e);
        }}
        onKeyUp={onKeyUp}
        onClick={onClick}
      />
    </div>
  );
};

export default TextareaField;
