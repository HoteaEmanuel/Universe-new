type OnboardingIllustrationProps = {
  src: string;
  alt: string;
  size?: "default" | "compact";
};

const SIZE_CLASSES: Record<NonNullable<OnboardingIllustrationProps["size"]>, string> = {
  default: "size-40 sm:size-44",
  compact: "size-24",
};

const OnboardingIllustration = ({
  src,
  alt,
  size = "default",
}: OnboardingIllustrationProps) => {
  return (
    <div className="relative mx-auto">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-[28px] bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.35),transparent_55%),radial-gradient(circle_at_75%_75%,rgba(124,58,237,0.4),transparent_60%)] blur-lg"
      />
      <div
        className={`overflow-hidden rounded-[28px] ring-1 ring-black/5 shadow-[0_18px_36px_-18px_rgba(124,58,237,0.55)] dark:ring-white/10 ${SIZE_CLASSES[size]}`}
      >
        <img src={src} alt={alt} className="size-full object-cover" />
      </div>
    </div>
  );
};

export default OnboardingIllustration;
