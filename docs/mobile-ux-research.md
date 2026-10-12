# Atlas mobile UX research and implementation

Researched 2026-10-12. Scope: iOS/Android React Native indoor wayfinding for visitors choosing a place, understanding its floor and following a route. Atlas's signature is its indoor route and floor context; motion should support that task.

## Primary-source findings

| Source                                                                                               | Relevant pattern                                                                                      | Atlas application                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Google Maps indoor maps](https://www.google.com/maps/about/partners/indoormaps/)                    | Floor switching, recognizable POI symbols and an indoor directory.                                    | Keep explicit G/L1 controls and consistent floor names. Use a horizontal floor control when the available map area is short; enlarge POI labels to a minimum 44-point height.                                  |
| [Apple Maps route overview and turns](https://support.apple.com/en-gb/guide/iphone/iph1b3553719/ios) | Switch between route overview, turn guidance and a list of upcoming turns.                            | Separate overview and follow modes. Show the next instruction, current step and completed steps. Overview frames the route on the visible floor, since floors share schematic coordinates.                     |
| [Waze route steps](https://support.google.com/waze/answer/6273629?hl=en)                             | The top instruction opens written steps and can return to the map.                                    | Make the instruction card an accessible disclosure control. Keep a second Route steps button near the thumb area.                                                                                              |
| [Mapbox navigation camera](https://docs.mapbox.com/android/navigation/guides/ui-components/camera/)  | Distinct following, overview and idle camera states, with data supplied before transitions.           | Use explicit camera modes. Panning suspends automatic framing; Resume restores the current demo floor and following camera. This adopts an interaction pattern; Atlas still uses react-native-maps.            |
| [Google Design: Making Motion Meaningful](https://design.google/library/making-motion-meaningful)    | Motion introduces content, directs attention and communicates results with minimal visual complexity. | A short entrance for a newly selected destination, changed instruction and route-step disclosure. No continuous map pulse or animated directory rows.                                                          |
| [Apple HIG motion](https://developer.apple.com/design/human-interface-guidelines/motion)             | Purposeful, brief, optional and cancellable feedback.                                                 | Native-driver opacity/transforms, immediate actions, stopped animations on interruption, and system/app reduced-motion support.                                                                                |
| [Apple HIG searching](https://developer.apple.com/design/human-interface-guidelines/searching)       | Suggestions reduce typing; visible history needs a clear control.                                     | Device-local saved places and the five most recently opened places. Clear recent history preserves saved places. Saved scope also respects query/category filters.                                             |
| [Apple HIG haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)   | Consistent short feedback for discrete events, optional and paired with visual information.           | Selection feedback for saves and floor changes; success feedback for demo completion. An independent Touch feedback setting disables these events.                                                             |
| [Apple HIG sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)             | Supplementary nonmodal information, progressive disclosure and an obvious dismissal action.           | Scroll details while keeping primary actions outside the scroll area. Retain Close and Android back. Atlas uses native React Native views over the map, rather than claiming a system sheet with drag detents. |

These sources establish useful patterns, not a universal ranking of “best” animations. The exact timings and layouts below are Atlas design decisions, rather than measured competitor specifications. Driving alerts, traffic reports and road-route alternatives require other data; they were not adapted into this indoor demo.

## Design review

Code-based review: **Good**, with runtime verification outstanding. The original native shell already had consistent icons, safe areas, clear demo labels and an uncluttered palette. The main friction was repeated searching, camera reframing after manual exploration, and navigation actions scrolling out of reach.

- **High — motion preference:** System Reduce Motion and the app preference shared one mutable state, so the app switch could override the OS. Separate them and combine with logical OR; when the OS requires reduced motion, explain it and disable the switch. Reference: accessibility.md › Vision and motion.md › Best practices: “Make motion optional.”
- **Medium — camera agency:** Recenter only in an explicit mode. Advancing a demo step updates the position but does not pull a manually panned view away. Reference: designing-for-ios.md › Ergonomics; camera-mode behavior is an adaptation of Mapbox's documented states.
- **Medium — repeated lookup:** Add saved/recent suggestions and history clearing. Reference: searching.md › Best practices: “Provide suggestions to make searching easier.”
- **Medium — action reach:** Move Start/Next/Finish and route-detail actions outside scrolling content. Remove the redundant destination pin badge to give the title and save/close controls more room. Reference: layout.md › Best practices and sheets.md › Best practices.
- **Medium — feedback:** Text and icons communicate selection, completed steps and arrival. Haptics supplement them and may be disabled. Reference: playing-haptics.md › Best practices: “Make haptics optional.”

Apple HIG references above were read from the apple-design skill's local source snapshots as well as the public links; JavaScript-only HIG pages did not expose text through the web reader. Foundations consulted: accessibility, layout, typography, color and designing for iOS. Additional references: motion, haptics, searching and sheets. Platform convention decisions apply to the shared iOS/Android app where appropriate.

## Tokens and motion

Keep the existing paper/navy/blue visual language. System type uses four sizes (12, 16, 24, 32) and two weights (400, 600). Controls retain visible labels or accessibility labels. Primary controls are at least 44 points high; navigation actions are at least 52.

Computed WCAG contrast from source hex values:

| Role                           | Light                      | Dark                       |
| ------------------------------ | -------------------------- | -------------------------- |
| Main text on paper             | #172B4D / #FFFFFF: 14.10:1 | #EDF3FF / #19283D: 13.36:1 |
| Secondary text on paper        | #637189 / #FFFFFF: 4.94:1  | #A1B1C9 / #19283D: 6.83:1  |
| Primary action text/background | #FFFFFF / #275DD8: 5.76:1  | #142135 / #A9C6FF: 9.40:1  |
| Accent on soft surface         | #275DD8 / #EAF0FF: 5.05:1  | #A9C6FF / #253D62: 6.35:1  |

These values verify the named text pairs, not every rendered pixel or all map boundaries.

| Event                               | Motion                                                     | Reduced motion                     |
| ----------------------------------- | ---------------------------------------------------------- | ---------------------------------- |
| New destination/instruction/details | 220 ms ease-out, opacity 0→1, translateY 12→0              | Immediate presentation             |
| Primary button press/release        | Scale 1→0.98 in 80 ms, return in 140 ms                    | Opacity feedback remains; no scale |
| Demo step progress                  | 180 ms native transform with fixed left edge               | Immediate progress                 |
| Camera reframing                    | Native map animation when explicitly following/overviewing | Native map jump                    |
| Save, floor change, completion      | Optional system haptics plus visible text/icons            | Haptic preference is independent   |

Animations do not gate actions. New instructions replace prior motion immediately; unmounting stops animations. The OS preference initially defaults to reduced motion until its async value arrives. There is no perpetual pulse, synthetic walking animation or confetti.

Compact phone layout:

```text
Map preview                 Active demo guidance
Search                      Current instruction → steps
G/L1 + recenter              G/L1 + recenter
Indoor route                Route / demo position
Destination, save, close     Place · step x of y
Estimate · step-free         Progress · next instruction
START (pinned)               NEXT (pinned)
Map / Explore / Settings     Overview/Resume · Route steps
                            Map / Explore / Settings
```

On taller phones the floor controls form a rail. On short map areas they form a row. The design remains focused on phones; the existing iOS configuration does not target tablets.

## State and practical limits

Saved and recent IDs use a versioned, device-local AsyncStorage record. Reads prune unknown/duplicate IDs and recover from malformed content; recent history is capped at five. Actions taken before loading finishes are replayed onto loaded state. Writes are serialized to preserve action order. A failed initial read keeps changes in session state and prevents overwriting an unknown stored record. If persistence fails, an inline note explains that changes may only survive the session. No account sync or visit tracking is implied.

Routes, distances, arrival and position remain explicit illustrative demo states. Voice guidance and live sensors are not activated by these enhancements.

Automated validation covers the existing 18 route/preference cases, persisted-data recovery/pruning, recent ordering/cap, save toggles, independent history clearing and camera framing modes. An additional isolated React 18.2 hook harness with mocked AsyncStorage passed pending-load save/history merging, read-failure preservation, serialized writes and recovery after a write error. This harness checks hook behavior, not native storage or device execution; it is retained in ignored apps/mobile/artifacts/test-place-memory-hook.cjs. Native iOS compilation and runtime limits are recorded in apps/mobile/BUILD_CHECKS.md.

Native layout, VoiceOver/TalkBack behavior, motion smoothness and physical haptics still need a working device/client run. Particularly check small phones and large system text: search with a keyboard, long place names, expanded steps, floor transitions, panning then Resume, interrupted presses, OS Reduce Motion changes, and saving/clearing after a restart. The earlier Expo Go startup failure means screenshots are not evidence for this pass.
