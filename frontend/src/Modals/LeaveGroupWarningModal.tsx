import { useNavigate, useParams } from "react-router-dom";
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
import { useLeaveGroupMutation } from "../queryAndMutation/mutations/group-mutation";

type LeaveGroupWarningModalProps = {
  open: boolean;
  onClose: () => void;
};

const LeaveGroupWarningModal = ({ open, onClose }: LeaveGroupWarningModalProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mutate: leaveGroup } = useLeaveGroupMutation();

  const handleLeave = () => {
    if (!id) return;
    leaveGroup(id);
    navigate("/chat");
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next: boolean) => !next && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this group?</AlertDialogTitle>
          <AlertDialogDescription>
            This can&apos;t be undone. You can only rejoin if an admin adds
            you back.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleLeave}>
            Leave group
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeaveGroupWarningModal;
