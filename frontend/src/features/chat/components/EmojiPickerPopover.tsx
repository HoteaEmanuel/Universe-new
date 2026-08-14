import { useState, type ReactElement } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const getEmojiPickerTheme = () =>
  document.documentElement.getAttribute("data-theme") === "dark"
    ? Theme.DARK
    : Theme.LIGHT;

type EmojiPickerPopoverProps = {
  trigger: ReactElement;
  onPick: (emoji: string) => void;
  align?: "start" | "center" | "end";
};

const EmojiPickerPopover = ({
  trigger,
  onPick,
  align = "end",
}: EmojiPickerPopoverProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align={align} className="w-auto border-none p-0 shadow-lg">
        <EmojiPicker
          onEmojiClick={(data: EmojiClickData) => {
            onPick(data.emoji);
            setOpen(false);
          }}
          theme={getEmojiPickerTheme()}
          lazyLoadEmojis
          skinTonesDisabled
          previewConfig={{ showPreview: false }}
        />
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPickerPopover;
