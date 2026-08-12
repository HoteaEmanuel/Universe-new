import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PasswordFieldProps = {
  id: string;
  label?: string;
  error?: string;
  registration: UseFormRegisterReturn;
  placeholder?: string;
  autoComplete?: string;
};

const PasswordField = ({
  id,
  label,
  error,
  registration,
  placeholder = "Password",
  autoComplete = "current-password",
}: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);
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
        <Lock className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className="h-10 pl-8 pr-10"
          {...registration}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
    </div>
  );
};

export default PasswordField;
