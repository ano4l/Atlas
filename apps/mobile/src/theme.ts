// Atlas Mobile Design System Tokens
// Inspired by premium modern indoor cartography and mobile UI design standards.

export const lightTheme = {
  isDark: false,
  // Primary backgrounds & surfaces
  bg: "#F6F5F2",             // Soft warm off-white canvas
  paper: "#FFFFFF",          // Pure white surface
  paperTranslucent: "rgba(255, 255, 255, 0.92)",
  card: "#FFFFFF",
  cardBorder: "rgba(0, 0, 0, 0.06)",
  
  // Typography & Icons
  ink: "#111111",            // Crisp black primary text
  inkSecondary: "#52525B",   // Neutral charcoal text
  muted: "#8E8E93",          // Muted grey text & icons
  subtle: "#F2F1EC",         // Subtle pill/chip fill
  line: "#E5E5EA",           // Delicate divider line
  
  // Map Cartography
  mapBg: "#FAF9F5",          // Very light warm-grey map background
  mapPlate: "#FFFFFF",       // Soft white venue footprint
  mapConcourse: "#F5F4EF",   // Pale warm-grey corridor/concourse
  mapRoom: "#FAFAF7",        // Store/room background
  mapStroke: "#E2E0D8",      // Fine low-contrast outlines
  mapText: "#18181B",        // Store label color
  
  // Navigation & Accent Colors
  routeCasing: "#18181B",    // Thick dark route casing
  routeStart: "#FF6B00",     // Warm orange start
  routeMiddle: "#FF3B70",    // Coral pink transition
  routeViolet: "#8B5CF6",    // Violet accent
  routeEnd: "#3B82F6",       // Sky blue destination accent
  
  // Functional Accents
  primary: "#111111",        // Main CTA button fill
  primaryText: "#FFFFFF",    // Main CTA button text
  accent: "#2563EB",         // Atlas blue accent
  emerald: "#10B981",        // Green success / confidence
  amber: "#F59E0B",          // Amber warning / sponsored
  amberSoft: "#FEF3C7",
  danger: "#EF4444",         // Red stop / closure
  
  // Shadows
  shadow: "#000000",
};

export type Theme = typeof lightTheme;

export const darkTheme: Theme = {
  ...lightTheme,
  isDark: true,
  bg: "#121417",
  paper: "#1E2024",
  paperTranslucent: "rgba(30, 32, 36, 0.92)",
  card: "#1E2024",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  
  ink: "#F4F4F5",
  inkSecondary: "#D4D4D8",
  muted: "#9CA3AF",
  subtle: "#272A30",
  line: "#2E3238",
  
  mapBg: "#16181C",
  mapPlate: "#1F2228",
  mapConcourse: "#282C34",
  mapRoom: "#22252C",
  mapStroke: "#343842",
  mapText: "#F4F4F5",
  
  routeCasing: "#000000",
  routeStart: "#FF8533",
  routeMiddle: "#FF5C8A",
  routeViolet: "#A78BFA",
  routeEnd: "#60A5FA",
  
  primary: "#FFFFFF",
  primaryText: "#111111",
  accent: "#3B82F6",
  emerald: "#34D399",
  amber: "#FBBF24",
  amberSoft: "#362B0D",
  danger: "#F87171",
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 28,
  sheet: 32,
};

export const shadows = {
  soft: {
    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  medium: {
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  strong: {
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
};

