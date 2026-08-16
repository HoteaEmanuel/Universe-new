import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { downloadImage } from "../utils/downloadImage";

type ImageGalleryModalProps = {
  images: string[];
  open: boolean;
  initialIndex?: number;
  onClose: () => void;
};

const ImageGalleryModal = ({
  images,
  open,
  initialIndex = 0,
  onClose,
}: ImageGalleryModalProps) => {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  if (!open || images.length === 0) return null;

  const handlePrevious = () => {
    setIndex((prev) => (prev - 1 < 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1 >= images.length ? 0 : prev + 1));
  };

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DialogContent className="flex max-w-[95vw] items-center justify-center border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]">
        <DialogTitle className="sr-only">Image gallery</DialogTitle>
        <div className="relative flex items-center justify-center">
          <img
            src={images[index]}
            alt={`attachment ${index + 1} of ${images.length}`}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain select-none"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Download image"
            className="absolute top-2 left-2 shadow-md"
            onClick={() => downloadImage(images[index])}
          >
            <Download />
          </Button>
          {images.length > 1 && (
            <>
              <div className="glass-effect absolute top-2 right-2 px-2 py-1 text-xs text-white">
                {index + 1} / {images.length}
              </div>
              <ChevronLeft
                className="glass-effect absolute top-1/2 left-2 size-7 -translate-y-1/2 cursor-pointer text-white transition-opacity hover:opacity-80"
                onClick={handlePrevious}
              />
              <ChevronRight
                className="glass-effect absolute top-1/2 right-2 size-7 -translate-y-1/2 cursor-pointer text-white transition-opacity hover:opacity-80"
                onClick={handleNext}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageGalleryModal;
