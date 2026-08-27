import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaPhotosTab from "./MediaPhotosTab";
import MediaFilesTab from "./MediaFilesTab";

type ChatMediaModalProps = {
  open: boolean;
  onClose: () => void;
  variant: "direct" | "group";
};

// Add a new resource tab (e.g. "links") by adding an entry here and a
// matching <Media*Tab> component below — no other wiring needed.
const RESOURCE_TABS = [
  { key: "images", label: "Photos" },
  { key: "files", label: "Files" },
] as const;

type ResourceTabKey = (typeof RESOURCE_TABS)[number]["key"];

const ChatMediaModal = ({ open, onClose, variant }: ChatMediaModalProps) => {
  const { id } = useParams();
  const activeId = open ? id : undefined;
  const [activeTab, setActiveTab] = useState<ResourceTabKey>("images");

  return (
    <Drawer open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DrawerContent>
        <DrawerHeader className="border-b border-border pr-12 pb-3">
          <DrawerTitle>Media</DrawerTitle>
        </DrawerHeader>
        <Tabs
          value={activeTab}
          onValueChange={(value: unknown) => setActiveTab(value as ResourceTabKey)}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4"
        >
          <TabsList className="shrink-0">
            {RESOURCE_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <DrawerBody className="pb-4">
            <TabsContent value="images">
              <MediaPhotosTab
                variant={variant}
                id={activeTab === "images" ? activeId : undefined}
              />
            </TabsContent>
            <TabsContent value="files">
              <MediaFilesTab
                variant={variant}
                id={activeTab === "files" ? activeId : undefined}
              />
            </TabsContent>
          </DrawerBody>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};

export default ChatMediaModal;
