import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
} from "@/components/ui/drawer";
import BlockedUsersList from "./BlockedUsersList";

type BlockedUsersModalProps = {
  open: boolean;
  onClose: () => void;
};

const BlockedUsersModal = ({ open, onClose }: BlockedUsersModalProps) => {
  return (
    <Drawer open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DrawerContent>
        <DrawerHeader className="border-b border-border pr-12 pb-3">
          <DrawerTitle>Blocked users</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="px-4 pb-4">
          <BlockedUsersList enabled={open} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default BlockedUsersModal;
