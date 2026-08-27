import type { ComponentType, ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type SettingsRowProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  trailing?: ReactNode;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
};

const SettingsRow = ({
  icon: Icon,
  label,
  description,
  trailing,
  to,
  onClick,
  danger = false,
  disabled = false,
}: SettingsRowProps) => {
  const navigable = !!to || !!onClick;

  const content = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          danger ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className={cn("block truncate text-sm font-medium", danger && "text-destructive")}>
          {label}
        </span>
        {description && (
          <span className="block truncate text-xs text-muted-foreground">{description}</span>
        )}
      </span>
      {trailing && (
        <span className="shrink-0 text-sm text-muted-foreground">{trailing}</span>
      )}
      {to && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
    </>
  );

  const rowClass = cn(
    "flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors",
    navigable && !disabled && "hoverGray cursor-pointer",
    disabled && "pointer-events-none opacity-50",
  );

  if (to) {
    return (
      <Link to={to} className={rowClass}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={rowClass}>
        {content}
      </button>
    );
  }

  return <div className={rowClass}>{content}</div>;
};

export default SettingsRow;
