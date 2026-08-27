import { useEffect, useState } from "react";
import { Trash2, UserCog } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import SettingsHeader from "./components/SettingsHeader";
import SettingsGroup from "./components/SettingsGroup";
import SettingsRow from "./components/SettingsRow";
import ChangePasswordForm from "./components/ChangePasswordForm";
import DeleteAccountDialog from "./components/DeleteAccountDialog";

const SettingsAccount = () => {
  const { user } = useAuthStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const hasPassword = !user?.googleId;

  useEffect(() => {
    document.title = "Account";
  }, []);

  return (
    <div className="w-full max-w-2xl px-4 pb-10 md:px-6">
      <SettingsHeader title="Account" />

      <SettingsGroup heading="Profile">
        <SettingsRow
          icon={UserCog}
          label="Edit profile"
          description="Name, username, bio, and photo"
          to="/profile/edit-profile"
        />
      </SettingsGroup>

      <SettingsGroup heading="Password">
        {hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <p className="px-4 py-4 text-sm text-muted-foreground">
            Your account signs in with Google, so there's no password to
            change here.
          </p>
        )}
      </SettingsGroup>

      <SettingsGroup heading="Danger zone">
        <SettingsRow
          icon={Trash2}
          label="Delete account"
          description="Permanently remove your account and all its data"
          danger
          onClick={() => setDeleteDialogOpen(true)}
        />
      </SettingsGroup>

      <DeleteAccountDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
    </div>
  );
};

export default SettingsAccount;
