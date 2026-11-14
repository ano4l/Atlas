import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: config.name ?? "Atlas",
    slug: config.slug ?? "indoor-navigation-mobile",
    plugins: [
      ...(config.plugins ?? []),
      ["expo-sensors", { motionPermission: "Allow Atlas to record motion when you start a walk test." }],
      ["expo-camera", {
        cameraPermission: "Allow Atlas to scan a printed navigation checkpoint.",
        microphonePermission: false,
        recordAudioAndroid: false,
      }],
    ],
  };
};
