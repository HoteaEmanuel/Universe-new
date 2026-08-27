import type { ReactNode } from "react";

type SettingsGroupProps = {
  heading?: string;
  children: ReactNode;
};

const SettingsGroup = ({ heading, children }: SettingsGroupProps) => {
  return (
    <div className="mb-6">
      {heading && (
        <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {heading}
        </h2>
      )}
      <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        {children}
      </div>
    </div>
  );
};

export default SettingsGroup;
