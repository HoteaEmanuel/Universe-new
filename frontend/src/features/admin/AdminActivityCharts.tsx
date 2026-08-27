import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { AiOutlineRise } from "react-icons/ai";
import { useGetDailyActivityQuery } from "@/queryAndMutation/queries/admin-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const usersChartConfig = {
  newUsers: { label: "New users", color: "var(--primary)" },
};

const postsChartConfig = {
  newPosts: { label: "New posts", color: "oklch(0.6 0.15 240)" },
};

const formatDayLabel = (date: string) => {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

type TrendCardProps = {
  title: string;
  data: { date: string; value: number }[];
  dataKey: string;
  config: Record<string, { label: string; color: string }>;
};

const TrendCard = ({ title, data, dataKey, config }: TrendCardProps) => {
  const total = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <Card className="">
      <CardHeader className="">
        <CardTitle className="">{title}</CardTitle>
        <p className="flex items-center gap-1.5 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          <AiOutlineRise className="size-7" aria-hidden="true" />
          {compactNumberFormatter.format(total)}
        </p>
      </CardHeader>
      <CardContent className="">
        <ChartContainer config={config} className="aspect-auto h-48 w-full">
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config[dataKey].color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={config[dataKey].color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={formatDayLabel}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value: string) => formatDayLabel(value)}
                />
              }
            />
            <Area
              dataKey="value"
              name={dataKey}
              type="monotone"
              fill={`url(#fill-${dataKey})`}
              stroke={config[dataKey].color}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

const AdminActivityCharts = () => {
  const { data, isPending } = useGetDailyActivityQuery();

  if (isPending) {
    return (
      <>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </>
    );
  }

  if (!data) return null;

  const userSeries = data.map((row) => ({ date: row.date, value: row.newUsers }));
  const postSeries = data.map((row) => ({ date: row.date, value: row.newPosts }));

  return (
    <>
      <TrendCard
        title="New users (last 14 days)"
        data={userSeries}
        dataKey="newUsers"
        config={usersChartConfig}
      />
      <TrendCard
        title="New posts (last 14 days)"
        data={postSeries}
        dataKey="newPosts"
        config={postsChartConfig}
      />
    </>
  );
};

export default AdminActivityCharts;
