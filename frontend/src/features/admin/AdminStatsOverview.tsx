import {
  ShieldOff,
  ShieldCheck,
  Users,
  UserPlus,
  Building2,
  FileText,
  UsersRound,
  CalendarDays,
} from "lucide-react";
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
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl leading-none font-semibold">{value.toLocaleString()}</p>
        <p className="truncate text-sm text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const AdminStatsOverview = () => {
  const { data: stats, isPending } = useGetAdminStatsQuery();

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const blockedShare = stats.totalUsers > 0 ? stats.blockedUsers / stats.totalUsers : 0;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Platform overview</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Total users" value={stats.totalUsers} icon={Users} />
          <StatTile label="New this week" value={stats.newUsersThisWeek} icon={UserPlus} />
          <StatTile label="Total posts" value={stats.totalPosts} icon={FileText} />
          <StatTile label="Groups" value={stats.totalGroups} icon={UsersRound} />
          <StatTile label="Events" value={stats.totalEvents} icon={CalendarDays} />
          <StatTile
            label="Business accounts"
            value={stats.businessAccounts}
            icon={Building2}
          />
          <StatTile
            label="Pending registrations"
            value={stats.pendingBusinessRegistrations}
            icon={Building2}
          />
          <StatTile label="Blocked users" value={stats.blockedUsers} icon={ShieldOff} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Account health</h2>
        <Card className="">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-4" />
                {stats.activeUsers.toLocaleString()} active
              </span>
              <span className="flex items-center gap-1.5 font-medium text-destructive">
                <ShieldOff className="size-4" />
                {stats.blockedUsers.toLocaleString()} blocked
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-500/20">
              <div
                className="h-full rounded-full bg-destructive transition-[width]"
                style={{ width: `${Math.min(blockedShare * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AdminStatsOverview;
