import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Video, Users, BadgeCheck } from "lucide-react";
import type { EventSummary } from "@/queryAndMutation/types";
import { formatEventDateTime } from "../utils/formatEventDate";

type EventCardProps = {
  event: EventSummary;
  // When provided, the card renders as a clickable <div> instead of a <Link>
  // - needed wherever it's embedded inside another element that's already a
  // Link (e.g. PostCard's feed card), since nested <a> tags are invalid HTML.
  onClick?: (e: MouseEvent) => void;
};

const EventCard = ({ event, onClick }: EventCardProps) => {
  const isCancelled = event.status === "cancelled";
  const hostName =
    event.hostGroup?.name ?? event.creator.firstName ?? event.creator.name ?? "Someone";

  const content = (
    <>
      {event.coverImageUrl && (
        <img
          src={event.coverImageUrl}
          alt=""
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="flex flex-col gap-1.5 p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-brand-400/15 dark:text-brand-100">
            <CalendarDays className="size-3" />
            {formatEventDateTime(event.startAt, event.endAt)}
          </span>
          {event.eventType === "official" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
              <BadgeCheck className="size-3" />
              Official
            </span>
          )}
          {isCancelled && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              Cancelled
            </span>
          )}
        </div>
        <p className="font-semibold leading-tight">{event.title}</p>
        {(event.location || event.virtualUrl) && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            {event.virtualUrl && !event.location ? (
              <Video className="size-3.5 shrink-0" />
            ) : (
              <MapPin className="size-3.5 shrink-0" />
            )}
            <span className="truncate">{event.location || "Virtual event"}</span>
          </p>
        )}
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3.5 shrink-0" />
          Hosted by {hostName}
        </p>
      </div>
    </>
  );

  const className =
    "flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:bg-muted";

  if (onClick) {
    return (
      <div role="link" tabIndex={0} className={className} onClick={onClick}>
        {content}
      </div>
    );
  }

  return (
    <Link to={`/events/${event.id}`} className={className}>
      {content}
    </Link>
  );
};

export default EventCard;
