import { useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { Camera } from "lucide-react";
import { useUpdateProfilePicture } from "../queryAndMutation/mutations/user-mutation";
import { useUpdateGroupImageMutation } from "../queryAndMutation/mutations/group-mutation";
import { useAuthStore } from "../store/authStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ProfileImageModalProps = {
  open: boolean;
  onClose: () => void;
  entityType?: "user" | "group";
  currentImageUrl?: string;
};

const ProfileImageModal = ({
  open,
  onClose,
  entityType,
  currentImageUrl,
}: ProfileImageModalProps) => {
  const { id } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { changeProfilePicture } = useAuthStore() as {
    changeProfilePicture: (image: string) => void;
  };
  const { mutateAsync: updateProfilePicture, isPending: isUpdatingUser } =
    useUpdateProfilePicture();
  const { mutateAsync: updateGroupImage, isPending: isUpdatingGroup } =
    useUpdateGroupImageMutation(id);
  const isPending = isUpdatingUser || isUpdatingGroup;

  const preview = file ? URL.createObjectURL(file) : currentImageUrl;

  const closeAndReset = () => {
    setFile(null);
    setError(null);
    onClose();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  };

  const handleSave = async () => {
    try {
      if (!file) throw new Error("Choose a photo first");
      if (entityType === "group") {
        await updateGroupImage(file);
      } else {
        await updateProfilePicture(file);
        changeProfilePicture(URL.createObjectURL(file));
      }
      closeAndReset();
    } catch (err) {
      setError(err as Error);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Sheet
        open={open}
        onOpenChange={(next: boolean) => !next && closeAndReset()}
      >
        <SheetContent
          side="bottom"
          className="mx-auto flex w-full flex-col items-center rounded-t-2xl sm:max-w-sm"
        >
          <SheetHeader className="w-full items-center border-b border-border pb-3 text-center">
            <SheetTitle>Change photo</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col items-center gap-4 px-4 pb-6">
            <label className="group/avatar relative cursor-pointer">
              <div className="size-36 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Camera className="size-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <span className="absolute inset-0 flex items-center justify-center rounded-full text-transparent transition-colors group-hover/avatar:bg-black/40 group-hover/avatar:text-white">
                <Camera className="size-7" />
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            {error && (
              <p className="text-sm text-destructive">{error.message}</p>
            )}

            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={closeAndReset}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!file || isPending}
                onClick={handleSave}
              >
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProfileImageModal;
