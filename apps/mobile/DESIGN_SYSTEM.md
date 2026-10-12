# Atlas native mobile design

Atlas is an iOS/Android React Native app. The primary task is choosing a destination, previewing an indoor route, and following a clearly labelled demo journey. The map remains the main surface.

## Visual language

Light mode uses cool paper surfaces, navy text and a restrained blue accent. Dark mode translates these roles to navy surfaces and pale blue actions. Semantic tokens live in src/theme.ts. System typography, consistent SVG line icons, 4/8/12/16/20/24 spacing, soft shadows and rounded panels keep the interface coherent.

The map uses react-native-maps with an illustrative corridor network, context zones, selectable places and a conventional blue route/position marker. The synthetic coordinates are anchored near Sandton for the native map camera; they do not describe surveyed mall architecture. Ground Floor and Level 1 labels agree across map controls, directory, preview and guidance.

## Layout and interaction

The app fills the device and respects native safe areas. Search sits above venue/floor controls. Bottom navigation remains fixed; destination and guidance cards sit above it and scroll when their content exceeds half the screen. Primary actions sit in the lower thumb area. Category filters and directory rows share the same components across search and Explore.

Search supports typed queries, category filtering and a useful empty state. Native modal dismissal, Android back, floor selection, map panning/zooming, recentering, destination selection, route preview and arrival are wired. Step-free routing uses the fixture's lift core. Light/dark appearance and reduced motion work during the current session; the operating-system motion preference is respected.

## Prototype boundaries

Routes are calculated locally over the illustrative corridor graph and terminate at the selected place. Distance and walking time are demo estimates. Navigation advances through explicit demo steps rather than pretending to track motion. The app does not claim live BLE positioning, spoken guidance, granted sensor permissions, downloaded map packages or transmitted diagnostics.

The bundled directory and floor network remain local. Native provider initialization and outdoor tile availability depend on platform/provider configuration. Standalone Android requires an Android-restricted Google Maps key, supplied through GOOGLE_MAPS_API_KEY rather than committed source.

## Verification

The routing test covers all destinations with both accessibility preferences, exact endpoints, floor changes and unreachable floors. Native iOS compilation uses the EAS simulator profile. Android screenshots and interaction checks are recorded in artifacts and the build-check document when available. A JavaScript bundle export is not native compilation or simulator execution.
