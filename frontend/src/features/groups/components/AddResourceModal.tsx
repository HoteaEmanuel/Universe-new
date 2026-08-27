import { useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { Link2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddCourseResourceMutation } from "@/queryAndMutation/mutations/group-mutation";
import type { ResourceCategory } from "@/features/chat/types";

type AddResourceModalProps = {
  open: boolean;
  onClose: () => void;
};

const CATEGORY_OPTIONS: { value: ResourceCategory; label: string }[] = [
  { value: "lecture_notes", label: "Lecture notes" },
  { value: "assignment", label: "Assignment" },
  { value: "exam_prep", label: "Exam prep" },
  { value: "link", label: "Link" },
  { value: "recording", label: "Recording" },
  { value: "other", label: "Other" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "lecture_notes" as ResourceCategory,
  week: "",
  linkUrl: "",
};

const AddResourceModal = ({ open, onClose }: AddResourceModalProps) => {
  const { id: groupId } = useParams();
  const [mode, setMode] = useState<"file" | "link">("file");
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const { mutate: addResource, isPending } = useAddCourseResourceMutation(groupId);

  const reset = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setMode("file");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit =
    form.title.trim().length > 0 &&
    (mode === "file" ? !!file : form.linkUrl.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    addResource(
      {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        week: form.week.trim() || undefined,
        linkUrl: mode === "link" ? form.linkUrl.trim() : undefined,
        file: mode === "file" ? (file as File) : undefined,
      },
      { onSuccess: handleClose },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add resource</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resource-title">Title</Label>
            <Input
              id="resource-title"
              type="text"
              value={form.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Week 4 lecture slides"
              maxLength={150}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(value: unknown) =>
                setForm((f) => ({ ...f, category: value as ResourceCategory }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resource-week">Week (optional)</Label>
            <Input
              id="resource-week"
              type="text"
              value={form.week}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({ ...f, week: e.target.value }))
              }
              placeholder="Week 4"
              maxLength={50}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resource-description">Description (optional)</Label>
            <Textarea
              id="resource-description"
              value={form.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="What this resource covers..."
              maxLength={1000}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "file" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("file")}
            >
              <Upload className="size-3.5" />
              Upload file
            </Button>
            <Button
              type="button"
              variant={mode === "link" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("link")}
            >
              <Link2 className="size-3.5" />
              Paste link
            </Button>
          </div>

          {mode === "file" ? (
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFile(e.target.files?.[0] ?? null)
              }
            />
          ) : (
            <Input
              type="text"
              value={form.linkUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({ ...f, linkUrl: e.target.value }))
              }
              placeholder="https://..."
            />
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Adding..." : "Add resource"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddResourceModal;
