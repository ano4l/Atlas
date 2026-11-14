# Custom indoor map: research and implementation

17 October 2026. Atlas is a native iOS/Android walking navigation app. This pass replaces the outdoor map plugin with a purpose-built indoor demo. The screen's job is to let someone recognise a store, select its actual entrance, and follow the corridor to it across floors.

## What transfers from established map apps

| Primary source | Observed pattern | Indoor implementation |
| --- | --- | --- |
| [Waze: route steps](https://support.google.com/waze/answer/6273629?hl=en) | Prominent next instruction and a written route sequence. | A large direction icon, distance to the next corner, named destination, remaining walking estimate and a route-steps disclosure. |
| [Waze: recent places](https://support.google.com/waze/answer/6262570?hl=en) | Frequently repeated destination lookup benefits from recent places. | Preserve device-local recent and saved destinations in the shared directory. |
| [Google Maps: indoor maps](https://support.google.com/maps/answer/2803784?co=GENIE.Platform%3DiOS&hl=en-GB) | Zoom into indoor geometry, select floors, and tap a place for its details. | Explicit G/L1 controls; every storefront has a name, a selectable polygon and the same directory identity. |
| [Apple Maps: location and heading](https://support.apple.com/en-ie/guide/iphone/iph10d7bdf26/27/ios/27) | Clear location control with north and heading states. | Keep this first floor plan north-up. Exploration pauses following; Recenter and Resume deliberately restore the camera. |
| [Apple HIG: gestures](https://developer.apple.com/design/human-interface-guidelines/gestures) | Familiar touch interactions with accessible alternatives. | Pinch zoom, one-finger pan, double-tap zoom, explicit zoom buttons and an accessible Search/Explore directory for every place. |
| [Expo SDK 57: Reanimated](https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/) | Expo Go includes Reanimated; Expo's Babel preset configures its worklets. | Native gesture and camera transforms operate through shared values rather than React state updates per finger movement. |
| [Reanimated: decay](https://docs.swmansion.com/react-native-reanimated/docs/animations/withDecay/) | Velocity-based movement with bounds. | Bounded pan inertia, cancelled when another gesture or explicit camera action starts. Reduce Motion disables inertia and camera tweening. |

The feature choices are an adaptation, not a claim to reproduce competitor internals, timings or measured frame rates. A walking map emphasises store names, entrances and floor changes. Road incidents, traffic, vehicle speed, lane guidance and visual driving perspective add no useful information to this demo.

## Design decisions

- **Recognisable places:** 24 named shops, 12 per floor. Search, Explore and the vector scene share one fixture. Names never disappear at a zoom threshold. Long names wrap; unit IDs progressively appear closer in.
- **Legible hierarchy:** navy store names on quiet, lightly coloured unit footprints; white concourse; blue active route with white casing; red destination; blue demo position with a static accuracy-style halo. Colour is reinforced by names and marker shape.
- **A clear fictional venue:** Atlas Galleria replaces the geographically anchored Sandton schematic. Familiar store names illustrate the directory; locations and availability are sample data. The demo name and demo position remain visible.
- **Camera agency:** floor overview, route preview, follow and manual exploration are explicit states. The viewport uses measured panel heights so destinations are framed in the unobscured area. Panning and zooming enter manual mode. Changing a demo step does not pull a manually explored camera away.
- **Direct touch:** pinch uses its focal point, so the point under the fingers stays fixed. Double-tap and explicit buttons use anchored zoom. Pan has bounded inertia. The map has no React render loop driven by gesture events.
- **Entrances and turns:** room labels live at the room centre; routing endpoints live at doors. The connected local graph stays in the concourse. Guidance removes redundant collinear graph nodes and creates actual left/right instructions at corners, including lift/escalator transitions.
- **Accessible alternatives:** zoom buttons are 44 by 44 points. Search/Explore exposes every destination as a named native button. Labels use system type; map text compensates for camera scale and respects device text scaling within the unit's space. Very large text is best read in the directory.
- **Two appearances:** map surfaces, names, controls, landscaping and route casing have light/dark variants. Reduced Motion suppresses camera tweening, demo-position movement and inertial panning.

Compact layout:

```text
atlas                       Indoor demo
[ Search shops, food & facilities    ]
                               [ L1 ]
Named units / Central Walk     [ G  ]
Store entrances / amenities     [ ⊙  ]
              Demo position
G · 12 stores                   [ + ]
20 m · demo                     [ − ]
[ Atlas Galleria · directory action  ]
[ ZARA ] [ Food court ] [ Restrooms  ]
Map              Explore       Settings
```

## Files and limits

`fixtures.ts` defines geometry and the complete directory; `viewport.ts` owns framing, focal zoom and polygon hit testing; `IndoorMap.tsx` owns native gesture/camera interaction; `MapCanvas.tsx` draws the scene. The pre-existing local corridor router and app states are retained, with corner-based instructions added.

This is a demo navigation surface, not surveyed geometry, live indoor positioning, spoken guidance or a production spatial-data importer. UI-thread implementation is a performance foundation; actual frame-rate, VoiceOver/TalkBack and physical-device gesture behaviour require device measurements. Bundle and pure-logic checks alone do not prove those qualities.

## Validation on 17 October

Mobile types and Expo compatibility passed. Both iOS and Android Hermes bundle requests succeeded. The pure-logic suite verifies 54 destination/accessibility combinations and every named store's geometry, doorway and selection identity, plus anchored zoom and viewport padding.

The app also rendered in Android API 34 with SDK 57 Expo Go 57.0.9. Native interaction checks completed store selection, route preview, starting guidance, panning into manual mode, advancing without pulling the camera away, Resume, the escalator floor change, actual left/right turns and arrival. The first native review exposed a position-label collision and an over-close short-leg follow view; the implementation now uses a position callout and includes both nearby storefront rows while reserving the controls rail in route framing.

See apps/mobile/BUILD_CHECKS.md for evidence boundaries. The prior iOS EAS release build predates this custom renderer. Native Android screenshots are saved locally under apps/mobile/artifacts/custom-map; they are emulator captures, not browser mockups.
