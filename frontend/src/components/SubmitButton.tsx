import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
  className?: string;
};

const SubmitButton = ({
  isLoading,
  loadingText = "Loading...",
  children,
  className = "",
}: SubmitButtonProps) => {
  return (
    <Button
      type="submit"
      disabled={isLoading}
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
