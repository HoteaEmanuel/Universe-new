import { Download } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadImage } from "../utils/downloadImage";

type FullImageModalProps = {
  image: File | string | null;
  open: boolean;
  onClose: () => void;
};

const FullImageModal = ({ image, open, onClose }: FullImageModalProps) => {
  if (!image) return null;
  const isRemoteImage = typeof image === "string";
  const src = image instanceof File ? URL.createObjectURL(image) : image;

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DialogContent className="flex max-w-[95vw] items-center justify-center border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]">
        <DialogTitle className="sr-only">Image preview</DialogTitle>
        <img
          src={src}
          alt="full size"
          className="max-h-[85vh] max-w-full rounded-2xl object-contain"
        />
        {isRemoteImage && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Download image"
                  className="absolute top-2 left-2 shadow-md"
                  onClick={() => downloadImage(image)}
                />
              }
            >
              <Download />
            </TooltipTrigger>
            <TooltipContent>Download image</TooltipContent>
          </Tooltip>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FullImageModal;
