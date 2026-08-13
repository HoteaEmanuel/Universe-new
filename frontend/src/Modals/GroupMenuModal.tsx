import { useState } from "react";
import { useParams } from "react-router-dom";
import { EllipsisVertical, LogOut, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetGroupMemberById } from "../queryAndMutation/queries/group-queries";
import AddMembersModal from "./AddMembersModal";
import ViewMembersModal from "./ViewMembersModal";
import LeaveGroupWarningModal from "./LeaveGroupWarningModal";

const GroupMenuModal = () => {
  const { id } = useParams();
  const { data: member } = useGetGroupMemberById(id);
  const isAdmin = member?.role === "admin";

  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [viewMembersOpen, setViewMembersOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Group options"
            />
          }
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAdmin && (
            <DropdownMenuItem onClick={() => setAddMembersOpen(true)}>
              <UserPlus />
              Add members
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setViewMembersOpen(true)}>
            <Users />
            View members
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setLeaveOpen(true)}
          >
            <LogOut />
            Leave group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddMembersModal
        open={addMembersOpen}
        onClose={() => setAddMembersOpen(false)}
      />
      <ViewMembersModal
        open={viewMembersOpen}
        onClose={() => setViewMembersOpen(false)}
      />
      <LeaveGroupWarningModal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
      />
    </>
  );
};

export default GroupMenuModal;
