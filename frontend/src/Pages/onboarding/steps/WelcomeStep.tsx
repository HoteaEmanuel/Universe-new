import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFullName } from "@/utils/fullName";
import type { ProfileUser } from "@/features/profile/types";
import OnboardingIllustration from "../OnboardingIllustration";
import welcomeIllustration from "@/assets/onboarding/welcome.webp";

type WelcomeStepProps = {
  user: ProfileUser;
  onNext: () => void;
};

const WelcomeStep = ({ user, onNext }: WelcomeStepProps) => {
  const firstName = user.firstName || getFullName(user).split(" ")[0];
  const greeting = firstName ? `Hey ${firstName}` : "Hey there";

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <OnboardingIllustration
        src={welcomeIllustration}
        alt="An illustrated student waving hello"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black sm:text-3xl">
          <span className="heading-text-1">
            {greeting}, welcome to Universe!
          </span>{" "}
          👋
        </h1>
        <p className="max-w-sm text-base font-medium text-foreground/80">
          You're officially in! Let's get your profile glowing so your
          people can find you before you dive into the feed.
        </p>
        <p className="text-xs font-semibold text-primary">
          Just a couple of quick steps ⚡ — you'll be done in under a minute.
        </p>
      </div>
      <Button size="lg" className="h-11 w-full max-w-xs" onClick={onNext}>
        Let's go
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
};

export default WelcomeStep;
