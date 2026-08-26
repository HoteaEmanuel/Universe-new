type StepProgressBarProps = {
  current: number;
  total: number;
  label: string;
};

const StepProgressBar = ({ current, total, label }: StepProgressBarProps) => {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold tabular-nums text-foreground/70">
          Step {current} of {total}
        </span>
        <span className="font-medium text-muted-foreground">{label}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-muted/70 ring-1 ring-black/5 dark:ring-white/5"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-500 shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default StepProgressBar;
