import { formatFileSize } from "../utils/formatFileSize";
import { getFileTypeIcon } from "../utils/fileTypeIcon";
import type { MessageAttachment } from "../types";

type MessageFileListProps = {
  attachments: MessageAttachment[];
  isOwn: boolean;
  onOpen: (index: number) => void;
};

const MessageFileList = ({ attachments, isOwn, onOpen }: MessageFileListProps) => {
  if (attachments.length === 0) return null;

  return (
    <ul className="flex w-64 flex-col gap-1">
      {attachments.map((attachment, index) => {
        const Icon = getFileTypeIcon(attachment.mimeType);
        return (
          <li key={attachment.id}>
            <button
              type="button"
              onClick={() => onOpen(index)}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-2xl px-3 py-2 text-left ${
                isOwn
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <Icon className="size-6 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{attachment.fileName}</p>
                <p
                  className={`text-xs ${
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {formatFileSize(attachment.fileSize)}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default MessageFileList;
