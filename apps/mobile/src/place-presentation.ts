import { POIItem } from "./map/types";
import type { IconName } from "./components/Icon";

export const placeIcon = (poi: POIItem): IconName =>
  poi.category === "Map landmark"
    ? "pin"
    : poi.category.includes("Entertainment")
      ? "compass"
      : poi.category.includes("Dining")
        ? "coffee"
        : poi.category.includes("Restrooms")
          ? "restroom"
          : poi.category.includes("Guest")
            ? "info"
            : "shop";

/** The glyph shown inside a place's coloured badge, on the map and in lists. */
export function placeGlyph(category: string): IconName {
  if (category === "Unconfirmed tenant") return "layers";
  if (category === "Map landmark") return "pin";
  if (/Market/.test(category)) return "cart";
  if (/Coffee/.test(category)) return "coffee";
  if (/Dining|Food|Restaurant/.test(category)) return "cutlery";
  if (/Health|Beauty|Pharmacy/.test(category)) return "plus";
  if (/Electronics|Tech/.test(category)) return "device";
  if (/Home|Living/.test(category)) return "home";
  if (/Flowers|Gifts|Books|Entertainment/.test(category)) return "sparkle";
  if (/Restrooms/.test(category)) return "restroom";
  if (/Guest/.test(category)) return "info";
  return "shop";
}
