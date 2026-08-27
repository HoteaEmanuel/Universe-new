import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

type SettingsHeaderProps = {
  title: string;
  description?: string;
};

const SettingsHeader = ({ title, description }: SettingsHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
      <Link
        to="/settings"
        aria-label="Back to settings"
        className="icon -ml-1 flex size-9 shrink-0 items-center justify-center"
      >
        <ChevronLeft className="size-5" />
      </Link>
      <div className="min-w-0">
        <h1 className="truncate font-heading text-lg font-semibold">{title}</h1>
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
};

export default SettingsHeader;
