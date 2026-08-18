import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import { useGetGroupById } from "@/queryAndMutation/queries/group-queries";
import { useGetCourseCatalog } from "@/queryAndMutation/queries/group-queries";
import { useSetGroupCourseTagMutation } from "@/queryAndMutation/mutations/group-mutation";

const NO_COURSE = "__none__";

type SetCourseTagModalProps = {
  open: boolean;
  onClose: () => void;
};

const SetCourseTagModal = ({ open, onClose }: SetCourseTagModalProps) => {
  const { id } = useParams();
  const { data: group } = useGetGroupById(id);
  const { data: courses } = useGetCourseCatalog(open, id);
  const { mutate: setCourseTag, isPending } = useSetGroupCourseTagMutation(id);
  const [courseTag, setCourseTagValue] = useState<string>(NO_COURSE);

  useEffect(() => {
    if (open) setCourseTagValue(group?.courseTag ?? NO_COURSE);
  }, [open, group?.courseTag]);

  const hasCourses = !!courses && courses.length > 0;

  const handleSave = () => {
    setCourseTag(courseTag === NO_COURSE ? null : courseTag, {
      onSuccess: onClose,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Group course</DialogTitle>
        </DialogHeader>
        {hasCourses ? (
          <div className="flex flex-col gap-1.5">
            <Label>Course</Label>
            <Select
              value={courseTag}
              onValueChange={(value: unknown) =>
                setCourseTagValue((value as string) ?? NO_COURSE)
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
        ) : (
          <p className="text-sm text-muted-foreground">
            No course catalog is available for this group&apos;s university.
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending || !hasCourses}
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SetCourseTagModal;
