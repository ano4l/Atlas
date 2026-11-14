import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { POIItem } from "../map/types";
import { Theme } from "../theme";
import { Icon } from "./Icon";
import { placeIcon } from "../place-presentation";

export function placeTone(poi: POIItem, theme: Theme) {
  const icon = placeIcon(poi);
  if (poi.category === "Unconfirmed tenant")
    return { background: theme.subtle, ink: theme.muted };
  if (poi.id === "checkers" || icon === "coffee")
    return { background: theme.foodSoft, ink: theme.foodInk };
  if (poi.id === "woolworths")
    return { background: theme.sky, ink: theme.skyInk };
  if (poi.id === "clicks" || icon === "restroom" || icon === "info")
    return { background: theme.facilitySoft, ink: theme.facilityInk };
  if (poi.id === "mr-price")
    return { background: theme.amberSoft, ink: theme.amber };
  if (poi.id === "edgars")
    return { background: theme.accentSoft, ink: theme.accent };
  return { background: theme.shoppingSoft, ink: theme.shoppingInk };
}

/** Typographic identifiers keep shop identities readable without reproducing brand logos. */
export function PlaceBadge({
  poi,
  theme,
  size = 44,
}: {
  poi: POIItem;
  theme: Theme;
  size?: number;
}) {
  const tone = placeTone(poi, theme);
  const icon = placeIcon(poi);
  const initials =
    poi.category === "Unconfirmed tenant"
      ? "?"
      : poi.name === "H&M"
        ? "H&M"
        : poi.name === "ZARA"
          ? "Z"
          : poi.name.replace(/^@/, "").slice(0, 1);
  return (
    <View
      accessible={false}
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: tone.background,
        },
      ]}
    >
      {["info", "restroom", "coffee"].includes(icon) ? (
        <Icon name={icon} color={tone.ink} size={size * 0.46} />
      ) : (
        <Text
          maxFontSizeMultiplier={1.2}
          style={{
            fontSize: initials.length > 1 ? size * 0.28 : size * 0.45,
            fontWeight: "600",
            color: tone.ink,
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center" },
});
