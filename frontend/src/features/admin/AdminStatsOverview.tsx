import { ShieldOff, Users, UserPlus, Building2, FileText, UsersRound, CalendarDays } from "lucide-react";
import { useGetAdminStatsQuery } from "@/queryAndMutation/queries/admin-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type StatTileProps = {
  label: string;
  value: number;
  icon: React.ElementType;
};

const StatTile = ({ label, value, icon: Icon }: StatTileProps) => (
  <Card className="">
    <CardContent className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl leading-none font-semibold tabular-nums">{value.toLocaleString()}</p>
        <p className="truncate text-sm text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const CommunityMetric = ({ label, value, icon: Icon }: StatTileProps) => (
  <div className="flex items-center gap-3">
    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    <div className="min-w-0">
      <p className="font-semibold tabular-nums">{value.toLocaleString()}</p>
      <p className="truncate text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

const AdminStatsOverview = () => {
  const { data: stats, isPending, isError, refetch } = useGetAdminStatsQuery();

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="rounded-xl bg-destructive/8 p-4 text-sm">
        <p className="font-medium">Platform health could not be loaded.</p>
        <button className="mt-1 font-semibold text-primary underline underline-offset-4" onClick={() => refetch()}>Try again</button>
      </div>
    );
  }

  const blockedShare = stats.totalUsers > 0 ? stats.blockedUsers / stats.totalUsers : 0;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="platform-health-heading">
      <div>
        <h2 id="platform-health-heading" className="font-heading text-xl font-semibold">Platform health</h2>
        <p className="text-sm text-muted-foreground">The signals that need regular administrative attention.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Active users" value={stats.activeUsers} icon={Users} />
        <StatTile label="New this week" value={stats.newUsersThisWeek} icon={UserPlus} />
        <StatTile label="Pending reviews" value={stats.pendingBusinessRegistrations} icon={Building2} />
        <StatTile label="Blocked accounts" value={stats.blockedUsers} icon={ShieldOff} />
      </div>
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Community totals</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-4">
          <CommunityMetric label="Total posts" value={stats.totalPosts} icon={FileText} />
          <CommunityMetric label="Groups" value={stats.totalGroups} icon={UsersRound} />
          <CommunityMetric label="Events" value={stats.totalEvents} icon={CalendarDays} />
          <CommunityMetric label="Business accounts" value={stats.businessAccounts} icon={Building2} />
        </div>
      </section>
      <p className="text-sm text-muted-foreground">
        Blocked-account share: <span className="font-semibold tabular-nums text-foreground">{(blockedShare * 100).toFixed(blockedShare > 0 && blockedShare < 0.01 ? 1 : 0)}%</span> ({stats.blockedUsers.toLocaleString()} of {stats.totalUsers.toLocaleString()})
      </p>
    </section>
  );
};

export default AdminStatsOverview;
