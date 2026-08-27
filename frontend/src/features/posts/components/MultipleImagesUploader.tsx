import {
  useCallback,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FullImageModal from "@/Modals/FullImageModal";

type FileItem = File | string;

type MultipleImagesUploaderProps<T extends FileItem> = {
  setFiles: Dispatch<SetStateAction<T[]>>;
  files: T[];
  classes?: string;
  children?: ReactNode;
  maxImages?: number;
};

function MultipleImagesUploader<T extends FileItem>({
  setFiles,
  files,
  classes = "",
  children = null,
  maxImages = 10,
}: MultipleImagesUploaderProps<T>) {
  const count = files?.length ?? 0;
  const atLimit = count >= maxImages;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const droppedFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      );

      if (count + droppedFiles.length > maxImages) {
        toast.error(`You can only upload up to ${maxImages} images`);
        return;
      }
      setFiles((prev) => [...prev, ...droppedFiles] as T[]);
    },
    [setFiles, count, maxImages],
  );

  const [fullImage, setFullImage] = useState<FileItem | null>(null);
  const [openFullImageModal, setOpenFullImageModal] = useState(false);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: atLimit,
    // react-dropzone auto-focuses its root element on mount unless this is
    // set, which steals focus inside dialogs (e.g. a multi-step modal) and
    // can trip the dialog's focus-trap into treating it as an outside
    // interaction and closing. We already expose a "Select from computer"
    // button, so the root div doesn't need its own keyboard handling.
    noKeyboard: true,
    accept: {
      "image/*": [".png", ".jpeg", ".jpg", ".svg"],
    },
  });

  const handleRemoveImage = (image: T) => {
    setFiles((prev) => prev.filter((file) => file !== image));
  };

  return (
    <div className={cn("flex flex-col gap-3", classes)}>
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
        <ImagePlus className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          {atLimit ? "Image limit reached" : "Drag images here"}
        </p>
        <input type="file" {...getInputProps()} />
        <p className="text-xs text-muted-foreground">
          {atLimit
            ? `Remove an image to add more (${count}/${maxImages})`
            : "JPG, PNG or SVG"}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={atLimit}
        >
          Select from computer
        </Button>
        <span className="mt-1 text-xs text-muted-foreground">
          {count}/{maxImages}
        </span>
      </div>

      {count > 0 && (
        <ul className="flex flex-wrap justify-center gap-3">
          {files.map((file) => {
            const preview =
              typeof file !== "string" ? URL.createObjectURL(file) : file;
            const key = typeof file === "string" ? file : file.name;
            return (
              <li key={key}>
                <div className="relative">
                  <button
                    type="button"
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-background text-muted-foreground shadow ring-1 ring-border hover:text-destructive"
                    onClick={() => handleRemoveImage(file)}
                  >
                    <X className="size-4" />
                  </button>
                  <img
                    src={preview}
                    alt="selected upload"
                    className="size-24 rounded-xl object-cover md:size-32"
                    onClick={() => {
                      setFullImage(file);
                      setOpenFullImageModal(true);
                    }}
                  />
                </div>
              </li>
            );
          })}
          <FullImageModal
            image={fullImage}
            open={openFullImageModal}
            onClose={() => setOpenFullImageModal(false)}
          />
        </ul>
      )}
      <div className="flex w-full justify-center gap-5">{children}</div>
    </div>
  );
}

export default MultipleImagesUploader;
