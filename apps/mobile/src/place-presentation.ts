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
