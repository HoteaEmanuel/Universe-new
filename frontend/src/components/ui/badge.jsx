import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        muted: "bg-muted text-muted-foreground hover:text-foreground",
        outline: "border border-border text-foreground",
        brand: "bg-primary/10 text-primary dark:bg-brand-400/15 dark:text-brand-100",
        info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        destructive: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className = "", variant = "default", ...props }) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props} />
  );
}

export { Badge, badgeVariants }
