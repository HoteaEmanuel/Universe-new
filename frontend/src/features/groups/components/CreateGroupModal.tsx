import { useState } from "react";
import { useForm } from "react-hook-form";
import { Globe, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormField from "@/components/FormField";
import TextareaField from "@/components/TextareaField";
import { useCreateGroupMutation } from "@/queryAndMutation/mutations/group-mutation";
import { useGetCourseCatalog } from "@/queryAndMutation/queries/group-queries";
import { useAuthStore } from "@/store/authStore";
import type { GroupVisibility } from "@/features/chat/types";

const NO_COURSE = "__none__";

type CreateGroupModalProps = {
  open: boolean;
  onClose: () => void;
};

type CreateGroupFormValues = {
  groupName: string;
  groupDescription?: string;
};

const CreateGroupModal = ({ open, onClose }: CreateGroupModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGroupFormValues>();
  const [visibility, setVisibility] = useState<GroupVisibility>("private");
  const [courseTag, setCourseTag] = useState<string>(NO_COURSE);
  const { mutate: createGroup, isPending } = useCreateGroupMutation();
  const { user } = useAuthStore() as {
    user: { university?: string | null } | null;
  };
  const hasUniversity =
    !!user?.university && user.university !== "No university yet";
  const { data: courses } = useGetCourseCatalog(open && hasUniversity);

  const closeAndReset = () => {
    reset();
    setVisibility("private");
    setCourseTag(NO_COURSE);
    onClose();
  };

  const onSubmit = (data: CreateGroupFormValues) => {
    createGroup({
      name: data.groupName,
      description: data.groupDescription,
      visibility,
      courseTag: courseTag === NO_COURSE ? undefined : courseTag,
    });
    closeAndReset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => !next && closeAndReset()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            id="group-name"
            label="Group name"
            error={errors.groupName?.message}
            registration={register("groupName", {
              required: "Group name is required",
              minLength: {
                value: 3,
                message: "Group name must be at least 3 characters",
              },
            })}
            placeholder="e.g. Study Buddies"
          />
          <TextareaField
            id="group-description"
            label="Description (optional)"
            registration={register("groupDescription")}
            placeholder="What's this group about?"
            rows={3}
          />
          {hasUniversity && courses && courses.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Course (optional)</Label>
              <Select
                value={courseTag}
                onValueChange={(value: unknown) =>
                  setCourseTag((value as string) ?? NO_COURSE)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COURSE}>No course</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Visibility</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={visibility === "private" ? "default" : "outline"}
                className="flex-1 justify-start gap-2"
                onClick={() => setVisibility("private")}
              >
                <Lock />
                Private
              </Button>
              <Button
                type="button"
                variant={visibility === "public" ? "default" : "outline"}
                className="flex-1 justify-start gap-2"
                onClick={() => setVisibility("public")}
              >
                <Globe />
                Public
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {visibility === "private"
                ? "Only admins can add members."
                : "Anyone can find and join this group."}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Create group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
