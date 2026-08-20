import BanTargetDialog from "@/features/moderation/components/BanTargetDialog";
import { useBanGroupMemberMutation } from "@/queryAndMutation/mutations/group-mutation";

type BanGroupMemberDialogProps = {
  open: boolean;
  onClose: () => void;
  groupId?: string;
  userId?: string;
  userName?: string;
};

const BanGroupMemberDialog = ({
  open,
  onClose,
  groupId,
  userId,
  userName,
}: BanGroupMemberDialogProps) => {
  const { mutate: banMember, isPending } = useBanGroupMemberMutation(groupId);

  const handleBan = (reason?: string) => {
    if (!userId) return;
    banMember({ userId, reason }, { onSuccess: onClose });
  };

  return (
    <BanTargetDialog
      open={open}
      onClose={onClose}
      title={`Remove ${userName || "this member"} from the group?`}
      description="They'll be removed immediately and won't be able to rejoin, even if invited again, until an admin unbans them."
      reasonAudience="admins"
      isPending={isPending}
      canConfirm={!!userId}
      onConfirm={handleBan}
    />
  );
};

export default BanGroupMemberDialog;
