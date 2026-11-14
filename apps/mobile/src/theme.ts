import { Platform } from "react-native";

// Atlas identity: deep navy chrome, one vivid blue for actions and routes, and
// a lime signal reserved for the live moment (the next turn, progress, arrival).
export const lightTheme = {
  isDark: false,
  bg: "#F2F4F7",
  paper: "#FFFFFF",
  paperTranslucent: "rgba(255,255,255,0.94)",
  ink: "#0F1B2A",
  inkSecondary: "#3D4B5C",
  muted: "#5E6B7A",
  subtle: "#EEF1F5",
  /** Translucent fill for controls that sit on glass. */
  fill: "rgba(15,27,42,0.065)",
  line: "#DDE2E8",
  /** Matches the map canvas so the map can run under the system bars. */
  mapBg: "#E9EEF2",
  primary: "#2962F6",
  primaryText: "#FFFFFF",
  accent: "#2356E0",
  accentSoft: "#E6EEFF",
  chrome: "#0E2236",
  chromeRaised: "#1A3350",
  chromeText: "#FFFFFF",
  chromeMuted: "rgba(255,255,255,0.7)",
  lime: "#C8F45C",
  limeInk: "#16260A",
  sky: "#D7EEFA",
  skyInk: "#0C6890",
  foodSoft: "#FFE5C6",
  foodInk: "#A2540A",
  shoppingSoft: "#EADFFC",
  shoppingInk: "#6238BE",
  facilitySoft: "#D4F1DF",
  facilityInk: "#12734A",
  amber: "#8A5A00",
  amberSoft: "#FFF1D0",
  danger: "#C7303F",
  stop: "#D92D40",
  stopText: "#FFFFFF",
  shadow: "#0B2540",
};
export type Theme = typeof lightTheme;
export const darkTheme: Theme = {
  ...lightTheme,
  isDark: true,
  bg: "#0A1219",
  paper: "#16212B",
  paperTranslucent: "rgba(22,33,43,0.95)",
  ink: "#EEF3F8",
  inkSecondary: "#C2CCD8",
  muted: "#98A6B5",
  subtle: "#1F2C38",
  fill: "rgba(255,255,255,0.1)",
  line: "#2A3845",
  mapBg: "#0C151C",
  primary: "#5C8DFF",
  primaryText: "#081226",
  accent: "#8FB0FF",
  accentSoft: "#1C2F57",
  chrome: "#081521",
  chromeRaised: "#15293B",
  sky: "#1E4356",
  skyInk: "#92D8F6",
  foodSoft: "#503B25",
  foodInk: "#FFC88C",
  shoppingSoft: "#3B3263",
  shoppingInk: "#CFBBFF",
  facilitySoft: "#21473A",
  facilityInk: "#90E0B9",
  amber: "#F3C56B",
  amberSoft: "#3C321F",
  danger: "#FF98A3",
  stop: "#FF6B7A",
  stopText: "#3A070D",
  shadow: "#000000",
};

export const fonts = {
  /** SF Rounded on iOS. Other platforms keep their system face. */
  rounded: Platform.select({ ios: "ui-rounded", default: undefined }) as
    | string
    | undefined,
};

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 40,
};
export const radius = {
  bar: 2,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  sheet: 28,
  pill: 999,
};
export const textSize = {
  caption: 12,
  footnote: 13,
  subhead: 15,
  body: 16,
  title: 20,
  heading: 24,
  display: 34,
};
export const shadows = {
  soft: {
    shadowColor: "#0B2540",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  medium: {
    shadowColor: "#0B2540",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  strong: {
    shadowColor: "#0B2540",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};
