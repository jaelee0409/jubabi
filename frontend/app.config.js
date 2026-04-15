import fs from "fs";

export default ({ config }) => {
  const IS_DEV = process.env.APP_VARIANT === "development";
  const IS_PREVIEW = process.env.APP_VARIANT === "preview";

  // if (process.env.GOOGLE_SERVICE_INFO_PLIST) {
  //   fs.writeFileSync(
  //     "GoogleService-Info.plist",
  //     process.env.GOOGLE_SERVICE_INFO_PLIST
  //   );
  // }

  // TODO:
  // const getGoogleServices = () => {
  //   const path = "./google-services.json";
  //   let content = process.env.GOOGLE_SERVICES_JSON;

  //   if (!content) {
  //     throw new Error("Missing GOOGLE_SERVICES_JSON env var for this build!");
  //   }

  //   fs.writeFileSync(path, content);
  //   return path;
  // };

  const getUniqueIdentifier = () => {
    if (IS_DEV) {
      return "com.jaelee0409.jubabi.dev";
    }
    if (IS_PREVIEW) {
      return "com.jaelee0409.jubabi.preview";
    }

    return "com.jaelee0409.jubabi";
  };

  const getAppName = () => {
    if (IS_DEV) {
      return "주밥이 (Dev)";
    }
    if (IS_PREVIEW) {
      return "주밥이 (Preview)";
    }

    return "주밥이";
  };

  const getScheme = () => {
    if (IS_DEV) {
      return "jubabi-dev";
    }
    if (IS_PREVIEW) {
      return "jubabi-preview";
    }

    return "jubabi";
  };

  return {
    ...config,
    name: getAppName(),
    slug: "jubabi",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/_icon.png",
    scheme: getScheme(),
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      ...config.ios,
      supportsTablet: true,
      bundleIdentifier: getUniqueIdentifier(),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...config.android,
      adaptiveIcon: {
        foregroundImage: "./assets/images/_adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: getUniqueIdentifier(),
      googleServicesFile: "./google-services.json",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-build-properties",
      "expo-web-browser",
      "expo-font",
      "expo-secure-store",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "c8426bee-633e-4030-84ab-2e3b42c35c64",
      },
    },
    owner: "jaelee0409",
  };
};
