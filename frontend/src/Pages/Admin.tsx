import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BusinessRegistrationsPanel from "@/features/admin/BusinessRegistrationsPanel";
import UserManagementPanel from "@/features/admin/UserManagementPanel";
import AdminStatsOverview from "@/features/admin/AdminStatsOverview";
import AdminActivityCharts from "@/features/admin/AdminActivityCharts";
import AdminUniversityChart from "@/features/admin/AdminUniversityChart";

const Admin = () => {
  useEffect(() => {
    document.title = "Admin Page";
  }, []);

  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage business account approvals and user access.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/home")}>
          <ArrowLeft className="size-4" />
          Back home
        </Button>
      </div>

      <AdminStatsOverview />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Activity trends</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AdminActivityCharts />
        </div>
        <AdminUniversityChart />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Management</h2>
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">User management</TabsTrigger>
            <TabsTrigger value="registrations">Business registrations</TabsTrigger>
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
        </Tabs>
      </section>
    </div>
  );
};

export default Admin;
