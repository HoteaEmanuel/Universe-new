import { useEffect, useState, type ComponentType } from "react";
import Tour, { type ReactourProps } from "reactour";
import { useAuthStore } from "@/store/authStore";
import { useMarkAppTourSeenMutation } from "@/queryAndMutation/mutations/user-mutation";

// reactour supports `highlightedBorder` at runtime but the published types omit it.
const TourWithHighlightedBorder = Tour as ComponentType<
  ReactourProps & { highlightedBorder?: { color: string; width: number } }
>;

const TOUR_STEPS = [
  {
    selector: "[data-tour='nav-home']",
    content: "Your feed — see what people you follow are posting and sharing.",
  },
  {
    selector: "[data-tour='nav-explore']",
    content: "Explore discovers new posts, people, and groups outside your feed.",
  },
  {
    selector: "[data-tour='nav-chat']",
    content: "Chat holds your direct messages and group conversations.",
  },
  {
    selector: "[data-tour='nav-events']",
    content: "Browse and RSVP to events happening around your university.",
  },
  {
    selector: "[data-tour='nav-create-post']",
    content: "Share a new post, photo, or poll with your network.",
  },
  {
    selector: "[data-tour='nav-notifications']",
    content: "Notifications keep you posted on likes, comments, and follows.",
  },
  {
    selector: "[data-tour='nav-settings']",
    content: "Manage your account, privacy, and preferences here.",
  },
];

const AppTour = () => {
  const { user, updateCurrentUser } = useAuthStore();
  const { mutate: markAppTourSeen } = useMarkAppTourSeenMutation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop && user?.hasCompletedOnboarding && !user.hasSeenAppTour) {
      setIsOpen(true);
    }
  }, [user?.hasCompletedOnboarding, user?.hasSeenAppTour]);

  // Marks the tour as seen, the user skipped it
  const closeTour = () => {
    setIsOpen(false);
    updateCurrentUser({ hasSeenAppTour: true });
    markAppTourSeen();
  };

  if (!user || !user.hasCompletedOnboarding || user.hasSeenAppTour) return null;

  return (
    <TourWithHighlightedBorder
      steps={TOUR_STEPS}
      isOpen={isOpen}
      onRequestClose={closeTour}
      accentColor="var(--primary)"
      rounded={12}
      showNumber={false}
      className="universe-tour-helper"
      maskClassName="universe-tour-mask"
      highlightedBorder={{ color: "var(--primary)", width: 2 }}
    ></TourWithHighlightedBorder>
  );
};

export default AppTour;
