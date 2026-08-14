import { Link, useNavigate } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import notFoundIllustration from "@/assets/undraw_astronomy_ied1.svg";
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
        <div className="relative flex items-center justify-center">
          <div className="absolute size-72 rounded-full bg-primary/20 blur-3xl dark:bg-primary/30 sm:size-96" />
          <div className="animate-float relative rounded-[3rem] border border-violet-100 bg-white p-6 shadow-xl dark:border-transparent dark:bg-linear-to-br dark:from-violet-300 dark:to-violet-500 dark:shadow-[0_20px_60px_-15px_rgba(124,58,237,0.5)] sm:p-10">
            <img
              src={notFoundIllustration}
              alt=""
              className="w-full max-w-xs sm:max-w-sm"
            />
          </div>
        </div>

        <span className="gradient-text-light text-7xl leading-none sm:text-8xl">
          404
        </span>

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
