import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Video, Users, BadgeCheck } from "lucide-react";
import type { EventSummary } from "@/queryAndMutation/types";
import { formatEventDateTime } from "../utils/formatEventDate";
import { Badge } from "@/components/ui/badge";

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
          <Badge variant="brand" className="py-0.5">
            <CalendarDays className="size-3" />
            {formatEventDateTime(event.startAt, event.endAt)}
          </Badge>
          {event.eventType === "official" && (
            <Badge variant="info" className="py-0.5">
              <BadgeCheck className="size-3" />
              Official
            </Badge>
          )}
          {isCancelled && <Badge variant="destructive" className="py-0.5">Cancelled</Badge>}
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

  const className = "card-shell text-left hover:bg-muted";

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
