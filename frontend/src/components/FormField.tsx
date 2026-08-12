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
}: FormFieldProps) => {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label htmlFor={id} className="">
          {label}
        </Label>
      )}
      {error && (
        <p className="error" id={errorId}>
          {error}
        </p>
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
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={Icon ? "h-10 pl-8" : "h-10"}
          {...registration}
        />
      </div>
    </div>
  );
};

export default FormField;
