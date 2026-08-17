import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[70vh] w-full flex-col rounded-t-2xl sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pb-3">
          <SheetTitle>Media</SheetTitle>
        </SheetHeader>
        <Tabs
          value={activeTab}
          onValueChange={(value: unknown) => setActiveTab(value as ResourceTabKey)}
          className="flex-1 gap-3 overflow-hidden px-4 pb-4"
        >
          <TabsList>
            {RESOURCE_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
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
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default ChatMediaModal;
