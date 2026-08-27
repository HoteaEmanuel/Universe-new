import { useEffect, useState, type ChangeEvent } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

const MAX_REASON_LENGTH = 500;

type BanTargetDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  reasonAudience: string;
  isPending: boolean;
  canConfirm: boolean;
  onConfirm: (reason?: string) => void;
  confirmLabel?: string;
  pendingLabel?: string;
};

const BanTargetDialog = ({
  open,
  onClose,
  title,
  description,
  reasonAudience,
  isPending,
  canConfirm,
  onConfirm,
  confirmLabel = "Remove and ban",
  pendingLabel = "Removing...",
}: BanTargetDialogProps) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next && !isPending) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Textarea
            placeholder={`Reason (optional, only visible to ${reasonAudience})`}
            value={reason}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setReason(e.target.value)
            }
            maxLength={MAX_REASON_LENGTH}
            disabled={isPending}
          />
          <p className="text-right text-xs text-muted-foreground">
            {reason.length}/{MAX_REASON_LENGTH}
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending || !canConfirm}
            onClick={handleConfirm}
          >
            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BanTargetDialog;
