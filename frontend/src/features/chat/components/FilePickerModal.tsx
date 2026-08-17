import { useState, type Dispatch, type SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MultipleFilesUploader from "./MultipleFilesUploader";

type FilePickerModalProps = {
  open: boolean;
  onClose: () => void;
  setFiles: Dispatch<SetStateAction<File[]>>;
};

const FilePickerModal = ({ open, onClose, setFiles }: FilePickerModalProps) => {
  const [pending, setPending] = useState<File[]>([]);

  const handleAttach = () => {
    if (pending.length === 0) return;
    setFiles(pending);
    setPending([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) {
          setPending([]);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attach files</DialogTitle>
        </DialogHeader>
        <MultipleFilesUploader files={pending} setFiles={setPending} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAttach} disabled={pending.length === 0}>
            Attach {pending.length > 0 ? `(${pending.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilePickerModal;
