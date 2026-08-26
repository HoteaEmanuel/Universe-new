import { useUniversityPeopleInfiniteQuery } from "@/queryAndMutation/queries/user-queries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import UniversityPersonRow from "@/features/search/components/UniversityPersonRow";
import OnboardingIllustration from "../OnboardingIllustration";
import peopleIllustration from "@/assets/onboarding/people.webp";

type PeopleStepProps = {
  onNext: () => void;
  onSkip: () => void;
  continueLabel?: string;
};

const PeopleStep = ({ onNext, onSkip, continueLabel = "Continue" }: PeopleStepProps) => {
  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUniversityPeopleInfiniteQuery(true);
  const people = data?.pages.flatMap((page) => page.people) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <OnboardingIllustration
          src={peopleIllustration}
          alt="Three students connecting over a shared sketchbook"
          size="compact"
        />
        <h2 className="heading-text-1 text-xl">Find your people</h2>
        <p className="text-sm text-muted-foreground">
          A few people from your university to get you started.
        </p>
      </div>

      {isPending && (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </li>
          ))}
        </ul>
      )}

      {!isPending && people.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No suggestions yet — you can always find people to follow later.
        </p>
      )}

      {!isPending && people.length > 0 && (
        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {people.slice(0, 8).map((person) => (
            <UniversityPersonRow key={person.id} user={person} />
          ))}
        </ul>
      )}

      {hasNextPage && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
          className="w-fit self-center text-xs"
        >
          {isFetchingNextPage ? "Loading..." : "Show me more people"}
        </Button>
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

export default PeopleStep;
