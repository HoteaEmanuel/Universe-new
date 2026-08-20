import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotFoundStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  compact?: boolean;
};

const NotFoundState = ({
  icon: Icon,
  title,
  description,
  compact = false,
}: NotFoundStateProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-6 bg-background px-6 text-center",
        compact ? "h-full py-10" : "min-h-[60vh] py-20",
      )}
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-brand-400/15 dark:text-brand-100">
        <Icon className="size-8" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Link
        to="/home"
        className={cn(buttonVariants({ size: "lg" }), "h-11 px-8 text-base")}
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFoundState;
