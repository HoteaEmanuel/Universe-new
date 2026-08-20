import BanTargetDialog from "@/features/moderation/components/BanTargetDialog";
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
  const { mutate: banParticipant, isPending } =
    useBanEventParticipantMutation(eventId);

  const handleBan = (reason?: string) => {
    if (!userId) return;
    banParticipant({ userId, reason }, { onSuccess: onClose });
  };

  return (
    <BanTargetDialog
      open={open}
      onClose={onClose}
      title={`Remove ${userName || "this participant"} from the event?`}
      description="They'll be removed immediately and won't be able to RSVP again until you unban them."
      reasonAudience="hosts"
      isPending={isPending}
      canConfirm={!!userId}
      onConfirm={handleBan}
    />
  );
};

export default BanEventParticipantDialog;
