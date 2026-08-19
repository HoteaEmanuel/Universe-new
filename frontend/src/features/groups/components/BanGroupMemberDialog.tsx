import { useState } from "react";
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
import { useBanGroupMemberMutation } from "@/queryAndMutation/mutations/group-mutation";
import type { ChangeEvent } from "react";
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
  const [reason, setReason] = useState("");
  const { mutate: banMember } = useBanGroupMemberMutation(groupId);

  const handleBan = () => {
    if (!userId) return;
    banMember({ userId, reason: reason.trim() || undefined });
    setReason("");
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Remove {userName || "this member"} from the group?
          </AlertDialogTitle>
          <AlertDialogDescription>
            They&apos;ll be removed immediately and won&apos;t be able to rejoin,
            even if invited again, until an admin unbans them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder="Reason (optional, only visible to admins)"
          value={reason}
          onChange={(e:ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
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

export default BanGroupMemberDialog;
