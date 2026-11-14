# Sandton schematic demo

The active native map is hand-traced from the image supplied in this chat on 2026-10-17. A copy is saved at `apps/mobile/assets/sandton-reference.png`. The app draws editable SVG geometry rather than placing routes over a flat screenshot.

## What is mapped

- The angled Rivonia Road frontage, 5th Street, Sandton Drive and Alice Lane.
- The west gallery, east gallery, south connecting gallery, north approach and circular court.
- 141 approximate spaces. Five use names visible in the reference: Edgars, Mr Price, Woolworths, Checkers Hyper and Clicks.
- Other spaces have generated S-prefixed references. These are demo identifiers, not official mall unit numbers. Close zoom reveals those references; the overview prioritises the anchor stores and shape of the mall.
- The west-side marker is the demo origin. The single level is called Reference level because the image does not establish floor assignments.

The corridor graph follows the visible white galleries. Known stores use illustrative gallery approaches; an unnamed unit ends at the closest mapped gallery. The app explicitly describes its entrance as unconfirmed. Names visible in the image are not a claim about current tenancy, trading hours, accessibility, or the accuracy of entrances. There are no inferred restrooms, lifts or floor changes in this fixture. Distances use an illustrative scale and navigation advances only through explicit demo steps.

## UI direction

Deep navy floating navigation, lime selection accents, cobalt routes, large direction cues and soft category colours give the map a stronger identity. Search, named-store shortcuts, saved places, the complete directory, route estimates and unit details remain directly accessible. The navigation view hides the tab dock to give the map more space. Panel measurements determine camera padding.

The quick category/search/saved pattern follows the workflow described in [Waze's destination search guidance](https://support.google.com/waze/answer/6262563?hl=en). The use of clearly separated foreground controls follows [Apple's materials guidance](https://developer.apple.com/design/human-interface-guidelines/materials). Atlas uses native solid surfaces and SVG; it does not claim to implement Apple's Liquid Glass material.

## Files

- `apps/mobile/src/fixtures.ts`: traced polygons, approaches, corridor centre lines and reference metadata.
- `apps/mobile/src/components/MapCanvas.tsx`: roads, units, progressive labels, destination and route rendering.
- `apps/mobile/src/components/IndoorMap.tsx`: native camera, pan/pinch and zoom threshold changes.
- `apps/mobile/src/map/demo-routing.ts`: local shortest path and walking instructions.

Only camera motion and visible label properties update on the UI thread. Dense unit labels mount when zoom crosses the detail threshold, rather than updating React on every frame. Motion and touch feedback respect the existing preferences.

## Map-first interface (17 October 2026)

The default view follows the west demo position. A bottom search sheet replaces the top search and tab bar. Its grabber supports a tap or vertical drag to collapse suggestions. Suggestions rank locally stored recent selections, then saved places, then known anchor stores; they are not server personalization or invented popularity data. The menu exposes saved places, the directory, a full-map overview, and settings. Search opens over the map and returning from settings keeps map navigation available.

Floating search and menu surfaces use `expo-glass-effect` 57.0.4 with runtime capability checks. Supported iOS devices use regular native glass. Reduce Transparency or Reduce Motion selects an opaque surface; Android and unsupported devices use a readable translucent fallback. Native iOS glass still requires physical-device review. Reference: https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/.

Starting a route plays an accelerated, explicitly labelled demo walk. Position interpolates along the routing steps' straight gallery legs; the camera has a stable local field of view with bounded look-ahead. Completed route portions fade to grey. Pause/continue, manual map exploration, resume following, route overview, and skip-turn controls remain available. The demo pauses while backgrounded or covered by menu/search. This does not read GPS or provide indoor localization. Distances and geometry remain illustrative.
