import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ErrorBanner = ({ children, id }) => {
  if (!children) return null;
  return (
    <Alert
      variant="destructive"
      id={id}
      className="animate-fade-in-up border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
    >
      <AlertCircle className="text-red-600 dark:text-red-400" />
      <AlertDescription className="text-red-700 dark:text-red-300">
        {children}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorBanner;
