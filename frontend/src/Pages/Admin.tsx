import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, ChevronRight, Flag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BusinessRegistrationsPanel from "@/features/admin/BusinessRegistrationsPanel";
import UserManagementPanel from "@/features/admin/UserManagementPanel";
import ReportsQueuePanel from "@/features/admin/ReportsQueuePanel";
import AdminStatsOverview from "@/features/admin/AdminStatsOverview";
import AdminActivityCharts from "@/features/admin/AdminActivityCharts";
import AdminUniversityChart from "@/features/admin/AdminUniversityChart";
import { useGetAdminStatsQuery } from "@/queryAndMutation/queries/admin-queries";

const Admin = () => {
  useEffect(() => {
    document.title = "Admin dashboard · Universe";
  }, []);

  const navigate = useNavigate();
  const [managementTab, setManagementTab] = useState("users");
  const { data: stats } = useGetAdminStatsQuery();
  const pendingRegistrations = stats?.pendingBusinessRegistrations ?? 0;
  const pendingReports = stats?.pendingReports ?? 0;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 py-6 md:px-6 md:py-10">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
            <span className="text-sm font-semibold">Universe administration</span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review access decisions, monitor account health, and understand campus activity.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/home")}>
          <ArrowLeft className="size-4" />
          Back to Universe
        </Button>
      </header>

      <section aria-labelledby="action-needed-heading" className="flex flex-col gap-3">
        <div>
          <h2 id="action-needed-heading" className="font-heading text-xl font-semibold">
            Action needed
          </h2>
          <p className="text-sm text-muted-foreground">Items waiting for an administrator.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setManagementTab("registrations");
            document.getElementById("admin-management")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="group h-auto min-h-20 w-full justify-start gap-4 rounded-xl bg-primary/8 p-4 text-left hover:bg-primary/12"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Business registrations</span>
            <span className="block text-sm text-muted-foreground">
              {pendingRegistrations === 0
                ? "The review queue is clear."
                : `${pendingRegistrations.toLocaleString()} ${pendingRegistrations === 1 ? "request needs" : "requests need"} review.`}
            </span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setManagementTab("reports");
            document.getElementById("admin-management")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="group h-auto min-h-20 w-full justify-start gap-4 rounded-xl bg-destructive/8 p-4 text-left hover:bg-destructive/12"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
            <Flag className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Content reports</span>
            <span className="block text-sm text-muted-foreground">
              {pendingReports === 0
                ? "The report queue is clear."
                : `${pendingReports.toLocaleString()} pending ${pendingReports === 1 ? "report needs" : "reports need"} review.`}
            </span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Button>
      </section>

      <AdminStatsOverview />

      <section id="admin-management" className="scroll-mt-6 flex flex-col gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">Management</h2>
          <p className="text-sm text-muted-foreground">Review people and account access.</p>
        </div>
        <Tabs value={managementTab} onValueChange={setManagementTab}>
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="users">User management</TabsTrigger>
            <TabsTrigger value="registrations">
              Business registrations
              {pendingRegistrations > 0 && (
                <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs tabular-nums text-primary-foreground">
                  {pendingRegistrations}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports">
              Reports
              {pendingReports > 0 && (
                <span className="ml-2 rounded-full bg-destructive px-1.5 py-0.5 text-xs tabular-nums text-destructive-foreground">
                  {pendingReports}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="">
              <CardContent className="">
                <UserManagementPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registrations">
            <Card className="">
              <CardContent className="">
                <BusinessRegistrationsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="">
              <CardContent className="">
                <ReportsQueuePanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="insights-heading">
        <div>
          <h2 id="insights-heading" className="font-heading text-xl font-semibold">Campus insights</h2>
          <p className="text-sm text-muted-foreground">Recent participation and community distribution.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AdminActivityCharts />
        </div>
        <AdminUniversityChart />
      </section>
    </div>
  );
};

export default Admin;
