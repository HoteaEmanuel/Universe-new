import telescopeStarsIllustration from "@/assets/explore-empty-state/telescope-stars.webp";

type IllustrationProps = {
  className?: string;
};

// Shared "searching" motif tying the empty-state family together.
const SearchMark = () => (
  <>
    <circle
      cx="118"
      cy="108"
      r="14"
      strokeWidth="3"
      strokeDasharray="4 3"
      className="stroke-primary"
      fill="none"
    />
    <line
      x1="128"
      y1="118"
      x2="141"
      y2="131"
      strokeWidth="4"
      strokeLinecap="round"
      className="stroke-primary"
    />
  </>
);

export const NoPeopleIllustration = ({ className }: IllustrationProps) => (
  <svg viewBox="0 0 160 150" fill="none" className={className}>
    <circle cx="78" cy="68" r="56" className="fill-muted" />
    <circle
      cx="60"
      cy="55"
      r="13"
      strokeWidth="3"
      className="stroke-muted-foreground"
      fill="none"
    />
    <path
      d="M40 90c0-13 9-22 20-22s20 9 20 22"
      strokeWidth="3"
      strokeLinecap="round"
      className="stroke-muted-foreground"
      fill="none"
    />
    <circle
      cx="94"
      cy="50"
      r="10"
      strokeWidth="3"
      className="stroke-muted-foreground/50"
      fill="none"
    />
    <path
      d="M78 82c0-10 7-17 16-17s16 7 16 17"
      strokeWidth="3"
      strokeLinecap="round"
      className="stroke-muted-foreground/50"
      fill="none"
    />
    <SearchMark />
  </svg>
);

export const NoPostsIllustration = ({ className }: IllustrationProps) => (
  <svg viewBox="0 0 160 150" fill="none" className={className}>
    <circle cx="78" cy="68" r="56" className="fill-muted" />
    <rect
      x="44"
      y="35"
      width="62"
      height="48"
      rx="6"
      strokeWidth="3"
      className="stroke-muted-foreground"
      fill="none"
    />
    <line
      x1="54"
      y1="50"
      x2="96"
      y2="50"
      strokeWidth="3"
      strokeLinecap="round"
      className="stroke-muted-foreground"
    />
    <line
      x1="54"
      y1="61"
      x2="86"
      y2="61"
      strokeWidth="3"
      strokeLinecap="round"
      className="stroke-muted-foreground/50"
    />
    <line
      x1="54"
      y1="72"
      x2="90"
      y2="72"
      strokeWidth="3"
      strokeLinecap="round"
      className="stroke-muted-foreground/50"
    />
    <SearchMark />
  </svg>
);

export const NoGroupsIllustration = ({ className }: IllustrationProps) => (
  <svg viewBox="0 0 160 150" fill="none" className={className}>
    <circle cx="78" cy="68" r="56" className="fill-muted" />
    <circle
      cx="58"
      cy="62"
      r="18"
      strokeWidth="3"
      className="stroke-muted-foreground/50"
      fill="none"
    />
    <circle
      cx="83"
      cy="54"
      r="18"
      strokeWidth="3"
      className="stroke-muted-foreground"
      fill="none"
    />
    <circle
      cx="76"
      cy="80"
      r="18"
      strokeWidth="3"
      className="stroke-muted-foreground/30"
      fill="none"
    />
    <SearchMark />
  </svg>
);

export const NoResultsIllustration = ({ className }: IllustrationProps) => (
  <svg viewBox="0 0 160 150" fill="none" className={className}>
    <circle cx="78" cy="68" r="56" className="fill-muted" />
    <circle cx="45" cy="40" r="3" className="fill-muted-foreground/40" />
    <circle cx="112" cy="48" r="4" className="fill-muted-foreground/30" />
    <circle cx="52" cy="98" r="3" className="fill-muted-foreground/30" />
    <circle
      cx="76"
      cy="66"
      r="24"
      strokeWidth="4"
      className="stroke-primary"
      fill="none"
    />
    <line
      x1="93"
      y1="83"
      x2="110"
      y2="100"
      strokeWidth="5"
      strokeLinecap="round"
      className="stroke-primary"
    />
  </svg>
);

export const NoNewsIllustration = ({ className }: IllustrationProps) => (
  <svg viewBox="0 0 160 150" fill="none" className={className}>
    <circle cx="78" cy="68" r="56" className="fill-muted" />
    <path
      d="M46 40h48l14 14v42a4 4 0 0 1-4 4H50a4 4 0 0 1-4-4V40Z"
      strokeWidth="3"
      strokeLinejoin="round"
      className="stroke-muted-foreground"
      fill="none"
    />
    <path
      d="M94 40v14h14"
      strokeWidth="3"
      strokeLinejoin="round"
      className="stroke-muted-foreground"
      fill="none"
    />
    <line
      x1="54"
      y1="68"
      x2="86"
      y2="68"
      strokeWidth="3"
      strokeLinecap="round"
      className="stroke-muted-foreground/50"
    />
    <line
      x1="54"
      y1="78"
      x2="86"
      y2="78"
      strokeWidth="3"
      strokeLinecap="round"
      className="stroke-muted-foreground/50"
    />
    <line
      x1="54"
      y1="88"
      x2="74"
      y2="88"
      strokeWidth="3"
      strokeLinecap="round"
      className="stroke-muted-foreground/50"
    />
    <SearchMark />
  </svg>
);

export const ExploreHeaderAccent = ({ className }: IllustrationProps) => (
  <svg viewBox="0 0 200 60" fill="none" className={className}>
    <line
      x1="10"
      y1="42"
      x2="68"
      y2="16"
      strokeWidth="1.5"
      className="stroke-border"
    />
    <line
      x1="68"
      y1="16"
      x2="128"
      y2="32"
      strokeWidth="1.5"
      className="stroke-border"
    />
    <line
      x1="128"
      y1="32"
      x2="185"
      y2="12"
      strokeWidth="1.5"
      className="stroke-border"
    />
    <circle cx="10" cy="42" r="4" className="fill-primary/40" />
    <circle cx="68" cy="16" r="5" className="fill-primary/70" />
    <circle cx="128" cy="32" r="4" className="fill-muted-foreground/40" />
    <circle cx="185" cy="12" r="6" className="fill-primary" />
  </svg>
);
