import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  return {
    ...config,
    name: config.name ?? "Atlas",
    slug: config.slug ?? "indoor-navigation-mobile",
    android: {
      ...config.android,
      ...(apiKey
        ? { config: { ...config.android?.config, googleMaps: { apiKey } } }
        : {}),
    },
  };
};
