import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SubmitButton = ({ isLoading, loadingText = "Loading...", children, className = "" }) => {
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
