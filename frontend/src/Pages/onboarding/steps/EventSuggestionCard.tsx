import { useState } from "react";
import { Check } from "lucide-react";
import { useRsvpEventMutation } from "@/queryAndMutation/mutations/event-mutation";
import EventCard from "@/features/events/components/EventCard";
import { Button } from "@/components/ui/button";
import type { EventSummary } from "@/queryAndMutation/types";

const EventSuggestionCard = ({ event }: { event: EventSummary }) => {
  const [rsvped, setRsvped] = useState(false);
  const { mutate: rsvp, isPending } = useRsvpEventMutation(event.id);

  return (
    <li className="flex flex-col gap-2">
      <EventCard event={event} />
      <Button
        type="button"
        size="sm"
        variant={rsvped ? "outline" : "default"}
        disabled={rsvped || isPending}
        onClick={() => rsvp("going", { onSuccess: () => setRsvped(true) })}
        className="self-end"
      >
        {rsvped ? (
          <>
            <Check className="size-3.5" /> Going
          </>
        ) : (
          "I'm going"
        )}
      </Button>
    </li>
  );
};

export default EventSuggestionCard;
