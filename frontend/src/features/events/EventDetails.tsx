import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Video,
  Users,
  BadgeCheck,
  ExternalLink,
  Download,
  MessageCircle,
  Ban,
  Pencil,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store/authStore";
import { useEventStore } from "@/store/eventStore";
import { useGetEventQuery } from "@/queryAndMutation/queries/event-queries";
import {
  useRsvpEventMutation,
  useCancelRsvpMutation,
  useCancelEventMutation,
  useJoinEventChatMutation,
} from "@/queryAndMutation/mutations/event-mutation";
import { formatEventDateTime, buildGoogleCalendarUrl } from "./utils/formatEventDate";
import { urlPathName } from "@/utils/urlPathFromName";
import EventParticipantsModal from "./components/EventParticipantsModal";
import EventFormModal from "./components/EventFormModal";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: event, isPending } = useGetEventQuery(id);
  const { downloadEventIcs } = useEventStore();
  const rsvpMutation = useRsvpEventMutation(id);
  const cancelRsvpMutation = useCancelRsvpMutation(id);
  const cancelEventMutation = useCancelEventMutation(id);
  const joinChatMutation = useJoinEventChatMutation(id);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (event) document.title = event.title;
  }, [event]);

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-4 pb-24 md:pb-10">
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!event) return null;

  const isHost = event.creatorId === user?.id;
  const isCancelled = event.status === "cancelled";
  const viewerStatus = event.viewerParticipation?.status;
  const hostName = event.hostGroup?.name ?? event.creator.firstName ?? event.creator.name ?? "Someone";

  const handleRsvp = (status: "going" | "interested") => {
    if (viewerStatus === status) {
      cancelRsvpMutation.mutate();
    } else {
      rsvpMutation.mutate(status);
    }
  };

  const handleJoinChat = () => {
    joinChatMutation.mutate(undefined, {
      onSuccess: (group) => navigate(`/groups/${group.id}`),
    });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/events");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-4 pb-24 md:pb-10">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Back"
        className="-ml-1 w-fit"
        onClick={handleBack}
      >
        <ArrowLeft />
      </Button>

      {event.coverImageUrl && (
        <img
          src={event.coverImageUrl}
          alt=""
          className="aspect-video w-full rounded-2xl object-cover"
        />
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="brand" className="px-2.5 py-1">
          <CalendarDays className="size-3.5" />
          {formatEventDateTime(event.startAt, event.endAt)}
        </Badge>
        {event.eventType === "official" && (
          <Badge variant="info" className="px-2.5 py-1">
            <BadgeCheck className="size-3.5" />
            Official
          </Badge>
        )}
        {isCancelled && (
          <Badge variant="destructive" className="px-2.5 py-1">Cancelled</Badge>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
        <Link
          to={event.hostGroup ? `/groups/${event.hostGroup.id}` : `/u/${urlPathName(event.creator)}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Users className="size-3.5" />
          Hosted by {hostName}
        </Link>
      </div>

      {event.description && (
        <p className="whitespace-pre-wrap text-sm text-foreground">{event.description}</p>
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-border p-4 text-sm">
        {event.location && (
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            {event.location}
          </p>
        )}
        {event.virtualUrl && (
          <a
            href={event.virtualUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <Video className="size-4 shrink-0" />
            Join virtually
            <ExternalLink className="size-3" />
          </a>
        )}
        <button
          type="button"
          onClick={() => setShowParticipants(true)}
          className="flex items-center gap-2 text-left hover:text-primary"
        >
          <Users className="size-4 shrink-0 text-muted-foreground" />
          {event.counts.going} going
          {event.capacity ? ` / ${event.capacity} spots` : ""}
          {event.counts.interested > 0 && ` · ${event.counts.interested} interested`}
          {event.counts.waitlisted > 0 && ` · ${event.counts.waitlisted} waitlisted`}
        </button>
      </div>

      {!isCancelled && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={viewerStatus === "going" ? "default" : "outline"}
            onClick={() => handleRsvp("going")}
            disabled={rsvpMutation.isPending || cancelRsvpMutation.isPending}
          >
            {viewerStatus === "going" ? "Going ✓" : "Going"}
          </Button>
          <Button
            variant={viewerStatus === "interested" ? "default" : "outline"}
            onClick={() => handleRsvp("interested")}
            disabled={rsvpMutation.isPending || cancelRsvpMutation.isPending}
          >
            {viewerStatus === "interested" ? "Interested ✓" : "Interested"}
          </Button>
          {viewerStatus === "waitlisted" && (
            <Button variant="outline" disabled>
              Waitlisted
            </Button>
          )}
          {event.coordinationGroup && (viewerStatus || isHost) && (
            <Button
              variant="ghost"
              className="gap-1.5"
              onClick={handleJoinChat}
              disabled={joinChatMutation.isPending}
            >
              <MessageCircle className="size-4" />
              Join event chat
            </Button>
          )}
          {!event.coordinationGroup && isHost && (
            <Button
              variant="ghost"
              className="gap-1.5"
              onClick={handleJoinChat}
              disabled={joinChatMutation.isPending}
            >
              <MessageCircle className="size-4" />
              Start event chat
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          href={buildGoogleCalendarUrl(event)}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2 px-3")}
        >
          <img src="/icons8-google-calendar-48.png" alt="" className="size-4 shrink-0" />
          <span>Add to Google Calendar</span>
        </a>
        <Button
          variant="outline"
          className="h-10 gap-2 px-3"
          onClick={() => downloadEventIcs(event.id, event.title)}
        >
          <Download className="size-4 shrink-0" />
          <span>Download .ics</span>
        </Button>
      </div>

      {isHost && !isCancelled && (
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            className="gap-1.5"
            onClick={() => setShowEditModal(true)}
          >
            <Pencil className="size-4" />
            Edit event
          </Button>
          <Button
            variant="ghost"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => setShowCancelConfirm(true)}
          >
            <Ban className="size-4" />
            Cancel event
          </Button>
        </div>
      )}

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this event?</AlertDialogTitle>
            <AlertDialogDescription>
              All participants will be notified. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep event</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => cancelEventMutation.mutate()}
            >
              Cancel event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EventParticipantsModal
        open={showParticipants}
        onClose={() => setShowParticipants(false)}
        eventId={event.id}
        isHost={isHost}
        counts={event.counts}
      />

      {isHost && (
        <EventFormModal
          mode="edit"
          event={event}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default EventDetails;
