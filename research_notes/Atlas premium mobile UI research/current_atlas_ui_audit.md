# Atlas mobile: current UI implementation audit

Audit date 2026-11-14, branch `codex/native-mobile-polish` (HEAD b100a94). Read-only audit of `apps/mobile`. Paths below are relative to `apps/mobile/` unless they start with `docs/` or `outputs/`. "L" = line number.

Method: every file in `src/components/`, `App.tsx`, `src/theme.ts`, `src/place-presentation.ts`, `src/map/camera.ts`, `src/map/viewport.ts`, the config files and the two internal design docs were read in full; `src/fixtures.ts` L296-418 and `src/usePlaceMemory.ts` were read in part. Counts come from grep over `App.tsx` and `src/components/*.tsx`. Nothing was run on a device; statements about rendering come from code or from the five marketing screenshots.

Caveat on screenshots: `outputs/atlas-marketing-2026-11-06/screenshots/*.png` (1080 x 2400, Android emulator) predate the current code. Evidence: the header subtitle reads "Indoor demo" in the screenshots but `App.tsx` L651 renders "Demo venue"; the home sheet in the screenshots has no "Explore the demo" card row, which exists at `MapHomeSheet.tsx` L181-224; map labels and symbols are category-coloured (purple, brown, green) in the screenshots but the code now uses `theme.inkSecondary` for all non-selected labels (`MapCanvas.tsx` L243-247). Treat the screenshots as "one iteration back".

---

## 1. Design tokens

### 1.1 Colour palette (`src/theme.ts` L1-89)

`darkTheme` spreads `lightTheme` and overrides; tokens marked "(inherited)" are not redefined for dark.

| Token | Light | Dark | Used for |
|---|---|---|---|
| bg | `#F5F6F3` | `#101E29` | Non-map screen background |
| paper | `#FFFFFF` | `#1B2D3A` | Sheets, cards, solid control fill |
| paperTranslucent | `rgba(255,255,255,0.96)` | `rgba(27,45,58,0.97)` | Non-glass control fallback, scale card |
| card | `#FFFFFF` | `#1B2D3A` | **Unused in components** |
| cardBorder | `#E4E9F1` | `#2D3D54` | Only in unused `FloatingSearchBar` |
| ink | `#192834` | `#EDF3FF` | Primary text |
| inkSecondary | `#435465` | `#BECCE1` | Secondary text, map store labels |
| muted | `#526575` | `#A1B1C9` | Tertiary text, placeholders, chevrons |
| subtle | `#EFF3F5` | `#23344E` | Pressed fill, search field fill, neutral buttons |
| line | `#DCE3E8` | `#2D3D54` | Hairline borders and dividers |
| mapBg | `#E6EEEB` | `#132A30` | Map canvas background |
| mapPlate | `#F7F9FC` | `#1B2B42` | Court circle fill |
| mapConcourse | `#FFFFFF` | `#263A54` | Walkway stroke, entrance gap |
| mapRoom | `#E2E8EF` | `#20334C` | **Unused** |
| mapStroke | `#CDD6E3` | `#3B506E` | Plate outline, travelled-route underlay, facility box |
| mapText | `#46556D` | `#BECCE1` | **Unused** |
| routeCasing | `#FFFFFF` | `#152238` | Route casing, marker outlines |
| routeStart | `#195BE9` | `#88B1FF` | Route line, position marker |
| routeMiddle / routeViolet / routeEnd | `#195BE9` | `#88B1FF` | **Unused** (all four route tokens hold the same value; remnants of a gradient route) |
| primary | `#195BE9` | `#A9C6FF` | Primary button fill, switch track |
| primaryText | `#FFFFFF` | `#142135` | Text on primary, route arrows |
| accent | `#1958D5` | `#A9C6FF` | Links, selected state, icons, selected unit stroke |
| accentSoft | `#E8F0FF` | `#253D62` | Selected fills, route summary card |
| chrome | `#142D44` | `#0C1B26` | Navigation instruction banner, Android status-bar strip |
| chromeText | `#FFFFFF` | (inherited `#FFFFFF`) | Text on chrome |
| highlight | `#D8F888` | `#D8F888` | Only in unused `BottomTabBar` / `FloatingSearchBar` |
| highlightInk | `#20351B` | (inherited) | Only in unused `BottomTabBar` |
| sky / skyInk | `#C5EFFF` / `#174C69` | `#234856` / `#BCEBFF` | Woolworths badge |
| foodSoft / foodInk | `#FFF0DF` / `#87451D` | `#44372E` / `#FFCB99` | Food badges |
| shoppingSoft / shoppingInk | `#EEE9FF` / `#6043A5` | `#38334F` / `#D1C2FF` | Default shop badge |
| facilitySoft / facilityInk | `#E0F3ED` / `#24634E` | `#25453D` / `#AAE6CE` | Clicks badge, arrival badge |
| emerald | `#18734D` | `#73D6AB` | **Unused** |
| amber / amberSoft | `#936000` / `#FFF4D8` | `#F3C56B` / `#3C321F` | Mr Price badge, "Sponsored" text |
| danger | `#C63E4B` | `#FF98A3` | Destination pin fill, error text |
| shadow | `#172B4D` | (inherited `#172B4D`) | Map drop-shadow polygons |

Notes:
- `primary` and `accent` differ slightly in light (`#195BE9` vs `#1958D5`) and are identical in dark.
- Seven colour tokens have zero references (`card`, `emerald`, `mapRoom`, `mapText`, `routeMiddle`, `routeViolet`, `routeEnd`); three more are referenced only from dead components (`cardBorder`, `highlight`, `highlightInk`).
- Brand character per `DESIGN_SYSTEM.md` L5: "Slate typography and cobalt actions". The lime `highlight` accent described in `docs/sandton-demo-map.md` L17 no longer appears in any mounted component.

### 1.2 Typography

- **Font family**: none set anywhere (grep for `fontFamily`, `useFonts`, `expo-font` returns nothing). All text uses the platform system font (Roboto in the Android screenshots; San Francisco on iOS). SVG map text likewise sets no family.
- **No type tokens.** `theme.ts` exports no text styles. All 65 static `fontSize` declarations are literals in per-file `StyleSheet`s.
- **Sizes in use (13 distinct)**, with occurrence counts: 10 (1), 12 (5), 13 (13), 14 (11), 15 (7), 16 (12), 17 (2), 18 (2), 20 (3), 21 (1), 22 (2), 24 (4), 34 (2). Map SVG adds 9, 10 and 12 (scale-compensated).
- **Weights**: `"700"` (25), `"600"` (23), `"500"` (2), plus default 400 for body. No 800/900, no light weights.
- **Line heights**: set on only 23 of the text styles; the rest use platform defaults. Pairs seen: 13/17, 13/18, 14/20, 15/21, 16/22, 16/24, 20/24, 20/26, 34/40.
- **Letter spacing**: -1.2 (34 pt titles), -0.5 (24 pt), -0.45 (21-22 pt), -0.4 (20 pt), -0.35 (20 pt instruction), -0.2 (15-18 pt). +0.6 and -0.8 appear only in dead `FloatingSearchBar`.
- **Tabular numerals**: `fontVariant: ["tabular-nums"]` on ETA, distance and scale label (`ActiveNavigationPanel.tsx` L314, L350; `DestinationSheet.tsx` L348; `IndoorMap.tsx` L609).
- **Representative roles**:
  - Screen title: 34/40, 700, -1.2 (`SettingsScreen.tsx` L210-215, `ExploreScreen.tsx` L196-201)
  - Modal title: 24, 700, -0.5 (`RouteStepsSheet.tsx` L175); menu title 24, 600 (`App.tsx` L553-554)
  - Sheet title: 22, 700, -0.45 (`DestinationSheet.tsx` L347)
  - Navigation instruction: 20/24, 700, -0.35 (`ActiveNavigationPanel.tsx` L317-322)
  - ETA: 21, 700, -0.45 (L346-351)
  - List row name: 16/22, 600 (`PlaceList.tsx` L278); home-sheet row name 15, 600 (`MapHomeSheet.tsx` L390)
  - Meta/caption: 13/18 (many files)
  - Button label: 16, 700 (primary); 14, 700 (secondary)
- **Font scaling**: `allowFontScaling` is never disabled, so all UI text follows the OS setting with no cap. The only cap is `maxFontSizeMultiplier={1.2}` on badge initials (`PlaceBadge.tsx` L62). Map labels read `fontScale` from `useWindowDimensions` and cap it at 1.35 (`MapCanvas.tsx` L60, L124); road and gallery labels use a fixed 0.92 (L317).
- **Doc drift**: `docs/mobile-ux-research.md` L35 states "System type uses four sizes (12, 16, 24, 32) and two weights (400, 600)". The code has 13 sizes and three explicit weights.

### 1.3 Spacing

- Token: `space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 }` (`theme.ts` L90).
- **`space` is never imported.** Every padding, margin and gap is a literal. Values are mostly on a 4-pt rhythm (4, 8, 12, 16, 20, 24) with off-grid exceptions: 2, 3, 5, 6, 7, 9, 10, 11, 14, 15 (for example `App.tsx` L687-690 `gap: 9`, `paddingVertical: 7`, `paddingRight: 15`; `MapHomeSheet.tsx` L386 `gap: 11`).
- Screen gutters: 16 (lists, floating controls), 12 (floating sheets' side inset), 20 (Settings).

### 1.4 Radii

- Token: `radius = { sm: 10, md: 16, lg: 24, pill: 28, sheet: 32 }` (`theme.ts` L91). **Never imported.** Values 10 and 32 are not used anywhere.
- Literal radii in use (60 occurrences, 15 distinct): 2, 6, 7, 12 (11x), 14, 16 (12x), 18, 19, 20, 22, 23, 24, 25, 26, 28.
- Floating sheets: 26. Navigation banner: 20. GlassSurface default: 24 control, 28 panel (`GlassSurface.tsx` L105). Pills use height/2 (22, 23, 24, 25). Cards and rows: 16. Small tiles: 12. Badge radius is proportional: `size * 0.32` (`PlaceBadge.tsx` L53).
- `borderCurve: "continuous"` (iOS squircle) is applied to `GlassSurface` (L165) and `MapHomeSheet` (L320) only; `DestinationSheet`, `ActiveNavigationPanel`, cards and buttons use standard circular corners.

### 1.5 Shadows and elevation (`theme.ts` L92-114)

| Token | shadowColor | opacity | radius | offset | Android elevation | Uses |
|---|---|---|---|---|---|---|
| soft | `#172B4D` | 0.07 | 12 | 0,4 | 3 | GlassSurface control, floor switcher |
| medium | `#172B4D` | 0.09 | 16 | 0,6 | 4 | Home sheet, nav banner |
| strong | `#172B4D` | 0.12 | 24 | 0,8 | 6 | Destination sheet, nav panel, GlassSurface panel |

Shadow colour is hard-coded navy and is not changed for dark theme. Shadows are the only token group consistently consumed (10 uses).

### 1.6 Borders

- Default border is `StyleSheet.hairlineWidth` in `theme.line` on floating surfaces, rows and dividers.
- 1-pt borders: chips (`PlaceList.tsx` L245), Settings cards (L224), Directory search (L209), checkbox (L375), most of `ConnectedVenueScreen`.
- GlassSurface draws a lighter top edge: `borderTopColor` = `theme.paper` in light, `rgba(205,224,255,0.22)` in dark (L118-123).

### 1.7 Opacity conventions

- Pressed state is inconsistent. Three patterns coexist: background swap to `subtle` or `accentSoft` (most common); `opacity: 0.8` (primary buttons, `DestinationSheet.tsx` L267, `ActiveNavigationPanel.tsx` L221); `opacity: 0.72` (chips, segmented control). Some buttons have no pressed feedback at all (menu items `App.tsx` L600, "Close menu" L563, "Clear search", section actions, `detailAction`, the instruction banner, all `NavigationDiagnostics` and `CheckpointScanner` buttons).
- Disabled: `opacity: 0.5` (`WalkRecorder.tsx` L233).
- Other: grabber 0.46 (`MapHomeSheet.tsx` L323); step meta on chrome 0.84; position halo 0.19; map shadow polygons 0.045-0.12; modal scrim `rgba(8,20,30,0.25)`.
- No Android ripple (`android_ripple` is never set).

### 1.8 Hard-coded values bypassing tokens

- **Colour literals outside `theme.ts`: 43 values on 29 lines.** 34 are in `MapCanvas.tsx`: unit category fills L82-88 (12 values), site boundary L766, road L773/L781, floor plate L796, glaze gradient L816/L819, planting L885-893, benches L905, wall faces L946-949, unit stroke L971. The rest: `App.tsx` L738 scrim; `ActiveNavigationPanel.tsx` L308 `#FFFFFF19` and L331 `#FFFFFF14`; `GlassSurface.tsx` L121, L143-144; `Icon.tsx` L80 default `#172B4D`; `SettingsScreen.tsx` L59 `#FFFFFF`; `CheckpointScanner.tsx` L76 `#000`.
- The map palette is therefore mostly outside the theme: the theme's `mapRoom`/`mapText` are unused while the real fills live in `storeFill()`.
- Spacing and radius tokens: 0 uses each. Type tokens: none exist.
- Summary: `theme.ts` functions as a colour and shadow palette only. There is no enforced scale for type, spacing or radius.

---

## 2. Screen and component inventory

### 2.1 Navigation model

- **No navigation library.** `App.tsx` holds all navigation as `useState`: `activeTab: "map" | "explore" | "settings" | "test-venue"` (L44, L91), `searchScope` (L97), `selectedPOI` (L99), `isNavigating` (L102), `arrived` (L111), `menuVisible` (L105).
- Screens are conditionally rendered siblings (L318-511). Switching `activeTab` unmounts the map entirely (L318), so camera position and zoom are lost when returning from Directory or Settings.
- No screen transitions between tabs: the swap is instantaneous. No swipe-back gesture on iOS.
- Android hardware back is handled manually (L167-184): navigating -> stop; preview -> close destination; non-map tab -> map.
- Non-map screens share one "Back to map" row (L470-486), not a navigation bar.
- State is session-only except saved/recent places (AsyncStorage key `atlas:demo-venue:places:v1`, `usePlaceMemory.ts`). Dark mode, reduce motion, haptics and step-free preferences reset on restart (`SettingsScreen.tsx` L191 says so).
- No deep linking despite `scheme: "indoornav"` (`app.json` L9).

### 2.2 Mounted screens and surfaces

| Surface | File | Structure | States handled |
|---|---|---|---|
| Map home | `App.tsx` L318-422 | Full-bleed `IndoorMap`; top-left venue chip (glass) + top-right 48-pt options button; right-side recenter button; floating bottom `MapHomeSheet` | No loading state (fixture is bundled). No error or offline state. |
| MapHomeSheet | `MapHomeSheet.tsx` | Floating card (12-pt side inset, 8-pt bottom gap, radius 26). Grabber; search pill (min 54); "Explore the demo" horizontal cards (210 wide, up to 5); Directory / Saved actions; expandable "Suggested places" list | Collapsed / expanded. No empty state (list always has fallback anchors). |
| Search | `SearchOverlay.tsx` | Full-screen opaque RN `Modal` (fade). Back button + pill field (min 50) + horizontal scope chips; `SectionList` of grouped rows on `bg` | Discover (recent + named stores), results with count heading, empty ("No places found" / "No saved places yet") with reset action, storage-issue notice. Search is synchronous and local: no loading or error state. |
| Route preview | `DestinationSheet.tsx` + `App.tsx` L352-378 | Top: back button + "Walking preview" badge. Bottom floating card: badge + title + save button; scrollable middle (estimate card, "Place details" disclosure); pinned footer ("Start demo walk" + "Steps") | Route / no-route text / arrived ("Demo walk complete") / storage issue. |
| Active guidance | `ActiveNavigationPanel.tsx` | Top navy instruction banner (icon tile 48, distance label, instruction, "Now" sub-row); bottom floating card (ETA, End, 3-pt progress bar, Pause/Continue, Overview/Follow, Steps) | Walking / paused; following / not following. No off-route, recalculating or GPS-lost states in the main demo flow. |
| Route steps | `RouteStepsSheet.tsx` | Full-screen opaque `Modal` (slide). Header, summary card, step list with vertical connector, pinned footer button | Preview mode vs active mode (current/completed markers, "Skip to next step"). |
| Map options menu | `App.tsx` L526-618 | Transparent `Modal` (fade), 25% scrim, centred `GlassSurface` panel (max width 400), 2-3 rows | None. |
| Directory | `ExploreScreen.tsx` | `FlatList` with header: 34-pt title, venue line, search button, Browse/Saved segmented control, category chips, heading + count | Empty states for no results and no saved places. |
| Settings | `SettingsScreen.tsx` | `ScrollView`, 34-pt title, grouped cards with icon tile + title + description + `Switch` | Reduce-motion row disabled when OS setting is on. Dev-only `WalkRecorder`; `NavigationDiagnostics` when API URL is set. |
| Fictional test venue | `ConnectedVenueScreen.tsx` | Only when `EXPO_PUBLIC_ATLAS_API_URL` is set. Header with floor buttons; map in top half; scrolling form panel in bottom half | **The only surface with real async states**: loading (`ActivityIndicator`), error with retry, offline banner text, search loading/error/empty, route loading/error/retry, reroute working/failed/updated, route expired, floor confirmation. |
| Checkpoint scanner | `CheckpointScanner.tsx` | Full-screen `Modal` (slide), heading, camera view, bordered buttons | Permission request, denied, camera error, invalid code. |

### 2.3 Dead or unmounted components

- `BottomTabBar.tsx` and `FloatingSearchBar.tsx` are exported from `src/components.tsx` L3, L5 but imported nowhere. They carry the older navy + lime visual language.
- `IndoorMap` prop `hasSheet` is declared (L62) and passed but never read.
- `Icon` names with no call site in mounted UI: `menu`, `route`, `parking`, `lift`, `history`, `escalator` (reachable only via route step data).

### 2.4 Visual consistency between surfaces

- The main flow (home sheet, destination sheet, guidance) uses rounded 26-pt floating cards, weights 600/700 and styled buttons.
- `ConnectedVenueScreen`, `CheckpointScanner`, `NavigationDiagnostics` and `WalkRecorder` use a plainer style: 12-pt radius bordered `Choice` buttons, unstyled default-size `Text` (many `Text` elements have only a colour, for example `ConnectedVenueScreen.tsx` L468, L491, L503, L564), no icons, no motion, no haptics. The connected venue, which is the only flow backed by the real API, is visually the least finished.

---

## 3. Bottom sheets

- **All custom; no sheet library.** Three different implementations, none sharing code:
  1. **MapHomeSheet** (the only draggable one). Not a translating sheet: the card is absolutely positioned at `bottom: 8` and grows by animating the height of a clipped list region (`clipStyle` L101-103, `height: travel * progress`).
     - **Detents: two** (collapsed, expanded). `travel = max(84, min(stops * 62 + 46, windowHeight * 0.32, 320))` (L85-88). No full-height detent; the sheet never covers more than roughly a third of the screen beyond its header.
     - **Gesture**: `Gesture.Pan()` attached **only to the 28-pt-high grabber row** (L118-139, L152-164), `activeOffsetY([-8, 8])`, `failOffsetX([-18, 18])`. Dragging the search pill, cards or list does not move the sheet. Tap on grabber toggles.
     - **Release**: projected position = `dragStart - (translationY + velocityY * 0.12) / travel`; snaps to expanded if > 0.5 (L133-135). Snap uses `withSpring` with `{ damping: 28, stiffness: 320, mass: 0.85, overshootClamping: true }` (L28-33). Velocity is used for target selection but is not passed into the spring.
     - **Content**: list fades with `opacity = min(1, progress * 1.8)` and `translateY 8 -> 0` (L104-107). The inner list is a plain `ScrollView`; there is no scroll-to-drag handoff.
     - Interruptible: `cancelAnimation(progress)` on gesture start (L122).
     - Reduced motion: drag tracking is disabled and the sheet jumps between detents (L126, L115, L137).
  2. **DestinationSheet**. Not draggable, no grabber, no detents, no swipe-to-dismiss. Height is content-driven; "Place details" expands inline and the card resizes with a Reanimated layout transition (section 4). Scroll region capped at `max(56, windowHeight * 0.27)` (L136). Dismissal is via the top-left back button or Android back.
  3. **ActiveNavigationPanel** bottom card. Fixed content, not draggable.
- "Sheets" that are full-screen: `RouteStepsSheet`, `SearchOverlay` and `CheckpointScanner` are opaque RN `Modal`s using the built-in `slide` / `fade` animation. They are not partial-height sheets and have no drag-to-dismiss. No `presentationStyle` is set, so iOS does not use the native page-sheet/form-sheet presentation.
- **Keyboard handling**: only in `SearchOverlay` (`KeyboardAvoidingView`, `behavior="padding"` on iOS, undefined on Android, L140-143; `keyboardDismissMode="on-drag"`, `keyboardShouldPersistTaps="handled"`). `ConnectedVenueScreen` has a `TextInput` in the lower half of the screen with `keyboardShouldPersistTaps` but no keyboard avoidance (L485, L604). The floating sheets contain no inputs.
- **Map padding sync**:
  - Each bottom surface reports its measured height via `onLayout` -> `onHeightChange` -> `sheetHeight` React state (`App.tsx` L87; `DestinationSheet.tsx` L77-79; `ActiveNavigationPanel.tsx` L149-151; `MapHomeSheet.tsx` L92-94 reports the target detent height).
  - `IndoorMap` builds `viewport = { width, height, top: topInset, bottom: sheetHeight + 20 }` (L116-120); camera fits use right inset 68 in route/follow, 24 in floor mode (L228-231).
  - Top inset is measured too: `instructionHeight + 20` while navigating, fixed `68` in preview, `headerHeight + 20` on home (`App.tsx` L290-294).
  - During a home-sheet drag a Reanimated shared value `liveHomeSheetHeight` (L88) moves the recenter button and the zoom/scale tools on the UI thread (`FloatingMapControls.tsx` L52-56; `IndoorMap.tsx` L433-435). **The camera does not follow the drag**; it reframes after release when React state commits (documented in `DESIGN_SYSTEM.md` L7), using the 420 ms camera timing.
  - In `manual` camera mode the map is not re-padded at all.

---

## 4. Motion

Two animation systems are in use side by side: React Native core `Animated` (`Motion.tsx`) and Reanimated 4 (sheets and map), plus built-in `Modal` animations.

| # | What animates | API | Timing / config | Interruptible | Reduced motion |
|---|---|---|---|---|---|
| 1 | Press scale on `MotionPressable` | RN `Animated` (native driver) | Press in: `timing` to 0.98, 65 ms, `Easing.out(Easing.quad)`. Release: `spring` to 1, `stiffness 380, damping 28, mass 0.7, overshootClamping: true` (`Motion.tsx` L108-122) | Yes, new animation takes over | No scale; style-based pressed colour remains |
| 2 | `MotionSurface` entrance (nav banner from top, nav panel from bottom) | RN `Animated.timing` | 220 ms, `Easing.out(Easing.cubic)`; translateY -10 -> 0 (top) or 12 -> 0 (bottom); `center` variant scale 0.985 -> 1 (unused). **No opacity change** (L55-82) | Stopped on unmount | Value set to 1 immediately |
| 3 | DestinationSheet entrance | Reanimated `FadeInUp.duration(220).withInitialValues({ opacity: 0, translateY: 14 })` (`DestinationSheet.tsx` L41-44) | 220 ms, default easing | n/a | `entering` undefined |
| 4 | DestinationSheet resize (details toggle) | Reanimated `LinearTransition.springify().damping(34).stiffness(280)` on card, scroll view and footer (L40, L76, L135, L257) | Spring | Yes | `layout` undefined |
| 5 | Details content reveal | `FadeIn.duration(180).delay(40)` (L190) | 180 ms + 40 ms delay | n/a | Off |
| 6 | Home sheet detent | `withSpring(next, { damping: 28, stiffness: 320, mass: 0.85, overshootClamping: true })` (`MapHomeSheet.tsx` L28-33) | Spring, no overshoot | Yes (`cancelAnimation`) | Jump |
| 7 | Home sheet list fade/slide | `useAnimatedStyle` derived from progress | Tied to #6 | Yes | Jump |
| 8 | Floating controls following sheet | `useAnimatedStyle` translateY from shared height | Tied to #6 | Yes | Jump |
| 9 | Instruction icon change | `FadeIn.duration(180)` keyed by step id (`ActiveNavigationPanel.tsx` L34, L110-113) | 180 ms | n/a | Off |
| 10 | Route progress bar | `withTiming(progress, { duration: 360 })`, `scaleX` with `transformOrigin: "left center"` (L82-89, L355-360) | 360 ms, default easing | Retargets | Immediate |
| 11 | Camera reframe (mode change, recenter, floor, sheet height change) | `withTiming` on x, y, scale via `runOnUI` (`IndoorMap.tsx` L250-274) | 420 ms, `Easing.inOut(Easing.cubic)`; first frame 0 ms | Cancelled by pan/pinch/double-tap; skipped while a gesture is active (L258) | 0 ms |
| 12 | Camera follow during walk | Same, "tracking" branch | 500 ms, `Easing.linear`, retargeted every 500 ms tick; scale untouched unless it changes by > 0.0001 (L232-240, L271-273) | Pan switches to manual mode | 0 ms |
| 13 | Position marker movement | `withTiming` on positionX/Y (L192-200) | 500 ms linear while navigating, 340 ms linear otherwise | Retargets | 0 ms |
| 14 | Position arrow bearing | `withTiming`, shortest-arc delta (`MapCanvas.tsx` L569-580) | 180 ms, `Easing.out(Easing.cubic)` | Retargets | 0 ms |
| 15 | Destination pin reveal | `withTiming` scale 0.82 -> 1 (L669-675) | 180 ms, `Easing.out(Easing.cubic)`; scale only, no fade, no bounce | n/a | Starts at 1 |
| 16 | Route progress trim | `useDerivedValue` projecting position onto the polyline; drives `strokeDashoffset` (L484-503, L385-393) | Per-frame | n/a | Same (position jumps) |
| 17 | Pan fling | `withDecay({ deceleration: 0.994, clamp })` (`IndoorMap.tsx` L330-339) | Decay | Yes | No fling (L327) |
| 18 | Double-tap zoom / zoom buttons | `withTiming(..., { duration: 220 })`, default easing; factor 1.65 (double tap), 1.4 (buttons) (L383-392, L436-453) | 220 ms | Yes | 0 ms |
| 19 | Pinch / pan | Direct shared-value writes in gesture worklets | Per-frame | n/a | Unchanged |
| 20 | Search and menu modals | RN `Modal animationType="fade"` | Platform default | No | `"none"` |
| 21 | Route steps modal | `Modal animationType="slide"` | Platform default | No | `"none"` |
| 22 | Checkpoint scanner | `Modal animationType="slide"` | Platform default | No | **Not gated** (`CheckpointScanner.tsx` L32) |

Things that do not animate (from code):
- **No exit animations anywhere**: no `exiting` props; sheets, banners, badges and the pin disappear on unmount.
- No route draw-on animation; preview dots appear at once.
- Switching preview -> guidance swaps `DestinationSheet` for `ActiveNavigationPanel` with no shared-element or cross-fade; route style switches from dotted to solid by remounting (`MapCanvas.tsx` L1073 key).
- Tab changes, theme change (light/dark), floor change, label reveal at zoom thresholds (opacity is a hard 0/1 step, `MapCanvas.tsx` L128), chip selection, save toggle, list rows: all instantaneous.
- No pulsing or breathing on the position dot (deliberate: `docs/mobile-ux-research.md` L56).
- No skeletons or shimmer; loading uses `ActivityIndicator` or plain text.
- The walk itself is driven from JS: `setInterval` every 500 ms updates React state (`App.tsx` L261-265), re-rendering the app root; smoothness between ticks comes from the 500 ms linear timings.

Reduced motion:
- Source: `AccessibilityInfo.isReduceMotionEnabled()` + `reduceMotionChanged` listener (`App.tsx` L157-166), OR-combined with an in-app "Reduce motion" switch (L55, L100). Initial value is `true` until the async read resolves (L49).
- Delivered through `FeedbackContext` and a `reducedMotion` prop. Every Reanimated/Animated call above checks it except the scanner modal.
- Side effect: reduced motion also disables Liquid Glass (`GlassSurface.tsx` L102-104).

Doc drift: `docs/mobile-ux-research.md` L51 lists press timings "80 ms / 140 ms" and progress "180 ms"; code uses 65 ms + spring and 360 ms.

---

## 5. Haptics

Single helper `useFeedback()` (`Motion.tsx` L29-42) using `expo-haptics`. Only two types exist: `Haptics.selectionAsync()` (default) and `Haptics.notificationAsync(Success)`. No impact styles (light/medium/heavy/rigid/soft), no warning or error notifications.

| Trigger | Type | Location |
|---|---|---|
| Select a place (map tap, list row, card) | selection | `App.tsx` L187 |
| Start demo walk | selection | L203 |
| Floor change during walk | selection | L231 |
| Arrival | success | L219 |
| Step-free toggle | selection | L282 |
| Manual floor switch | selection | L383 |
| Save / unsave | selection | L434 |
| Home sheet detent change | selection | `MapHomeSheet.tsx` L110 |
| "Place details" disclosure | selection | `DestinationSheet.tsx` L174 |

Not covered: turn cues during guidance (same-floor step changes produce no haptic), pause/continue, end, recenter, zoom limits, chip selection, errors, sheet drag thresholds during the drag, anything in the connected venue or scanner (including a successful QR scan and off-route detection). Haptics can be disabled in Settings; the preference is session-only.

---

## 6. Map canvas

### 6.1 Rendering approach

- Custom vector scene in **`react-native-svg`**. No map SDK, tiles or Skia (`README.md` L3).
- One `<Svg>` sized to the floor bounds (1242 x 1306 for the Sandton fixture) inside an `Animated.View` that receives `translateX / translateY / scale` from shared values with `transformOrigin: [0,0,0]` (`IndoorMap.tsx` L426-432, L592). The camera is therefore a view transform over a static SVG, not a re-projection.
- Screen-constant sizes (labels, markers, route width) are kept by animated SVG props that divide by `scale.value` each frame (`useAnimatedProps`, e.g. `MapCanvas.tsx` L120-135).
- Static geometry is memoised in one `useMemo` (L759-1061). `MapCanvas`, `MapRoute`, `Position`, `Destination` are `memo`.
- Zoom range `MIN_ZOOM 0.18` to `MAX_ZOOM 2.4`; auto-fit capped at 1.5 (`viewport.ts` L13-14, L44).
- Overhead 2D only: no rotation, tilt or heading-up mode. A 2.5-unit "wall face" offset fakes shallow depth (L923-955).

### 6.2 Colours (light / dark)

| Element | Light | Dark | Source |
|---|---|---|---|
| Canvas background | `#E6EEEB` | `#132A30` | `theme.mapBg` |
| Site boundary (grounds) | `#E1EAE2` | `#263B3E` | L766 |
| Road casing, 52 wide | `#D8E1DE` | `#3A4B58` | L773 |
| Road fill, 48 wide | `#FDFDFC` | `#303F4D` | L781 |
| Floor plate (corridor area) | `#F6F3EC` | `#26323A` | L796; stroke `mapStroke` 1.8 |
| Plate drop shadow | `#172B4D` at 0.05, offset y 4 | same | L788-793 |
| Walkways (connected venue only) | `#FFFFFF` | `#263A54` | 8 wide, L801-811 |
| Tile pattern | `mapStroke`, 0.5 wide, opacity 0.08, 24-unit grid | same | L824-837 |
| Court circle | `#F7F9FC` | `#1B2B42` | stroke `mapStroke` 2; inner ring 0.7 at 0.55 |
| Planting | `#C3D8BF` / `#A8C4A5` / `#DAE8CE` | `#34524B` / `#45665B` / `#42665B` | L885-893 |
| Benches | `#BD9D77` | `#7B6B55` | L905 |
| Unit: unconfirmed tenant | `#E4E7E2` | `#34414A` | L82 |
| Unit: dining/food | `#F9EBD9` | `#493A32` | L83 |
| Unit: health | `#E4F0E7` | `#30483F` | L84 |
| Unit: electronics | `#E2EEF6` | `#274253` | L85 |
| Unit: home/entertainment/books | `#EEE7F5` | `#3B3850` | L86-87 |
| Unit: default retail | `#E4EBF6` | `#354154` | L88 |
| Unit stroke | `#CDD6CF` | `#3B506E` | 1.2 (named), 0.65 (detail units) |
| Wall faces | `#D1DAD4` / `#DBE1D8` | `#24323B` | L944-950 |
| Unit glaze | white gradient 0.16 -> 0 | 0.025 -> 0 | L813-820 |
| Selected unit | fill `#E8F0FF`, stroke `#1958D5` width 3 | fill `#253D62`, stroke `#A9C6FF` | L961-975 |
| Entrance | 6-wide gap in `mapConcourse` + 2-wide bar in `mapStroke` (accent if selected) | | L987-1008 |

In light theme roughly 128 of 141 units (141 minus 5 anchors and 8 fictional tenants) are "Unconfirmed tenant" grey `#E4E7E2` on a `#F6F3EC` plate (contrast 1.13:1) with `#CDD6CF` strokes (1.19:1 against the fill). The screenshots confirm the result: a dense field of near-identical pale grey rectangles with a handful of tinted anchors.

### 6.3 Labels

- Text is SVG `Text`, weight 600, centred, system font. Base sizes: named stores 10 (`PLACE_LABEL_SIZE`), detail units 9, road/area labels 10, facility glyph 12, "Demo start" 9. Line-height factor 1.16.
- Size per frame = `min(maxWidth / (chars * 0.56), maxHeight / (lines * 1.3), (fontSize / scale) * min(fontScale, 1.35))` (L121-125), so labels stay screen-constant unless constrained to the unit footprint.
- Long names split into two balanced lines above 13 characters (`viewport.ts` L115-132).
- Colour: `inkSecondary` normally, `muted` for detail units, `accent` when selected (L243-247). No halo or outline behind map text.
- A category symbol (7.5-radius filled circle with a bag, cutlery or cross glyph in `paper` colour, stroke 1.15) sits above named-store labels (L149-200); hidden for selected, detail and demo units.
- **Zoom thresholds**:
  - Named anchors (5): always visible.
  - Fictional demo tenants (8): visible from scale >= 0.85 or when selected (L279-280).
  - Gallery area labels: from 0.8 (L1019).
  - Road labels: always.
  - Detail unit references (S-codes): React-mounted when scale >= 1.06 and unmounted at <= 0.94 (hysteresis, `IndoorMap.tsx` L144-149); each then also needs its own fit threshold `7 / min(width / (chars * 0.56), height / 1.3)` (L282).
  - Route arrows hidden below 0.4 (L430).
  - Scale bar steps: 10 m at >= 1.9, 20 m at >= 0.85, 50 m at >= 0.385, 100 m at >= 0.19, else 200 m (`IndoorMap.tsx` L558-564).
- No collision detection or priority-based decluttering; visibility is threshold-only. Visibility changes are a hard opacity switch.
- Facilities render as a 24-pt rounded box with a text glyph: "↕" lift, "↗" escalator, "WC" restroom, "i" other (L1037-1053). These are Unicode characters, not icons. The Sandton fixture has no facilities (`fixtures.ts` L364).

### 6.4 Route line

- Three stacked polylines, round caps and joins (`MapRoute`, L504-546):
  - Casing: `routeCasing` (`#FFFFFF` / `#152238`), 11 wide (guidance) or 7.5 (preview).
  - Travelled underlay (guidance only): `mapStroke`, 7 wide.
  - Main: `routeStart` (`#195BE9` / `#88B1FF`), 7 wide (guidance) or 5 (preview); `muted` when complete.
- **Preview** is dotted: dash `[0.3 / scale, 8.8 / scale]` with round caps, i.e. 5-pt dots about every 9 pt (L387-389).
- **Guidance** is solid; the travelled part is hidden by `strokeDashoffset = -progress`, exposing the grey underlay.
- Direction chevrons: on segments >= 95 map units, at the midpoint, size 2.4, stroke 1.5, colour `primaryText` (L530-544, L428-440).
- Widths are screen-constant (divided by scale). Corners are polyline joins: no corner rounding or smoothing of the path, no gradient, no glow, no animated flow.

### 6.5 Position marker

- Halo: circle radius 16 (idle) or 21 (navigating), `routeStart` at opacity 0.19. Static; it is not an accuracy radius and does not pulse.
- Idle: dot radius 7, fill `routeStart`, stroke `routeCasing` 2.5.
- Navigating: arrowhead (notched chevron, 13 forward, 9 back, 8 half-width), fill `routeStart`, stroke `routeCasing` 2.5, rotated to the bearing toward the next node (L592-602).
- Idle state adds a "Demo start" pill below (60 x 18, radius 9, `paper` fill, `line` stroke, 9-pt text) (L603-615, L637-653).
- No heading cone, no compass input, no shadow.

### 6.6 Destination marker

- Teardrop pin drawn as a path: 10-radius head centred 16 above the anchor, total height 26; fill `danger` (`#C63E4B` / `#FF98A3`), stroke `routeCasing` 2; inner dot radius 3.1 in `routeCasing` (L676-704).
- Appears with a 180 ms scale from 0.82. No shadow, no drop/bounce, no label on the pin; the destination unit is highlighted instead.
- Connected venue adds 2.2-radius accent dots at every place entrance (L1054-1057).

### 6.7 Floor switcher

- In `FloatingMapControls.tsx` L62-100: vertical pill (radius 18, padding 3) of 48 x 48 cells with 15-pt/700 short labels; selected cell `accentSoft` fill + `accent` text; switches to a horizontal row when available height < 280. Solid `paper`, not glass.
- **Rendered only when the bundled venue has more than one floor (L62). The Sandton fixture has one floor (`fixtures.ts` L403), so the floor switcher never appears in the main demo.** Multi-floor switching exists only in `ConnectedVenueScreen`, as plain `Choice` buttons in the header (L447-454, L473).
- Floor change has no map transition.

### 6.8 Camera modes (`src/map/camera.ts`)

- `floor`: fit plate + road label points. `route`: fit route polyline plus destination room polygon. `follow`: fixed 380 x 320 map-unit window centred on the position with a look-ahead of 25% of `min(leg length, 80)` toward the next node. `manual`: no automatic framing.
- Any pan, pinch, double-tap or zoom-button press switches to `manual` (`IndoorMap.tsx` L313, L354, L393, L437). In manual mode a zoom +/- pill (44-pt buttons, glass) and an approximate scale bar appear bottom-right/bottom-left (L503-545).
- Recenter button: icon `locate` (home/guidance) or `fit` (preview); expands to a labelled "Follow route" pill when navigating and not following (`FloatingMapControls.tsx` L101-133).
- Pan limits keep at least 30% of the visible viewport overlapping the map extent (`viewport.ts` L52-70). No rubber-banding at limits; values are hard-clamped.

### 6.9 Gestures

`Gesture.Simultaneous(pan, pinch, Gesture.Exclusive(doubleTap, tap))` (L406). Pan: one finger, `minDistance(6)`. Pinch zooms around the focal point. Double tap: `maxDelay(240)`, zoom x1.65. Single tap: `maxDistance(8)`, hit-tests labels first, then unit polygons, then nearest place within `24 / scale` (`viewport.ts` L98-114). No rotate, no two-finger tilt, no one-finger double-tap-drag zoom, no long-press.

### 6.10 Performance techniques

- Camera, label sizing, route trim and markers run on the UI thread through shared values; React re-renders are limited to threshold crossings (`runOnJS(setShowUnitLabels)`), not per-frame.
- Detail labels (about 128 units) are mounted only above zoom 1.06.
- Latest callbacks kept in a ref so the gesture object is not rebuilt (L158-171).
- Not present: viewport culling, level-of-detail geometry, rasterised layers/caching, `shouldRasterizeIOS`/`renderToHardwareTextureAndroid`. Every named label and marker owns its own `useAnimatedProps` worklet, all re-evaluated on each zoom frame. `BUILD_CHECKS.md` L54 and L74 state that no physical-device frame-rate measurement has been done.

---

## 7. Iconography

- **Source**: a single custom component, `src/components/Icon.tsx`. 35 named icons defined as inline SVG path strings on a 24 x 24 viewBox (L40-77), with extra `Circle` elements for some (L96-117). No icon library is installed (no `@expo/vector-icons` import, no SF Symbols via `expo-symbols`, no Lucide/Phosphor package). Several paths resemble Feather/Lucide-style outlines (for example `layers`, `map`, `check`, `arrow`) but they are hand-inlined and mixed with bespoke ones.
- **Style**: outline only, uniform `strokeWidth="1.7"`, round caps and joins, single colour. No filled or duotone variants, so selected states cannot switch to a filled glyph. Exceptions drawn filled: `walking` head, `locate` centre, `restroom` heads.
- **Sizes used**: 14, 16, 17, 18, 19, 20, 21, 22 (default), 24, 35, and proportional `size * 0.46` in badges. Stroke is fixed in viewBox units, so the rendered stroke scales with size: about 1.0 pt at 14, 1.56 pt at 22, 2.5 pt at 35.
- **Separate icon systems on the map**: `PlaceSymbol` glyphs (stroke 1.15, `MapCanvas.tsx` L169-182), zoom +/- (stroke 1.8 on a 20 viewBox, `IndoorMap.tsx` L523-536), facility glyphs as Unicode text. Three stroke conventions in total.
- **Semantic mismatches (observation)**:
  - `settings` path is a sliders glyph and is used for the "Map options" button and the Settings menu row.
  - `pin` includes a plus sign inside the pin (L63) and is used for arrival, landmarks and venue context; in screenshot 03 the arrival tile reads as "add location".
  - Saved state swaps `bookmark` for `check` (`DestinationSheet.tsx` L128) instead of a filled bookmark.
  - `atlas` logo mark is a stroked "A" shape (L41).
  - Icon reuse in Settings: `layers` for "Reduce motion", `locate` for "Haptic feedback" (`SettingsScreen.tsx` L135, L149); `layers` also means Directory, Units and the test venue; `compass` means "All places".
  - `play` is an outline triangle next to `pause` as two strokes.
- **Place identity**: `PlaceBadge` renders a tinted rounded square with the first letter of the name (or an icon for dining/restroom/info, "?" for unconfirmed) (`PlaceBadge.tsx` L37-71). No logos or photos; this is deliberate (L25 comment).
- Icons are hidden from assistive tech (L93-94).

---

## 8. Glass and blur

- Component: `GlassSurface.tsx`, wrapping `expo-glass-effect`'s `GlassView` with `glassEffectStyle="regular"` (L134-157).
- **Call sites (7)**: venue chip (`App.tsx` L639), options button (L655), preview back button (L354), "Walking preview" badge (L367), menu panel with `variant="panel"` (L543), recenter button (`FloatingMapControls.tsx` L101), zoom pill (`IndoorMap.tsx` L509).
- **Not glass**: `MapHomeSheet`, `DestinationSheet`, `ActiveNavigationPanel` (both parts), floor switcher, scale card. These are solid `paper` or `chrome`. The largest surfaces over the map are therefore opaque.
- **Conditions for real glass** (L78-85, L102-103): iOS only, `isGlassEffectAPIAvailable() && isLiquidGlassAvailable()`, system material "standard" (neither Increase Contrast nor Reduce Transparency), and reduced motion off.
- **Fallbacks**:
  - iOS without Liquid Glass, and all Android: `paperTranslucent` (96-97% opaque, effectively solid; no blur). `expo-blur` is not installed, so there is no blur fallback on any platform.
  - Reduce Transparency, reduced motion (OS or in-app), or panel variant: solid `paper` behind the content. Note the `panel` variant is always `solid` (L104) yet can also mount a tinted `GlassView` when glass is available (L133-146), in which case the background is transparent (L124-125).
  - Increase Contrast (iOS) / High Text Contrast (Android): solid `paper` and the border switches from `line` to `muted` (L107).
- Material state is a module-level store read through `useSyncExternalStore`, initial value `"opaque"` (L20, L95-99).
- `tintColor` is only set for panels: `rgba(255,255,255,0.38)` light, `rgba(27,45,58,0.32)` dark.
- No `GlassContainer`/merging, no `isInteractive`, no glass on pressed states.
- Verification status: `BUILD_CHECKS.md` L26, L38, L45 state native iOS glass appearance is unverified on a device. All screenshots are Android and show the opaque fallback.

---

## 9. Accessibility

### 9.1 Roles and labels

- About 50 `Pressable`/`MotionPressable` JSX sites across mounted and dev components. **All carry an `accessibilityRole`** (47 `button`, 1 `checkbox`, 1 `tab` in dead code).
- Explicit `accessibilityLabel` is present on every icon-only control (back, close, menu, clear, save, recenter, zoom, grabber, floor buttons). Roughly 20 text buttons have no explicit label and rely on their child text (for example menu rows, "Directory", "Start demo walk", "Steps", "End", "Overview", chips, `Choice`, scanner and diagnostics buttons). No unlabeled icon-only touchable was found.
- State: `accessibilityState` for `expanded` (grabber, details), `selected` (save, chips, segments, floors, recenter), `checked`, `disabled`.
- Headers: 19 `accessibilityRole="header"`. Alerts: 7. One `progressbar` with `accessibilityValue` (`ActiveNavigationPanel.tsx` L191-199).
- Live regions and announcements (14 sites): result-count heading, storage notices, `announceForAccessibility` on step change, arrival and floor change (`App.tsx` L220, L232, L386).
- Collapsed home-sheet list is hidden from assistive tech (`MapHomeSheet.tsx` L263-264).
- **Map**: the whole canvas is one accessible element with a descriptive label and increment/decrement zoom actions (`IndoorMap.tsx` L464-472); the SVG is `accessible={false}`. Individual stores are not reachable by screen reader on the map; they are reachable through search, directory and the home sheet.
- Segmented control and scope chips use role `button` with `selected` rather than `tab`/`radio`.
- VoiceOver/TalkBack has not been tested on a device (`BUILD_CHECKS.md` L74).

### 9.2 Hit targets

- Standard: 48 x 48 (header/round buttons, floor cells, recenter), 44 x 44 (zoom, clear, save, close, chips min-height, list actions), rows 60-72.
- Below 44 pt in one dimension: sheet grabber row is full width but 28 high (`MapHomeSheet.tsx` L322); "End" is min 48 x 44; the lift checkbox glyph is 24 but its row is 44. `Switch` uses `hitSlop={8}` (the only `hitSlop` in the app).
- Map tap tolerance for places: 24 screen pt radius.

### 9.3 Contrast (computed, WCAG 2.x relative luminance)

Text pairs (AA normal text needs 4.5:1):

| # | Pair | Light | Ratio | Dark | Ratio |
|---|---|---|---|---|---|
| 1 | ink on paper | `#192834` / `#FFFFFF` | 15.06 | `#EDF3FF` / `#1B2D3A` | 12.72 |
| 2 | ink on bg | `#192834` / `#F5F6F3` | 13.88 | `#EDF3FF` / `#101E29` | 15.22 |
| 3 | inkSecondary on paper | `#435465` / `#FFFFFF` | 7.79 | `#BECCE1` / `#1B2D3A` | 8.71 |
| 4 | muted on paper | `#526575` / `#FFFFFF` | 6.04 | `#A1B1C9` / `#1B2D3A` | 6.51 |
| 5 | muted on bg | `#526575` / `#F5F6F3` | 5.57 | `#A1B1C9` / `#101E29` | 7.78 |
| 6 | muted on subtle (placeholder in search field) | `#526575` / `#EFF3F5` | 5.41 | `#A1B1C9` / `#23344E` | 5.77 |
| 7 | primaryText on primary (main button) | `#FFFFFF` / `#195BE9` | 5.65 | `#142135` / `#A9C6FF` | 9.40 |
| 8 | accent on paper (links, icons) | `#1958D5` / `#FFFFFF` | 6.18 | `#A9C6FF` / `#1B2D3A` | 8.23 |
| 9 | accent on accentSoft (selected chip, Pause) | `#1958D5` / `#E8F0FF` | 5.40 | `#A9C6FF` / `#253D62` | 6.35 |
| 10 | chromeText on chrome (instruction banner) | `#FFFFFF` / `#142D44` | 14.11 | `#FFFFFF` / `#0C1B26` | 17.49 |
| 11 | inkSecondary on accentSoft (route summary meta) | `#435465` / `#E8F0FF` | 6.81 | `#BECCE1` / `#253D62` | 6.72 |
| 12 | danger on paper (error text) | `#C63E4B` / `#FFFFFF` | 5.01 | `#FF98A3` / `#1B2D3A` | 6.93 |
| 13 | danger on accentSoft (route error inside summary card) | `#C63E4B` / `#E8F0FF` | **4.38** | `#FF98A3` / `#253D62` | 5.34 |
| 14 | amber on paper ("Sponsored") | `#936000` / `#FFFFFF` | 5.37 | `#F3C56B` / `#1B2D3A` | 8.77 |
| 15 | Map store label on default unit fill | `#435465` / `#E4EBF6` | 6.50 | `#BECCE1` / `#354154` | 6.34 |
| 16 | Map detail label on unconfirmed fill | `#526575` / `#E4E7E2` | 4.84 | `#A1B1C9` / `#34414A` | 4.82 |
| 17 | Road label on road fill | `#526575` / `#FDFDFC` | 5.93 | `#A1B1C9` / `#303F4D` | 4.96 |
| 18 | Step meta (white at 0.84) on chrome | ~`#DAE0E3` / `#142D44` | 10.33 | / `#0C1B26` | 12.57 |
| 19 | Badge inks on soft fills (food, shopping, facility, sky) | | 6.13-7.55 | | 7.34-7.78 |
| 20 | amber on amberSoft (Mr Price badge) | `#936000` / `#FFF4D8` | 4.90 | `#F3C56B` / `#3C321F` | 7.80 |

Only pair 13 (light) falls below 4.5:1. All main text pairs pass AA; most pass AAA (7:1) for primary text. Map labels at 9-10 pt pass 4.5:1 numerically but are small.

Non-text pairs (WCAG 1.4.11 asks 3:1 for meaningful graphical boundaries):

| Pair | Light | Ratio | Dark | Ratio |
|---|---|---|---|---|
| Route line on plate | `#195BE9` / `#F6F3EC` | 5.10 | `#88B1FF` / `#26323A` | 6.11 |
| Unit stroke vs unit fill | `#CDD6CF` / `#E4E7E2` | **1.19** | `#3B506E` / `#34414A` | **1.28** |
| Unit fill vs floor plate | `#E4E7E2` / `#F6F3EC` | **1.13** | `#34414A` / `#26323A` | **1.25** |
| Hairline `line` vs paper | `#DCE3E8` / `#FFFFFF` | **1.30** | `#2D3D54` / `#1B2D3A` | **1.29** |
| Grabber (muted at 0.46) vs paper | ~`#AFB8C0` / `#FFFFFF` | **2.01** | ~`#596A7C` / `#1B2D3A` | **2.55** |
| Switch off-track (muted) vs paper | `#526575` / `#FFFFFF` | 6.04 | `#A1B1C9` / `#1B2D3A` | 6.51 |

Unit/corridor separation on the map and card borders are far below 3:1 in both themes. Unselected chips and the Directory search field are delimited only by a `line` border on `paper`.

The contrast table in `docs/mobile-ux-research.md` L41-44 uses older hex values (`#172B4D`, `#637189`, `#275DD8`, `#19283D`) that no longer match `theme.ts`.

### 9.4 Dynamic Type / font scaling

- UI text scales without limit (no `allowFontScaling={false}`, no global `maxFontSizeMultiplier`).
- Most containers use `minHeight` rather than fixed height, and several rows set `flexWrap`, which supports growth.
- Risk points at large sizes (from code, untested): `numberOfLines={1}` on 5 texts (home cards, "Now" sub-row, nav meta); fixed-width 210 discovery cards; home sheet `travel` computed from a fixed 62-pt row estimate (list scrolls instead); `topInset` hard-coded to 68 in preview (`App.tsx` L293) regardless of badge height; fixed 48 x 48 instruction icon tile; three action buttons in one row in the nav panel (row has `flexWrap`).
- Icons do not scale with text size.
- No layout switch for accessibility sizes (for example stacking buttons vertically).

### 9.5 Reduced motion, transparency, contrast

- Reduce Motion: honoured app-wide (section 4), plus an in-app switch.
- Reduce Transparency (iOS) and Increase Contrast / High Text Contrast: honoured by `GlassSurface` only (opaque fill, stronger border). No high-contrast palette exists; text and map colours do not change.
- Colour is not the only signal for selection in most places (icons/text change), but map unit categories are distinguished by tint alone and the "current step" in `RouteStepsSheet` adds text ("Current step").
- No bold-text, grayscale or colour-inversion handling. No RTL considerations seen.

---

## 10. Platform handling

`Platform.OS` appears in 6 files, 12 lines:

| Location | iOS | Android |
|---|---|---|
| `App.tsx` L297-302 | Not rendered | Extra top `SafeAreaView` strip filled with `theme.chrome` (navy) behind the status bar |
| `App.tsx` L303-308 | Safe-area edges top, left, right, bottom | left, right, bottom |
| `App.tsx` L314-316 | Status bar style follows theme (`dark` in light mode) | Always `light` |
| `App.tsx` L596-598 | Menu action deferred to `Modal.onDismiss` | Action runs immediately |
| `GlassSurface.tsx` L26-35, L51-53 | Reads Increase Contrast + Reduce Transparency | Reads High Text Contrast |
| `GlassSurface.tsx` L79 | Native Liquid Glass if available | Never glass |
| `SearchOverlay.tsx` L142 | `KeyboardAvoidingView` `padding` | No behaviour (relies on window resize) |
| `Motion.tsx` L25 | Native driver | Native driver (false only on web) |
| `WalkRecorder.tsx` L43, L85 | Platform guard / metadata | Same |

Other platform facts:
- Safe areas: `react-native-safe-area-context` `SafeAreaProvider`/`SafeAreaView` at the root and inside each full-screen `Modal`. The map is laid out inside the safe area, so on iOS the map does not extend under the status bar or home indicator; the safe-area background is `theme.mapBg` on the map tab so the bands blend with the canvas (`App.tsx` L311). Floating sheets sit 8 pt above the safe-area bottom.
- Android navigation bar colour is not configured (no `expo-navigation-bar` or `expo-system-ui`). Screenshots show a white band behind the gesture pill in both light and dark home (05-home-dark.png has a white strip under a dark UI) and a black band in the search modal.
- Screenshots show a black Android status bar area, not the `#142D44` strip the code specifies; cause not determined from code.
- No Android ripple, no Material-specific components, no iOS-specific components (no native context menus, action sheets, large-title navigation bars, or SF Symbols). The UI is the same custom design on both platforms; the only native-feeling divergence is Liquid Glass on iOS.
- `Switch` is the one native control used (custom track/thumb colours).
- App config (`app.json`): portrait only, `userInterfaceStyle: "automatic"`, `supportsTablet: false`. **No `icon`, `splash`, or Android `adaptiveIcon` is configured**, and `assets/` contains only `sandton-reference.png`.
- iOS native build status: `ios-simulator` EAS profile only; `BUILD_CHECKS.md` L26 says existing standalone iOS builds predate the SDK 58 upgrade and physical iPhone runtime is unverified. Runtime verification has been on an Android API 34 emulator in Expo Go.

---

## 11. UI-relevant dependencies

Present (`package.json` L20-45):

| Package | Version | Role |
|---|---|---|
| expo | ~58.0.23 | Runtime |
| react-native | 0.88.1 | |
| react | 19.3.0 | |
| react-native-reanimated | 4.7.1 | Sheets, map camera, layout animations |
| react-native-worklets | 0.13.0 | Reanimated 4 runtime |
| react-native-gesture-handler | ~3.3.0 | Map and sheet gestures |
| react-native-svg | 15.16.0 | Map and icons |
| react-native-safe-area-context | ~5.11.1 | Insets |
| expo-glass-effect | ~58.0.5 | Liquid Glass |
| expo-haptics | ~58.0.7 | Haptics |
| expo-status-bar | ~58.0.4 | Status bar style |
| expo-camera | 58.0.14 | QR checkpoint scanner |
| expo-sensors, expo-file-system, expo-sharing | 58.x | Walk recorder (dev) |
| @react-native-async-storage/async-storage | 2.2.0 | Saved/recent places, venue cache |
| @expo/dom-webview | ~58.0.2 | Listed; no usage found in `src/` |

Notably absent:
- Navigation: no `@react-navigation/*`, `expo-router` or `react-native-screens` (so no native stack transitions, swipe-back, or native sheet presentation).
- Bottom sheet: no `@gorhom/bottom-sheet` or similar.
- Rendering: no `@shopify/react-native-skia`; no map SDK (MapLibre, Mapbox, react-native-maps).
- Type: no `expo-font` or custom font files.
- Icons: no `@expo/vector-icons` usage, `expo-symbols`, or third-party icon set.
- Images: no `expo-image`; the app renders no raster images at all (no logos, photos or illustrations).
- Effects: no `expo-blur`, `expo-linear-gradient`, masked view.
- Animation assets: no Lottie or Rive.
- Lists: no FlashList (uses `FlatList`/`SectionList`/`ScrollView`).
- Keyboard: no `react-native-keyboard-controller`.
- System UI: no `expo-system-ui`, `expo-navigation-bar`, `expo-splash-screen` configuration.
- Other: no `expo-speech` (no voice guidance), no `expo-location`, no styling library (plain `StyleSheet`), no Storybook or visual regression tooling. Tests are a Node script (`scripts/test-mobile-ux.cjs`) covering routing, viewport, camera and place memory, not rendering.

---

## 12. Observed weaknesses and rough edges

Each item separates **Observation** (verifiable from code or screenshots) from **Opinion** (auditor's judgement).

1. **Token system is partial.**
   Observation: `space` and `radius` are never imported; 15 distinct radii and 13 font sizes are literals; 43 colour literals sit outside the theme; 7 colour tokens are unused.
   Opinion: visual rhythm depends on per-file discipline; near-duplicate values (radii 22/23/24/25/26; sizes 13/14/15/16/17) make the UI feel slightly uneven and are costly to retune.

2. **Three unrelated "sheet" implementations, one draggable.**
   Observation: only `MapHomeSheet` responds to drag, only from a 28-pt grabber row, with two detents and a maximum travel of 320 pt; `DestinationSheet` cannot be dragged or swiped away; steps/search are full-screen modals.
   Opinion: this is the largest gap against the Apple Maps / Google Maps interaction model, where the place card is a continuously draggable multi-detent sheet.

3. **Camera does not track sheet drag.**
   Observation: controls follow the sheet on the UI thread, the map reframes only after release with a 420 ms timing (`IndoorMap.tsx` L116-120, L240).
   Opinion: reads as a two-step motion rather than one coordinated movement.

4. **No exit animations and several hard cuts.**
   Observation: no `exiting` props; preview -> guidance, tab changes, theme change, floor change and label reveals are instantaneous; `MotionSurface` slides 10-12 pt without fading.
   Opinion: entrances are polished but departures and state changes are abrupt, which undercuts a premium feel.

5. **Mixed animation stacks.**
   Observation: RN `Animated` in `Motion.tsx`, Reanimated elsewhere, plus `Modal` built-ins with platform-default curves.
   Opinion: timing curves cannot be unified while three systems are in play.

6. **Map figure/ground contrast is very low.**
   Observation: unit fill vs plate 1.13:1 (light) and 1.25:1 (dark); unit stroke vs fill 1.19:1 / 1.28:1; about 128 of 141 units share one grey. Screenshots 01 and 05 show a uniform grid of faint rectangles.
   Opinion: the map reads as a wireframe; corridors (the walkable space) are not visually distinct from shops, which is the core legibility task of an indoor map.

7. **Map labels: no collision handling, hard-switch visibility, 9-10 pt size, no halo.**
   Observation: thresholds only (`MapCanvas.tsx` L128, L278-284). In screenshot 02 the selected "Woolworths" label is rendered much smaller than neighbouring labels because selected labels are constrained to the unit footprint (L251, L276-277).
   Opinion: the selected destination's label becoming the smallest on screen is the opposite of the intended emphasis.

8. **Route and marker styling is plain.**
   Observation: flat single-colour polyline, sharp polyline joins, no draw-on animation, no glow or gradient; position halo is static; pin has no shadow.
   Opinion: functional, but lacks the depth cues common in current consumer map apps.

9. **Icon set is small, outline-only and semantically overloaded.**
   Observation: 35 hand-inlined paths, fixed 1.7 stroke that scales with size (about 1.0 to 2.5 pt rendered), three different stroke conventions, sliders-for-settings, pin-with-plus for arrival, check-for-saved, `layers`/`locate` reused for unrelated settings.
   Opinion: icons are the least "designed" layer and several will be misread.

10. **Glass is limited to small controls and unverified.**
    Observation: 7 call sites, none on the main sheets; Android and older iOS get a 96%-opaque fill with no blur; iOS appearance never checked on a device (`BUILD_CHECKS.md` L26).
    Opinion: on most devices the app currently has no translucency at all, so "Liquid Glass" is not yet a real part of the look.

11. **Pressed-state feedback is inconsistent.**
    Observation: three different patterns plus about ten buttons with none; no Android ripple.
    Opinion: noticeable when moving between the menu, sheets and lists.

12. **Haptic vocabulary is minimal.**
    Observation: only `selection` and `success`; no haptic on same-floor turns, sheet snap during drag, errors or QR scan success.
    Opinion: guidance, the moment haptics matter most, is nearly silent.

13. **No navigation container.**
    Observation: tab switch unmounts the map (camera state lost), no transitions, no iOS swipe-back, no native sheet presentation; "Back to map" is a text row rather than a navigation bar.
    Opinion: secondary screens feel like a different, simpler app.

14. **Connected (real-API) venue screen is visually a developer form.**
    Observation: unstyled `Text`, bordered `Choice` buttons, map squeezed to half the screen with `topInset={0} sheetHeight={0}`, no icons/motion/haptics, no keyboard avoidance (`ConnectedVenueScreen.tsx` L475-487).
    Opinion: the product's real states (loading, offline, reroute, floor confirm) exist only here and have no designed presentation yet.

15. **Main demo flow lacks loading, error and offline designs.**
    Observation: the Sandton flow is fully synchronous; no skeletons, toasts or banners exist as components.
    Opinion: these patterns will need to be designed from scratch when the main flow becomes data-backed.

16. **System chrome is unmanaged on Android.**
    Observation: screenshots show a white navigation-bar band under the dark theme and a black one under search; status bar band is black.
    Opinion: breaks the full-bleed map impression.

17. **No brand assets.**
    Observation: no app icon, splash screen, custom typeface, logo artwork or imagery; the "atlas" mark is a three-stroke "A".
    Opinion: identity currently rests on colour alone.

18. **Demo wording dominates the UI.**
    Observation: "Demo venue", "Demo start", "Start demo walk", "Demo paused", "Indoor demo", "Explore the demo", "Demo / <category>", "Demo tenant", "End demo walk".
    Opinion: honest and intentional for the fixture, but it will read as unfinished in any premium presentation; worth separating from the visual design work.

19. **Documentation drift.**
    Observation: `docs/mobile-ux-research.md` cites react-native-maps, four type sizes, older hex values and older timings; `docs/sandton-demo-map.md` L17 describes navy/lime chrome and a tab dock that are no longer mounted; `DESIGN_SYSTEM.md` is 15 lines of prose with no token tables.
    Opinion: there is no current written design specification to design against; `theme.ts` and the component styles are the source of truth.

20. **Dead code carries the previous visual language.**
    Observation: `BottomTabBar`, `FloatingSearchBar`, `highlight` tokens, four identical `route*` tokens, unused `hasSheet` prop.
    Opinion: safe to remove; it obscures what the current design actually is.

### Strengths worth preserving (observation)

- Text contrast is strong in both themes (all primary pairs >= 5.4:1; one failing pair found).
- Reduced-motion handling is thorough and combines OS and in-app preferences.
- Every touchable has a role; icon-only buttons are labelled; step changes are announced.
- Hit targets are consistently 44-48 pt.
- Camera modes (floor / route / follow / manual) are explicit, and overlay heights are measured and fed into camera padding.
- Map interaction runs on the UI thread with hysteresis on label mounting.
- Springs use `overshootClamping` and gestures cancel running animations, so motion is interruptible.
