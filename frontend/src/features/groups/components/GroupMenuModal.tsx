import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  BookOpen,
  EllipsisVertical,
  FolderOpen,
  Images,
  LogOut,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGetGroupMemberById } from "@/queryAndMutation/queries/group-queries";
import AddMembersModal from "./AddMembersModal";
import ViewMembersModal from "./ViewMembersModal";
import LeaveGroupWarningModal from "./LeaveGroupWarningModal";
import SetCourseTagModal from "./SetCourseTagModal";
import GroupResourcesModal from "./GroupResourcesModal";
import ChatMediaModal from "@/features/chat/components/ChatMediaModal";

const GroupMenuModal = () => {
  const { id } = useParams();
  const { data: member } = useGetGroupMemberById(id);
  const isAdmin = member?.role === "admin";

  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [viewMembersOpen, setViewMembersOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [courseTagOpen, setCourseTagOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Group options"
                  />
                }
              />
            }
          >
            <EllipsisVertical />
          </TooltipTrigger>
          <TooltipContent>Group options</TooltipContent>
        </Tooltip>
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
          <DropdownMenuItem onClick={() => setMediaOpen(true)}>
            <Images />
            View media
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResourcesOpen(true)}>
            <FolderOpen />
            Resources
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => setCourseTagOpen(true)}>
              <BookOpen />
              Set course
            </DropdownMenuItem>
          )}
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
      <ChatMediaModal
        variant="group"
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
      />
      <SetCourseTagModal
        open={courseTagOpen}
        onClose={() => setCourseTagOpen(false)}
      />
      <GroupResourcesModal
        open={resourcesOpen}
        onClose={() => setResourcesOpen(false)}
      />
    </>
  );
};

export default GroupMenuModal;
