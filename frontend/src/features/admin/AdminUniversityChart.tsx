import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  useGetAdminStatsQuery,
  useGetTopUniversitiesQuery,
} from "@/queryAndMutation/queries/admin-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  count: { label: "Students", color: "var(--primary)" },
};

const ROW_HEIGHT = 32;

const AdminUniversityChart = () => {
  const { data, isPending } = useGetTopUniversitiesQuery();
  const { data: stats } = useGetAdminStatsQuery();
  const totalUsers = stats?.totalUsers ?? 0;

  if (isPending) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="">
        <CardHeader className="">
          <CardTitle className="">Top universities</CardTitle>
        </CardHeader>
        <CardContent className="">
          <p className="py-6 text-center text-sm text-muted-foreground">
            No university data yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="">
      <CardHeader className="">
        <CardTitle className="">Top universities by users</CardTitle>
      </CardHeader>
      <CardContent className="">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto w-full"
          style={{ height: Math.max(data.length * ROW_HEIGHT, 160) }}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 24, top: 4, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="university"
              type="category"
              tickLine={false}
              axisLine={false}
              width={140}
              tick={{ fill: "var(--muted-foreground)" }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} barSize={18}>
              <LabelList
                dataKey="count"
                position="right"
                className="fill-foreground"
                fontSize={12}
                formatter={(count: string | number | boolean | null | undefined) => {
                  const value = Number(count) || 0;
                  const share = totalUsers > 0 ? (value / totalUsers) * 100 : 0;
                  return `${value.toLocaleString()} (${share > 0 && share < 1 ? "<1" : share.toFixed(0)}%)`;
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AdminUniversityChart;
