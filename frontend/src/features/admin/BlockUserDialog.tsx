import BanTargetDialog from "@/features/moderation/components/BanTargetDialog";
import { useBlockUserMutation } from "@/queryAndMutation/mutations/admin-mutation";

type BlockUserDialogProps = {
  open: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
};

const BlockUserDialog = ({ open, onClose, userId, userName }: BlockUserDialogProps) => {
  const { mutate: blockUser, isPending } = useBlockUserMutation();

  const handleBlock = (reason?: string) => {
    if (!userId) return;
    blockUser({ id: userId, reason }, { onSuccess: onClose });
  };

  return (
    <BanTargetDialog
      open={open}
      onClose={onClose}
      title={`Block ${userName || "this user"}?`}
      description="They'll be logged out and won't be able to log back in until an admin unblocks them. They'll receive an email explaining why."
      reasonAudience="the blocked user, in their notification email"
      isPending={isPending}
      canConfirm={!!userId}
      onConfirm={handleBlock}
      confirmLabel="Block user"
      pendingLabel="Blocking..."
    />
  );
};

export default BlockUserDialog;
