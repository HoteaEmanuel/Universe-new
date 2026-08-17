import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "../utils/formatFileSize";
import { getFileTypeIcon } from "../utils/fileTypeIcon";
import { ALLOWED_FILE_ACCEPT, MAX_FILES, MAX_FILE_SIZE } from "../utils/fileConstraints";

type MultipleFilesUploaderProps = {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
};

const MultipleFilesUploader = ({ files, setFiles }: MultipleFilesUploaderProps) => {
  const count = files.length;
  const atLimit = count >= MAX_FILES;

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (count + acceptedFiles.length > MAX_FILES) {
        toast.error(`You can only attach up to ${MAX_FILES} files`);
        return;
      }
      fileRejections.forEach(({ file, errors }) => {
        if (errors.some((e) => e.code === "file-too-large")) {
          toast.error(`${file.name} is larger than 10MB`);
        } else if (errors.some((e) => e.code === "file-invalid-type")) {
          toast.error(`${file.name} is not a supported file type`);
        }
      });
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
    [setFiles, count],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: atLimit,
    accept: ALLOWED_FILE_ACCEPT,
    maxSize: MAX_FILE_SIZE,
  });

  const handleRemove = (file: File) => {
    setFiles((prev) => prev.filter((f) => f !== file));
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps({
          className: cn(
            "flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-input p-6 text-center transition-colors",
            atLimit
              ? "cursor-not-allowed bg-muted/30 opacity-60"
              : "cursor-pointer bg-muted/20 hover:bg-muted/30",
            isDragActive && !atLimit && "border-primary bg-primary/5",
          ),
        })}
      >
        <Paperclip className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          {atLimit ? "File limit reached" : "Drag files here"}
        </p>
        <input {...getInputProps()} />
        <p className="text-xs text-muted-foreground">
          {atLimit
            ? `Remove a file to add more (${count}/${MAX_FILES})`
            : "PDF, Word, or Excel — up to 10MB each"}
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-2" disabled={atLimit}>
          Select from computer
        </Button>
        <span className="mt-1 text-xs text-muted-foreground">
          {count}/{MAX_FILES}
        </span>
      </div>

      {count > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file, index) => {
            const Icon = getFileTypeIcon(file.type);
            return (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2"
              >
                <Icon className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(file)}
                  aria-label={`Remove ${file.name}`}
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MultipleFilesUploader;
