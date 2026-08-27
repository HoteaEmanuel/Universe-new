type CountBadgeProps = {
  count: number;
};

const CountBadge = ({ count }: CountBadgeProps) => (
  <div className="absolute -top-1.5 -right-2 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-primary-foreground">
    {count < 100 ? count : "99+"}
  </div>
);

export default CountBadge;
