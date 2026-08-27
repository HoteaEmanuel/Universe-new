import { useGetDiscoverablePublicGroups } from "@/queryAndMutation/queries/group-queries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import GroupSuggestionCard from "./GroupSuggestionCard";
import OnboardingIllustration from "../OnboardingIllustration";
import groupsIllustration from "@/assets/onboarding/groups.webp";

type GroupsStepProps = {
  onNext: () => void;
  onSkip: () => void;
  continueLabel?: string;
};

const GroupsStep = ({ onNext, onSkip, continueLabel = "Continue" }: GroupsStepProps) => {
  const { data: groups, isPending } = useGetDiscoverablePublicGroups(
    true,
    undefined,
    true,
    6,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <OnboardingIllustration
          src={groupsIllustration}
          alt="A student group creating a zine together"
          size="compact"
        />
        <h2 className="heading-text-1 text-xl">Join a group</h2>
        <p className="text-sm text-muted-foreground">
          Public groups at your university you might want in on.
        </p>
      </div>

      {isPending && (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </li>
          ))}
        </ul>
      )}

      {!isPending && (!groups || groups.length === 0) && (
        <p className="py-6 list-loading-text">
          No public groups to suggest yet — you can browse groups anytime.
        </p>
      )}

      {!isPending && groups && groups.length > 0 && (
        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {groups.map((group) => (
            <GroupSuggestionCard key={group.id} group={group} />
          ))}
        </ul>
      )}

      <div className="flex items-center justify-end gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip
        </Button>
        <Button type="button" onClick={onNext}>
          {continueLabel}
        </Button>
      </div>
    </div>
  );
};

export default GroupsStep;
