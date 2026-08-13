import { useState, type Dispatch, type SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MultipleImagesUploader from "../components/MultipleImagesUploader";

type ImagePickerModalProps = {
  open: boolean;
  onClose: () => void;
  setImages: Dispatch<SetStateAction<File[]>>;
};

const ImagePickerModal = ({ open, onClose, setImages }: ImagePickerModalProps) => {
  const [files, setFiles] = useState<File[]>([]);

  const handleAttach = () => {
    if (files.length === 0) return;
    setImages(files);
    setFiles([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) {
          setFiles([]);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attach images</DialogTitle>
        </DialogHeader>
        <MultipleImagesUploader setFiles={setFiles} files={files} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAttach} disabled={files.length === 0}>
            Attach {files.length > 0 ? `(${files.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePickerModal;
