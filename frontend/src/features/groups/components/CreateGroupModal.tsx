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
import FormField from "@/components/FormField";
import TextareaField from "@/components/TextareaField";
import { useCreateGroupMutation } from "@/queryAndMutation/mutations/group-mutation";
import type { GroupVisibility } from "@/features/chat/types";

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
  const { mutate: createGroup, isPending } = useCreateGroupMutation();

  const closeAndReset = () => {
    reset();
    setVisibility("private");
    onClose();
  };

  const onSubmit = (data: CreateGroupFormValues) => {
    createGroup({
      name: data.groupName,
      description: data.groupDescription,
      visibility,
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
