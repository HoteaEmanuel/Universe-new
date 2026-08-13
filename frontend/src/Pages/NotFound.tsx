import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NotFound = () => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-background px-6 py-10 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-10" />
      </span>
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
          Page Not Found
        </h1>
        <p className="text-lg text-muted-foreground">
          You navigated too far :) - this page doesn&apos;t exist
        </p>
      </div>
      <Link
        to="/"
        className={cn(buttonVariants({ size: "lg" }), "h-11 px-8 text-base")}
      >
        Go back to Home
      </Link>
    </div>
  );
};

export default NotFound;
