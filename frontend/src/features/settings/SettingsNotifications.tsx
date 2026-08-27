import { useEffect } from "react";
import { useGlobalStore } from "@/store/globalStore";
import { useUpdatePreferencesMutation } from "@/queryAndMutation/mutations/preferences-mutation";
import SettingsHeader from "./components/SettingsHeader";
import SettingsGroup from "./components/SettingsGroup";

const SettingsNotifications = () => {
  const { notificationsOn } = useGlobalStore();
  const { mutate: updatePreferences } = useUpdatePreferencesMutation();

  useEffect(() => {
    document.title = "Notifications";
  }, []);

  const toggleNotifications = () => {
    updatePreferences({ notificationsEnabled: !notificationsOn });
  };

  return (
    <div className="w-full max-w-2xl px-4 pb-10 md:px-6">
      <SettingsHeader title="Notifications" />

      <SettingsGroup heading="Push notifications">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium">Enable notifications</p>
            <p className="text-xs text-muted-foreground">
              Likes, comments, messages, and activity on your account.
            </p>
          </div>
          <label className="switch1 shrink-0">
            <input
              type="checkbox"
              checked={notificationsOn}
              onChange={toggleNotifications}
            />
            <span className="slider1"></span>
          </label>
        </div>
      </SettingsGroup>
    </div>
  );
};

export default SettingsNotifications;
