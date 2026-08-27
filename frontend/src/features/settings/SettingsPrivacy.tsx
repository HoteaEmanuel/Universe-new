import { useEffect } from "react";
import SettingsHeader from "./components/SettingsHeader";
import SettingsGroup from "./components/SettingsGroup";
import BlockedUsersList from "@/features/chat/components/BlockedUsersList";

const SettingsPrivacy = () => {
  useEffect(() => {
    document.title = "Privacy & Safety";
  }, []);

  return (
    <div className="w-full max-w-2xl px-4 pb-10 md:px-6">
      <SettingsHeader title="Privacy & Safety" />

      <SettingsGroup heading="Blocked accounts">
        <div className="px-2 pb-2">
          <BlockedUsersList
            emptyMessage="You haven't blocked anyone. Blocked accounts can't message you or see your activity."
          />
        </div>
      </SettingsGroup>
    </div>
  );
};

export default SettingsPrivacy;
