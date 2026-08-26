import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCompleteOnboardingMutation } from "@/queryAndMutation/mutations/user-mutation";
import { useUpcomingUniversityEventsQuery } from "@/queryAndMutation/queries/event-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProfileUser } from "@/features/profile/types";
import "@/stars.css";
import OnboardingProgressBar from "./OnboardingProgressBar";
import WelcomeStep from "./steps/WelcomeStep";
import IdentityStep from "./steps/IdentityStep";
import PeopleStep from "./steps/PeopleStep";
import GroupsStep from "./steps/GroupsStep";
import EventsStep from "./steps/EventsStep";

type StepKey = "welcome" | "identity" | "people" | "groups" | "events";

const STEP_LABELS: Record<StepKey, string> = {
  welcome: "Welcome",
  identity: "Your identity",
  people: "Find your people",
  groups: "Join a group",
  events: "Coming up",
};

const OnboardingPage = () => {
  useEffect(() => {
    document.title = "Set up your profile";
  }, []);

  const navigate = useNavigate();
  const { user } = useAuthStore() as { user?: ProfileUser & { hasCompletedOnboarding?: boolean } };
  const { mutateAsync: completeOnboarding } = useCompleteOnboardingMutation();
  const { updateCurrentUser } = useAuthStore() as {
    updateCurrentUser: (updates: Record<string, unknown>) => void;
  };

  const hasUniversity = !!user?.university && user.university !== "No university yet";
  const eventsQuery = useUpcomingUniversityEventsQuery(hasUniversity, 3);
  const suggestedEvents = eventsQuery.data?.events ?? [];

  const steps = useMemo<StepKey[]>(() => {
    const base: StepKey[] = ["welcome", "identity", "people", "groups"];
    return suggestedEvents.length > 0 ? [...base, "events"] : base;
  }, [suggestedEvents.length]);

  const [stepIndex, setStepIndex] = useState(0);
  // Clamp instead of resetting to 0 if the events step disappears (query
  // resolves empty) while the user is sitting on a later step already.
  const clampedIndex = Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[clampedIndex];

  if (!user) return null;
  if (user.hasCompletedOnboarding) return <Navigate to="/home" replace />;

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const finish = async () => {
    try {
      await completeOnboarding();
    } finally {
      updateCurrentUser({ hasCompletedOnboarding: true });
      navigate("/home");
    }
  };

  const isLastStep = clampedIndex === steps.length - 1;
  const handleStepNext = isLastStep ? finish : goNext;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-12">
      <div className="dot-pattern" />
      <div className="star-layer absolute inset-0 -z-10">
        <div id="stars" />
        <div id="stars2" />
        <div id="stars3" />
      </div>
      <div className="nebula-glow" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-4 flex items-center gap-2">
          {clampedIndex > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Back"
              onClick={goBack}
              className="shrink-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}
          <div className="flex-1">
            {clampedIndex + 1 === 4 && (
              <p className="animate-like-pop mb-1.5 text-lg font-black sm:text-xl">
                <span className="heading-text-1">
                  Almost there — you're doing great!
                </span>{" "}
                🎉
              </p>
            )}
            <OnboardingProgressBar
              current={clampedIndex + 1}
              total={steps.length}
              label={STEP_LABELS[currentStep]}
            />
          </div>
        </div>

        <Card className="auth-card relative z-10 py-6 sm:py-8">
          <CardContent className="">
            <div key={currentStep} className="animate-fade-in-up">
              {currentStep === "welcome" && (
                <WelcomeStep user={user} onNext={goNext} />
              )}
              {currentStep === "identity" && (
                <IdentityStep user={user} onNext={goNext} />
              )}
              {currentStep === "people" && (
                <PeopleStep
                  onNext={handleStepNext}
                  onSkip={handleStepNext}
                  continueLabel={isLastStep ? "Finish" : "Continue"}
                />
              )}
              {currentStep === "groups" && (
                <GroupsStep
                  onNext={handleStepNext}
                  onSkip={handleStepNext}
                  continueLabel={isLastStep ? "Finish" : "Continue"}
                />
              )}
              {currentStep === "events" && (
                <EventsStep
                  events={suggestedEvents}
                  onNext={finish}
                  onSkip={finish}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;
