import { useState } from "react";
import { useParams } from "react-router-dom";
import { useUpdateProfilePicture } from "../queryAndMutation/mutations/user-mutation";
import { useUpdateGroupImageMutation } from "../queryAndMutation/mutations/group-mutation";
import { useAuthStore } from "../store/authStore";
import ImageUploader from "../components/ImageUploader";
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
};

const ProfileImageModal = ({
  open,
  onClose,
  entityType,
}: ProfileImageModalProps) => {
  const { id } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { changeProfilePicture } = useAuthStore() as {
    changeProfilePicture: (image: string) => void;
  };
  const { mutateAsync: updateProfilePicture, isPending: isUpdatingUser } =
    useUpdateProfilePicture();
  // group-mutation.js is untyped JS; TVariables can't be inferred, so bridge it here.
  const { mutateAsync: updateGroupImage, isPending: isUpdatingGroup } =
    useUpdateGroupImageMutation(id) as unknown as {
      mutateAsync: (file: File) => Promise<unknown>;
      isPending: boolean;
    };

  const handleUpdateImage = async () => {
    try {
      if (!file) throw new Error("No image provided");
      if (entityType === "group") {
        await updateGroupImage(file);
      } else {
        await updateProfilePicture(file);
        changeProfilePicture(URL.createObjectURL(file));
      }
      setFile(null);
      setError(null);
      onClose();
    } catch (err) {
      setError(err as Error);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
        <SheetContent
          side="bottom"
          className="mx-auto flex w-full flex-col rounded-t-2xl sm:max-w-md"
        >
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Change photo</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center gap-4 px-4 pb-4">
            {error && (
              <p className="text-sm text-destructive">{error.message}</p>
            )}
            <ImageUploader setFile={setFile} file={file} classes="w-full">
              <Button
                type="button"
                className="w-full"
                disabled={isUpdatingUser || isUpdatingGroup}
                onClick={handleUpdateImage}
              >
                Save photo
              </Button>
            </ImageUploader>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProfileImageModal;
