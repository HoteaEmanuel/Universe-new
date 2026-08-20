import { Sparkles } from "lucide-react";
import mainPhoto from "../../assets/auth-collage-main.png";
import cafePhoto from "../../assets/auth-collage-cafe.png";
import walkPhoto from "../../assets/auth-collage-walk.png";
import celebrationPhoto from "../../assets/auth-collage-celebration.png";
import gameNightPhoto from "../../assets/auth-collage-gamenight.png";
import partyPhoto from "../../assets/auth-collage-party.png";
import graduationPhoto from "../../assets/auth-collage-graduation.png";
import boyGirlPhoto from "../../assets/auth-collage-boygirl.png";

type AuthImagePanelProps = {
  variant: "login" | "signup";
};

type Placement = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
};

type EmojiSticker = Placement & {
  kind: "emoji";
  content: string;
  size: string;
  rotate: string;
  delay: string;
};

type CommentSticker = Placement & {
  kind: "comment";
  content: string;
  rotate: string;
  delay: string;
  tone: "light" | "warm";
  tailDir: "up" | "down";
  tailSide: "left" | "right";
};

type Sticker = EmojiSticker | CommentSticker;

const COLLAGE_PHOTOS: Record<
  AuthImagePanelProps["variant"],
  { main: string; backLeft: string; backRight: string; accent: string }
> = {
  // Quieter, familiar moments — "right where you left off" — with two big milestones
  login: {
    main: cafePhoto,
    backLeft: graduationPhoto,
    backRight: boyGirlPhoto,
    accent: gameNightPhoto,
  },
  // Bigger, more social energy — "join your course community"
  signup: {
    main: mainPhoto,
    backLeft: walkPhoto,
    backRight: celebrationPhoto,
    accent: partyPhoto,
  },
};

const STICKERS: Record<AuthImagePanelProps["variant"], Sticker[]> = {
  login: [
    {
      kind: "emoji",
      content: "🥹",
      top: "-4%",
      left: "0%",
      size: "2.5rem",
      rotate: "-12deg",
      delay: "0s",
    },
    {
      kind: "comment",
      content: "so real",
      top: "0%",
      right: "-4%",
      rotate: "6deg",
      delay: "0.9s",
      tone: "light",
      tailDir: "down",
      tailSide: "right",
    },
    {
      kind: "comment",
      content: "miss this crew",
      bottom: "16%",
      left: "-11%",
      rotate: "-5deg",
      delay: "1.6s",
      tone: "warm",
      tailDir: "up",
      tailSide: "left",
    }
  ],
  signup: [
    {
      kind: "emoji",
      content: "🎉",
      top: "-4%",
      right: "0%",
      size: "2.6rem",
      rotate: "12deg",
      delay: "0.3s",
    },
    {
      kind: "comment",
      content: "new bestie unlocked",
      top: "2%",
      left: "-9%",
      rotate: "-6deg",
      delay: "1.1s",
      tone: "warm",
      tailDir: "down",
      tailSide: "left",
    },
    {
      kind: "comment",
      content: "us",
      bottom: "14%",
      right: "-11%",
      rotate: "5deg",
      delay: "1.9s",
      tone: "light",
      tailDir: "up",
      tailSide: "right",
    },
    {
      kind: "emoji",
      content: "❤️",
      bottom: "-3%",
      left: "2%",
      size: "1.9rem",
      rotate: "-11deg",
      delay: "2.5s",
    },
    {
      kind: "emoji",
      content: "🤞",
      bottom: "0%",
      right: "-4%",
      size: "1.6rem",
      rotate: "-9deg",
      delay: "3s",
    },
  ],
};

const AuthImagePanel = ({ variant }: AuthImagePanelProps) => {
  const isSignup = variant === "signup";
  const photos = COLLAGE_PHOTOS[variant];

  return (
    <div className="hidden lg:flex lg:w-1/2 lg:flex-none relative overflow-hidden auth-hero-bg">
      <div className="auth-panel-content">
        <div className="auth-collage">
          <img
            src={photos.backLeft}
            alt=""
            className="auth-collage-photo back-left"
          />
          <img
            src={photos.backRight}
            alt=""
            className="auth-collage-photo back-right"
          />
          <img
            src={photos.accent}
            alt=""
            className="auth-collage-photo accent"
          />
          <img src={photos.main} alt="" className="auth-collage-photo main" />

          {STICKERS[variant].map((s, i) => (
            <span
              key={i}
              className="auth-collage-sticker-wrap"
              style={{
                top: s.top,
                left: s.left,
                right: s.right,
                bottom: s.bottom,
                transform: `rotate(${s.rotate})`,
              }}
              aria-hidden="true"
            >
              {s.kind === "emoji" ? (
                <span
                  className="auth-collage-sticker auth-collage-emoji"
                  style={{ fontSize: s.size, animationDelay: s.delay }}
                >
                  {s.content}
                </span>
              ) : (
                <span
                  className={`auth-collage-sticker auth-collage-comment bubble-${s.tone} tail-${s.tailDir} tail-${s.tailSide}`}
                  style={{ animationDelay: s.delay }}
                >
                  {s.content}
                </span>
              )}
            </span>
          ))}
        </div>

        <div className="auth-copy">
          <p className="auth-tagline">
            {isSignup ? (
              <>
                Join your <em>course community</em>.
              </>
            ) : (
              <>
                Right where <em>you left off</em>.
              </>
            )}
          </p>
          <p className="auth-panel-caption">
            {isSignup
              ? "The friends, classmates, and study crew that make campus feel like home."
              : "Your friends, your group chats, your people — right where you left them."}
          </p>

          <span className="auth-accent-chip">
            <Sparkles size={12} />
            {isSignup
              ? "12,000+ students already in"
              : "New notifications waiting"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthImagePanel;
