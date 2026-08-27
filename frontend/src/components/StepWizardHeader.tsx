import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Back"
              onClick={onBack}
              className="shrink-0"
            />
          }
        >
          <ChevronLeft className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Back</TooltipContent>
      </Tooltip>
    )}
    <div className="flex-1">
      <StepProgressBar current={current} total={total} label={label} />
    </div>
  </div>
);

export default StepWizardHeader;
