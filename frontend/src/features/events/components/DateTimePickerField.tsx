import type { ChangeEvent } from "react";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DateTimePickerFieldProps = {
  id: string;
  label: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  error?: string;
  minDate?: Date;
  placeholder?: string;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const DateTimePickerField = ({
  id,
  label,
  value,
  onChange,
  error,
  minDate,
  placeholder = "Pick a date",
}: DateTimePickerFieldProps) => {
  const [open, setOpen] = useState(false);
  const errorId = error ? `${id}-error` : undefined;

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    const next = new Date(date);
    if (value) {
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    } else {
      next.setHours(9, 0, 0, 0);
    }
    onChange(next);
    setOpen(false);
  };

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes, seconds] = e.target.value.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return;
    const base = value ? new Date(value) : new Date();
    base.setHours(hours, minutes, seconds || 0, 0);
    onChange(base);
  };

  const timeId = `${id}-time`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="">
        {label}
      </Label>
      {error && (
        <p className="error" id={errorId}>
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            id={id}
            aria-invalid={!!error}
            aria-describedby={errorId}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 w-full justify-start gap-2 font-normal sm:flex-1",
            )}
          >
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            {value ? format(value, "PPP") : placeholder}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              defaultMonth={value ?? minDate}
              onSelect={handleSelectDate}
              disabled={minDate ? { before: startOfDay(minDate) } : undefined}
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          id={timeId}
          aria-label={`${label} time`}
          step="1"
          value={value ? format(value, "HH:mm:ss") : ""}
          onChange={handleTimeChange}
          disabled={!value}
          className="h-10 w-full appearance-none bg-background sm:w-36 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
};

export default DateTimePickerField;
