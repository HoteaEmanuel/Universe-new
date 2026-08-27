import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  LogOut,
  Palette,
  Scale,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useGlobalStore } from "@/store/globalStore";
import UserAvatar from "@/components/UserAvatar";
import { getFullName } from "@/utils/fullName";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SettingsGroup from "./components/SettingsGroup";
import SettingsRow from "./components/SettingsRow";

const SettingsHome = () => {
  const { user, logOut } = useAuthStore();
  const { theme, notificationsOn } = useGlobalStore();
  const [confirmLogOut, setConfirmLogOut] = useState(false);

  useEffect(() => {
    document.title = "Settings";
  }, []);

  return (
    <div className="w-full max-w-2xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="mb-6 font-heading text-2xl font-semibold">Settings</h1>

      <Link
        to="/settings/account"
        className="hoverGray mb-6 flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-colors"
      >
        <UserAvatar user={user} className="size-14" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-semibold">
            {getFullName(user)}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {user?.username ? `@${user.username}` : user?.email}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      <SettingsGroup heading="Preferences">
        <SettingsRow
          icon={Bell}
          label="Notifications"
          to="/settings/notifications"
          trailing={notificationsOn ? "On" : "Off"}
        />
        <SettingsRow
          icon={Palette}
          label="Appearance"
          to="/settings/appearance"
          trailing={theme === "dark" ? "Dark" : "Light"}
        />
      </SettingsGroup>

      <SettingsGroup heading="Privacy">
        <SettingsRow
          icon={ShieldCheck}
          label="Privacy & Safety"
          description="Blocked accounts"
          to="/settings/privacy"
        />
      </SettingsGroup>

      <SettingsGroup heading="Account">
        <SettingsRow
          icon={User}
          label="Account"
          description="Password, delete account"
          to="/settings/account"
        />
      </SettingsGroup>

      <SettingsGroup heading="About">
        <SettingsRow icon={Scale} label="Legal" to="/settings/legal" />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          icon={LogOut}
          label="Log out"
          danger
          onClick={() => setConfirmLogOut(true)}
        />
      </SettingsGroup>

      <p className="px-1 text-center text-xs text-muted-foreground">
        Universe
      </p>

      <AlertDialog open={confirmLogOut} onOpenChange={setConfirmLogOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmLogOut(false);
                logOut();
              }}
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsHome;
