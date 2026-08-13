import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type FullImageModalProps = {
  image: File | string | null;
  open: boolean;
  onClose: () => void;
};

const FullImageModal = ({ image, open, onClose }: FullImageModalProps) => {
  if (!image) return null;
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
      </DialogContent>
    </Dialog>
  );
};

export default FullImageModal;
