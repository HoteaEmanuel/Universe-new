import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { downloadFile } from "../utils/downloadFile";
import { formatFileSize } from "../features/chat/utils/formatFileSize";
import { getFileTypeIcon } from "../features/chat/utils/fileTypeIcon";
import type { MessageAttachment } from "../features/chat/types";

type FilePreviewModalProps = {
  attachments: MessageAttachment[];
  open: boolean;
  initialIndex?: number;
  onClose: () => void;
};

const FilePreviewModal = ({
  attachments,
  open,
  initialIndex = 0,
  onClose,
}: FilePreviewModalProps) => {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  if (!open || attachments.length === 0) return null;

  const attachment = attachments[index];
  const isPdf = attachment.mimeType === "application/pdf";
  const Icon = getFileTypeIcon(attachment.mimeType);

  const handlePrevious = () => {
    setIndex((prev) => (prev - 1 < 0 ? attachments.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1 >= attachments.length ? 0 : prev + 1));
  };

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DialogContent className="flex h-[94vh] max-h-[94vh] w-[95vw] max-w-[95vw] flex-col gap-3 sm:max-w-5xl">
        <DialogTitle className="truncate pr-6">{attachment.fileName}</DialogTitle>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-muted/30">
          {isPdf ? (
            <iframe
              src={attachment.fileUrl}
              title={attachment.fileName}
              className="h-full w-full rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Icon className="size-16 text-muted-foreground" />
              <p className="font-medium">{attachment.fileName}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(attachment.fileSize)}
              </p>
              <p className="text-xs text-muted-foreground">
                Preview isn't available for this file type
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => downloadFile(attachment.fileUrl, attachment.fileName)}
          >
            <Download /> Download
          </Button>
          {attachments.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Previous file"
                onClick={handlePrevious}
              >
                <ChevronLeft />
              </Button>
              <span className="text-xs text-muted-foreground">
                {index + 1} / {attachments.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Next file"
                onClick={handleNext}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
