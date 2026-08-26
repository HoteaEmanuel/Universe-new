import { Link, useNavigate } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import notFoundIllustration from "@/assets/404-event-horizon.webp";
import "@/stars.css";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="dot-pattern" />
      <div className="star-layer absolute inset-0 -z-10">
        <div id="stars" />
        <div id="stars2" />
        <div id="stars3" />
      </div>
      <div className="nebula-glow" />

      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <div className="relative flex w-full items-center justify-center">
          <div className="absolute size-80 rounded-full bg-primary/20 blur-3xl dark:bg-primary/30 sm:size-128" />
          <img
            src={notFoundIllustration}
            alt="An astronaut slipping past the edge of a 404 event horizon"
            className="animate-float relative w-full max-w-md sm:max-w-2xl"
          />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Lost in space
          </h1>
          <p className="max-w-md text-lg text-balance text-muted-foreground">
            This page drifted off into the void. Let&apos;s get you back to
            known territory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "h-11 px-6 text-base",
            )}
          >
            Go back
          </button>
          <Link
            to="/"
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-8 text-base")}
          >
            Take me home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
