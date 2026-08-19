import { useState, type ChangeEvent } from "react";
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
import { useBanEventParticipantMutation } from "@/queryAndMutation/mutations/event-mutation";

type BanEventParticipantDialogProps = {
  open: boolean;
  onClose: () => void;
  eventId?: string;
  userId?: string;
  userName?: string;
};

const BanEventParticipantDialog = ({
  open,
  onClose,
  eventId,
  userId,
  userName,
}: BanEventParticipantDialogProps) => {
  const [reason, setReason] = useState("");
  const { mutate: banParticipant } = useBanEventParticipantMutation(eventId);

  const handleBan = () => {
    if (!userId) return;
    banParticipant({ userId, reason: reason.trim() || undefined });
    setReason("");
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Remove {userName || "this participant"} from the event?
          </AlertDialogTitle>
          <AlertDialogDescription>
            They&apos;ll be removed immediately and won&apos;t be able to RSVP
            again until you unban them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder="Reason (optional, only visible to hosts)"
          value={reason}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
          maxLength={500}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleBan}>
            Remove and ban
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BanEventParticipantDialog;
