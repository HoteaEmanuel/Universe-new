import { View, Text } from "react-native";
import { Link, type Href } from "expo-router";
import { authPalette } from "./authPalette";

type AuthSwitchLinkProps = {
  prompt: string;
  actionLabel: string;
  href: Href;
};

const AuthSwitchLink = ({ prompt, actionLabel, href }: AuthSwitchLinkProps) => {
  return (
    <View style={{ marginTop: 20, flexDirection: "row", justifyContent: "center", gap: 6 }}>
      <Text style={{ fontSize: 13, color: authPalette.textMuted }}>{prompt}</Text>
      <Link href={href}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: authPalette.link }}>
          {actionLabel}
        </Text>
      </Link>
    </View>
  );
};

export default AuthSwitchLink;
