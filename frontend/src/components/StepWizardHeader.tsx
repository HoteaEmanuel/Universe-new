import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import StepProgressBar from "@/components/StepProgressBar";

type StepWizardHeaderProps = {
  current: number;
  total: number;
  label: string;
  onBack?: () => void;
};

const StepWizardHeader = ({ current, total, label, onBack }: StepWizardHeaderProps) => (
  <div className="flex items-center gap-2">
    {current > 1 && onBack && (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Back"
        onClick={onBack}
        className="shrink-0"
      >
        <ChevronLeft className="size-4" />
      </Button>
    )}
    <div className="flex-1">
      <StepProgressBar current={current} total={total} label={label} />
    </div>
  </div>
);

export default StepWizardHeader;
