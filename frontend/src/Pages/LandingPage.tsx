import { Link } from "react-router-dom";
import { Users, CalendarDays, Sparkles, type LucideIcon } from "lucide-react";
import logo from "../assets/logo_1.png";
import group_image from "../assets/alta_imagine.png";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import "../stars.css";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Users,
    title: "Find your community",
    description: "Connect with clubs, classmates and people who share your interests.",
  },
  {
    icon: CalendarDays,
    title: "Never miss an event",
    description: "Campus events, meetups and deadlines, all in one place.",
  },
  {
    icon: Sparkles,
    title: "Share experiences",
    description: "Post moments from campus life and see what everyone's up to.",
  },
];

const LandingPage = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="dot-pattern" />
      <div className="star-layer absolute inset-0 -z-10">
        <div id="stars" />
        <div id="stars2" />
        <div id="stars3" />
      </div>
      <div className="nebula-glow" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <img src={logo} className="h-10 w-10" alt="Universe logo" />
          <span className="kaushan text-2xl font-semibold heading-text-1">Universe'</span>
        </div>
        <Link
          to={"/login"}
          className="text-sm font-semibold text-foreground/80 hover:text-foreground hover:underline"
        >
          Log in
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 pt-10 pb-24 sm:px-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold tracking-wide text-primary uppercase dark:border-brand-300/40 dark:bg-brand-400/15 dark:text-brand-100">
            For university students
          </span>

          <h1 className="max-w-3xl text-5xl font-black heading-text-1 sm:text-6xl">
            Your campus, all in one place
          </h1>

          <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
            Find your community, keep up with every event, and share the
            experiences that make your university life yours.
          </p>

          <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row">
            <Link
              to={"/signup"}
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-8 text-base")}
            >
              Get started
            </Link>
            <Link
              to={"/login"}
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-11 px-8 text-base",
              )}
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border-border/60 bg-card/60 backdrop-blur-sm transition-colors hover:border-primary/40"
            >
              <CardContent className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-brand-400/15 dark:text-brand-100">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <img
          src={group_image}
          alt=""
          className="hidden w-full max-w-3xl rounded-3xl border border-border/60 shadow-lg md:block"
        />
      </main>
    </div>
  );
};

export default LandingPage;
