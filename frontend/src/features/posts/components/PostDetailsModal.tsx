import { useEffect } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PostDetails from "../PostDetails";

const PostDetailsModal = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Post Details";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) navigate(-1);
  };

  return (
    <DialogPrimitive.Root open onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-0 transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 sm:p-6">
          <DialogPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                className="fixed top-4 right-4 z-60 bg-black/30 text-white backdrop-blur-sm hover:bg-black/40 hover:text-white"
              />
            }
          >
            <XIcon className="size-6" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          <div className="relative flex h-full w-full flex-col overflow-hidden bg-background shadow-lg sm:h-[85vh] sm:max-h-[85vh] sm:w-full sm:max-w-5xl sm:rounded-2xl">
            <PostDetails inModal />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default PostDetailsModal;
