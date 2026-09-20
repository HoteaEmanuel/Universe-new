export default {
  expo: {
    name: "mobile-app",
    slug: "mobile-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    scheme: "mobileapp",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mobileapp",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.mobileapp",
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-secure-store",
    ],
    extra: {
      googleAndroidClientId:
        "788808129281-4qdarn8rd35qimaiaq438bc7iq2cs96a.apps.googleusercontent.com",
      googleIosClientId:
        "788808129281-on2jplq5hc5li0h0bu23lhna7vb5buta.apps.googleusercontent.com",
      googleWebClientId:
        "788808129281-mdg03bvui7o1biuf005t91ng5ofpml4u.apps.googleusercontent.com",
      API_URL: "https://nongerundively-vatic-manie.ngrok-free.dev/api",
      "eas": {
        "projectId": "bf4d1d00-f474-4ea5-8390-93fcc0ac119c"
      }
    },
  },
};
