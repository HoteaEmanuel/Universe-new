import { useEffect } from "react";
import { FileText, Scroll } from "lucide-react";
import SettingsHeader from "./components/SettingsHeader";
import SettingsGroup from "./components/SettingsGroup";
import SettingsRow from "./components/SettingsRow";

const SettingsLegal = () => {
  useEffect(() => {
    document.title = "Legal";
  }, []);

  return (
    <div className="w-full max-w-2xl px-4 pb-10 md:px-6">
      <SettingsHeader title="Legal" />

      <SettingsGroup heading="Documents">
        <SettingsRow icon={FileText} label="Privacy Policy" to="/privacy-policy" />
        <SettingsRow icon={Scroll} label="Terms of Service" to="/terms-of-service" />
      </SettingsGroup>
    </div>
  );
};

export default SettingsLegal;
