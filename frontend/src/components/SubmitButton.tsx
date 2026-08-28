import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
  className?: string;
  disabled?:boolean
};

const SubmitButton = ({
  isLoading,
  loadingText = "Loading...",
  children,
  className = "",
  disabled,
}: SubmitButtonProps) => {
  return (
    <Button
      type="submit"
      disabled={isLoading || disabled}
      size="lg"
      className={`h-10 w-full ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default SubmitButton;
