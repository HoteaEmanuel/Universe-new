import type { EventSummary } from "@/queryAndMutation/types";
import { Button } from "@/components/ui/button";
import EventSuggestionCard from "./EventSuggestionCard";
import OnboardingIllustration from "../OnboardingIllustration";
import eventsIllustration from "@/assets/onboarding/events.webp";

type EventsStepProps = {
  events: EventSummary[];
  onNext: () => void;
  onSkip: () => void;
};

const EventsStep = ({ events, onNext, onSkip }: EventsStepProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <OnboardingIllustration
          src={eventsIllustration}
          alt="Friends arriving at an evening campus event"
          size="compact"
        />
        <h2 className="heading-text-1 text-xl">Coming up</h2>
        <p className="text-sm text-muted-foreground">
          A couple of upcoming events at your university.
        </p>
      </div>

      <ul className="flex max-h-96 flex-col gap-4 overflow-y-auto">
        {events.map((event) => (
          <EventSuggestionCard key={event.id} event={event} />
        ))}
      </ul>

      <div className="flex items-center justify-end gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip
        </Button>
        <Button type="button" onClick={onNext}>
          Finish
        </Button>
      </div>
    </div>
  );
};

export default EventsStep;
