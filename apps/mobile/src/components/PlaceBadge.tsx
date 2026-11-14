import React from "react";
import { StyleSheet, View } from "react-native";
import { mapPalette, placeKind } from "../map/style";
import { POIItem } from "../map/types";
import { placeGlyph } from "../place-presentation";
import { Theme } from "../theme";
import { Icon } from "./Icon";

/**
 * A place's identity everywhere outside the map: the same colour and glyph as
 * its map badge, so a list row and its pin read as one thing. Category glyphs
 * stand in for brand logos, which Atlas does not reproduce.
 */
export function PlaceBadge({
  poi,
  theme,
  size = 44,
}: {
  poi: POIItem;
  theme: Theme;
  size?: number;
}) {
  const tone = mapPalette(theme.isDark).tones[placeKind(poi.category)];
  return (
    <View
      accessible={false}
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: tone.badge,
        },
      ]}
    >
      <Icon
        name={placeGlyph(poi.category)}
        color="#FFFFFF"
        size={size * 0.52}
        strokeWidth={2}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
});
