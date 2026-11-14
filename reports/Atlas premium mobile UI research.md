# Fix the map before adding glass

Atlas will feel premium fastest by fixing four things the audit found in its own code, and none of them is Liquid Glass. They are a map whose shops and corridors are almost indistinguishable (**1.13:1** contrast), three unrelated sheet implementations of which only one drags, a token file whose spacing, radius and type scales are never used, and unmanaged Android system chrome with no app icon or splash screen. The 2025-26 redesigns of Apple Maps and Google Maps converge on continuous map context, one dominant number per screen, smaller guidance chrome and landmark phrasing, and Atlas already has the architecture to match them. For a market you describe as about 82% Android, glass is an iOS-only enhancement: Apple restricts it to floating controls, has made it more opaque with each release, and Expo's `GlassView` falls back to a plain view on Android. The React Native work is mostly consolidation inside the stack Atlas already ships (Reanimated 4.7, Gesture Handler 3.3, expo-haptics). The largest unknown is performance: nothing has been measured on a physical device, and one 2026 case study shows budget 120 Hz Android phones janking on code that looks smooth elsewhere. Two premises in the brief need correcting. Lime no longer appears in any mounted component, and the 82% Android figure is your input, which the notes do not source.

**How to read the evidence.** Linked claims come from the researchers' sources. I mark claims seen only in a search-result snippet as "snippet", and those need re-verification before you rely on them. Facts about Atlas's code come from the [UI audit](../research_notes/Atlas%20premium%20mobile%20UI%20research/current_atlas_ui_audit.md), cited as "audit §N". The audit was read-only: nothing was run on a device, and the marketing screenshots it used are one iteration behind the code. Numbers labelled as estimates or judgement are the researchers' or mine and have no source behind them.

## One sheet with three detents closes the biggest interaction gap

The outdoor leaders have converged on the same moves. Google's 2025 redesign turned place listings into sheets with rounder corners, kept a sliver of map visible above a fully raised sheet, and moved dismissal to an "x" at the sheet's top-right ([9to5Google](https://9to5google.com/2025/03/07/google-maps-iphone-sheet-redesign/)). Apple's iOS 26 Maps shrank turn instructions into "a smaller pop-up bar" and made ETA, travel time and distance more prominent ([MacRumors](https://www.macrumors.com/guide/ios-26-maps/)). Google's route card now leads with a much larger duration, then an "Arrive hh:mm" line, then distance ([9to5Google](https://9to5google.com/2025/03/31/google-maps-directions-redesign/)). The pattern is less chrome and bigger numbers.

Atlas diverges most at the sheet. The audit found **three unrelated sheet implementations**, with no shared code (audit §3):

- **`MapHomeSheet`** is the only draggable one. It drags only from a 28-pt grabber row, has two detents, and never covers more than about a third of the screen.
- **`DestinationSheet`** has no grabber, no detents and no swipe-to-dismiss.
- **Route steps and search** are opaque full-screen modals.

Apple's guidance describes the target: a nonmodal sheet with a medium detent for progressive disclosure, a grabber on every resizable sheet, expansion when content is scrolled, and "only one sheet at a time" ([Apple HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)). NN/g adds cautions from observed usability problems: users often overlook the grabber, so a visible close button is needed, Back must dismiss, and sheets must not stack ([NN/g](https://www.nngroup.com/articles/bottom-sheet/)).

My recommendation, building on the researchers' inference, is one persistent sheet component whose content swaps by state (home, destination, route preview, guidance, steps). It should drag from its whole surface and have three detents, with the top one stopping short of the status bar. No source publishes detent fractions for Apple or Google Maps, so the exact heights are design judgement to tune on a device.

Mapbox's drop-in UI gives the state model to build around. It has five explicit states (free drive, destination preview, route preview, active guidance, arrival), each with a fixed component set ([Mapbox Android](https://docs.mapbox.com/android/navigation/v2/guides/drop-in-ui/navigation-states/)). Atlas has the first four. Its arrival is a text variant inside the destination sheet, and its main flow has no off-route, recalculating or position-lost states (audit §2.2).

The guidance banner should follow Mapbox's hierarchy:

- **Primary line:** the next manoeuvre.
- **Tertiary line:** the manoeuvre after next, shown only when it follows soon. Indoors, turns chain within metres, so this line matters more than outdoors.
- **Expansion:** tap or swipe the banner to open the full step list ([Mapbox iOS](https://docs.mapbox.com/ios/navigation/guides/turn-by-turn-navigation/user-interface/)).

Phrasing should move from distances to landmarks. Google's November 2025 release says "turn right after the Thai Siam Restaurant", highlights the landmark on the map, and justifies it on the grounds that distance cues are hard to judge ([Google](https://blog.google/products/maps/gemini-navigation-features-landmark-lens/)). The academic support is real but thin. Snippet-level findings suggest one highly salient landmark per instruction beats four, and that maps showing only key landmarks lower cognitive load. The researchers did not read those papers in full, so I treat this as a direction to test.

Two cheaper fixes belong in the same pass:

- **Keep the map mounted.** Switching tabs currently unmounts the map and loses camera position (audit §2.1).
- **Persist preferences.** Dark mode, haptics and step-free settings reset on every restart. Mappedin's March 2026 update moved its accessibility switch into the route-options header (snippet), which argues for a persistent step-free toggle on Atlas's route preview.

## Design the Android surface first; glass is an iOS garnish

Apple's rule is unambiguous. Liquid Glass "forms a distinct functional layer for controls and navigation elements" that floats above content, with the instruction "Don't use Liquid Glass in the content layer" ([Apple HIG: Materials](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json)). Session notes add that glass should not be stacked on glass ([WWDC25 219 notes](https://wwdcnotes.com/documentation/wwdc25-219-meet-liquid-glass/)).

Apple has since retreated toward opacity. iOS 26.1 added a Tinted option (snippet), and in iOS 27 "the Default setting is more tinted than iOS 26's Clear", with a reviewer still reporting "severe legibility issues" at the clearest setting ([MacStories](https://www.macstories.net/stories/ios-and-ipados-27-review/2/)). Atlas's current split is therefore already correct, and I would not extend glass to the sheets. The audit found glass on seven small controls and solid sheets (audit §8).

On Android, `GlassView` "will fallback to regular `View`" ([Expo](https://docs.expo.dev/versions/latest/sdk/glass-effect/)). Atlas's fallback is a 96%-opaque fill with no blur, and its iOS glass has never been verified on a device (audit §8). Android columnists dislike iOS-style glass ported across (snippet, opinion). The better Android model is an opaque tonal surface with elevation under the same floating layout.

Material 3 Expressive supplies the one borrowable idea. Google's research covers 46 studies and more than 18,000 participants, and found key elements were spotted up to **4x faster** when emphasised by size, colour and containment. The same article warns that the approach is not one-size-fits-all and that "no amount of emotion can compensate for a lack of clarity" ([Google Design](https://design.google/library/expressive-material-design-google-research)). Apple's colour guidance points the same way: colour the background of the primary action and "don't add color to the backgrounds of multiple controls" ([Apple HIG: Color](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json)). For Atlas that means one emphasised action per state (Directions, Start, End), which is where a revived lime belongs.

The brief describes a navy, cobalt and lime palette, but the audit found lime only in two dead components (audit §1.1). If lime returns, use it as a fill with dark text on top. Lime text on white reportedly sits near 1.2:1 (snippet from a weak source). You can verify that in minutes with the audit's own contrast method.

The foundations need more work than the surface. The audit's token findings (audit §1) are:

| Token group | State in code |
|---|---|
| Spacing and radius | `space` and `radius` are defined but never imported |
| Radii | 15 distinct literal values, including 22, 23, 24, 25 and 26 |
| Font sizes | 13 distinct literal values |
| Colour | 43 literals outside the theme, 34 of them in the map canvas |
| Pressed states | Three coexisting patterns, about ten buttons with none, no Android ripple |

Sources for the fixes:

- **Type scale.** System fonts remain a sound choice. Apple's published scale (11, 12, 13, 15, 16, 17, 20, 22, 28, 34) is a fully specified ladder to collapse onto ([Apple HIG: Typography](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json)). If you later want a brand face, Inter is OFL-licensed with tabular numerals ([rsms.me](https://rsms.me/inter/)). I would defer that: a custom font adds work and fixes none of the audit's findings.
- **Nested corners.** Use the concentric rule, outer radius equals inner radius plus padding ([Jakub Krehel](https://jakub.kr/work/concentric-border-radius)).
- **Shadows.** Atlas's shadow colour is hard-coded navy and unchanged in dark mode (audit §1.5). Material 3 expresses dark elevation through surface tone instead (snippet).
- **Spacing and radius values.** The researchers' suggested scale (4-pt spacing; radii 8, 12, 16, 24 and pill) is their synthesis, not a citation.

Icons are the least designed layer. The audit found 35 hand-inlined outline paths, three stroke conventions, a sliders glyph standing in for settings, a pin-with-plus for arrival, and no filled variants for selected states (audit §7). Phosphor is listed as MIT-licensed with six weights including fill (snippet), which would cover selected states under one licence. Confirm the LICENSE file before shipping.

The cheapest premium signals are entirely missing (audit §10):

- **No app icon, adaptive icon or splash screen** is configured.
- **Navigation-bar bands are wrong.** Screenshots show a white band under the dark theme and a black band under search.

The notes contain no sourced recipe for the Android system-bar fix. The audit records only that `expo-system-ui` and `expo-navigation-bar` are absent, so this needs a short investigation of its own.

## Consolidate motion and haptics inside the stack you already ship

Atlas's motion is better than its audit weaknesses suggest. Springs are interruptible, reduced motion is honoured almost everywhere, and the camera, markers and route trim run on the UI thread (audit §4, §6.10). Three gaps remain.

**No exit animations, and several hard cuts.** Preview to guidance, floor changes and label reveals are instantaneous (audit §4). No retrieved source links motion quality to "premium" perception in navigation apps, and the researchers call this an untested assumption. The practitioner guidance is still consistent:

- Scale pressed buttons to 0.97.
- Never animate from scale 0.
- Use ease-out for entrances and exits.
- Keep UI animations generally under 300 ms ([Emil Kowalski](https://emilkowal.ski/ui/7-practical-animation-tips)).
- Make exits subtler than entrances ([Jakub Krehel](https://jakub.kr/writing/details-that-make-interfaces-feel-better)).

**Three animation systems coexist.** React Native `Animated`, Reanimated, and built-in `Modal` transitions each bring their own curves, so timings cannot be unified (audit §4).

**The sheet ignores release velocity.** It uses velocity to pick a detent but does not pass it into the spring (audit §3). Reanimated's `withSpring` accepts `velocity` directly ([Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/)). The same docs give defaults of damping 120, stiffness 900 and mass 4, which the researchers calculate to be critically damped and therefore a safe no-bounce default.

Two sets of numbers in the notes should not be hard-coded. The Material 3 Expressive spring tokens come from unofficial ports that disagree (0.73 versus 0.8 damping). Apple's "shipped" spring values come from an unverified third-party page.

### Sheet library: keep the custom sheet

| Option | What the notes establish | Fit for Atlas |
|---|---|---|
| Custom Reanimated sheet | Atlas already owns the shared value that moves floating controls during a drag (audit §3) | Best. Camera padding can read the same value on the UI thread, fixing the "camera reframes after release" two-step |
| `react-native-true-sheet` v4 | Real Liquid Glass sheets, system keyboard handling and a Reanimated position stream on iOS ([True Sheet](https://sheet.lodev09.com/guides/reanimated)) | Its benefits land on iOS. Its Android behaviour over an always-interactive map was not retrieved |
| `@gorhom/bottom-sheet` | Docs still state compatibility with Reanimated v1-3 ([gorhom](https://gorhom.dev/react-native-bottom-sheet/)) | Weakest. No stated Reanimated 4 support |
| True Sheet on iOS, custom on Android | The researchers note this doubles QA | Poor for a solo developer |

My position is to unify on the custom sheet for now and revisit True Sheet when iOS becomes a priority.

### Haptics

Atlas uses only `selectionAsync` and success notifications, and guidance is nearly silent: same-floor turns, QR scan success and errors produce nothing (audit §5).

On Android, Expo's docs say `impactAsync` is simulated with the raw vibrator and recommend `performAndroidHapticsAsync`, which uses the device haptics engine and needs no permission ([Expo haptics](https://docs.expo.dev/versions/v58.0.0/sdk/haptics/)). Google's principle is to favour "clear" haptics over "buzzy" ones ([Android](https://developer.android.com/develop/ui/views/haptics/haptics-principles)).

A single platform-split helper is the right shape. The specific event-to-effect mapping in the notes (`Segment_Tick` for detents, `Confirm` for arrival, `Reject` for off-route) is the researchers' suggestion, and no source prescribes haptics for pedestrian turn-by-turn. No reliable source was found on Samsung mid-range actuator quality, so tune it on the device. Because iOS silences haptics in Low Power Mode, every haptic needs a visual twin.

### Performance is the largest unknown

No physical-device frame-rate measurement has been done (audit §6.10). Three findings make that urgent:

- **Animated-component ceiling.** Reanimated's guideline is about **100** simultaneously animated components on low-end Android ([Reanimated performance](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)). Every Atlas label and marker owns its own animated-props worklet, and about 128 detail labels mount above zoom 1.06 (audit §6.3). Atlas probably crosses the guideline when zoomed in. That is my inference from the two figures.
- **High-refresh budget phones.** Margelo profiled a sub-$100 phone with a 120 Hz panel and found 85% janky frames at 120 Hz against 15% at 60 Hz for the same workload ([Margelo](https://margelo.com/blog/profiling-skia-reanimated-low-end-android)). That study concerned Skia. It shows the risk of testing only at 60 Hz and tells you nothing about SVG.
- **Walk loop on the JS thread.** Atlas drives the walk with a 500 ms `setInterval` that re-renders the app root (audit §4). Margelo measured per-frame state updates at 8-15 ms of UI-thread blocking. Position should flow through shared values.

The same study argues against a pre-emptive Skia migration. Skia's default Android canvas was itself the frame-pacing trap. Measure first.

Other library findings, all lower priority:

| Item | Finding | Verdict |
|---|---|---|
| Reanimated shared element transitions | Docs call them "not yet production ready" ([Reanimated flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)) | Leave off |
| `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` | Up to 4x FPS in an artificial benchmark, but breaks `Pressable` hit-testing under animated transforms | Trial only after measuring |
| Gesture Handler 3 `GestureDetector` | Its host view "can break components that depend on view hierarchy, such as SVG" ([Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3/)) | Check Atlas's map wrapper against this |
| Native tabs, Lottie, Rive | Solve problems Atlas does not have | Skip |

## Separate corridors from shops, then make labels behave

The map is the product, and the audit's harshest finding is there. In light theme, unit fill against the floor plate measures 1.13:1 and unit stroke against fill 1.19:1. About **128 of 141 units** share one "unconfirmed tenant" grey, so the map reads as a uniform grid of faint rectangles (audit §6.2). The audit applies WCAG's 3:1 expectation for meaningful graphical boundaries.

Vendors who publish their styling use a recognisable recipe. Mapbox's indoor guide gives pale category tints at 0.9 opacity with a distinct corridor colour, and builds depth from thin walls and a shallow slab; it does not extrude whole units ([Mapbox](https://docs.mapbox.com/help/dive-deeper/indoor-mapping/)). Atlas already fakes shallow depth with a wall-face offset.

The fix is tonal and has two parts:

- **Make the walkable network the clearest surface.** Because roughly 90% of units have no confirmed category, category colour cannot carry the hierarchy. The corridor-versus-unit lightness step has to.
- **Derive each unit's stroke from its fill.** Felt's cartographer recommends this so that outline and fill stay in one colour family ([Felt](https://felt.com/blog/cartography-tips-for-designing-web-maps)). The researchers' "10-20% darker" figure is their own.

Google's basemap refresh is the caution on the other side: a calmer palette that flattened hierarchy drew public criticism (snippet). In dark mode, snippet-level research says to preserve the light scheme's lightness structure and not invert it.

### Labels

Labels fail in four ways (audit §6.3, §12):

- Base sizes are 9-10 pt.
- There are no halos.
- Visibility is a hard on/off switch at zoom thresholds, with no collision handling.
- The selected destination's label shrinks to fit its unit and becomes the smallest on screen.

Axis Maps puts minimum screen type at about 9-10 px and asks for at least a two-point step between ranks ([Axis Maps](https://www.axismaps.com/guide/labeling)). So Atlas sits at the floor with no hierarchy above it. Fix the selected-label bug first, because it inverts the intended emphasis and is a one-line constraint.

Mappedin documents the behaviour to copy ([Mappedin](https://www.mappedin.com/resources/blog/feature-101-floating-labels/)):

- Camera-facing labels at constant size.
- Collision tested against a screen grid, not pairwise.
- Labels hold their place during pan and are re-solved only on zoom.
- A slightly transparent pin where text cannot fit, hinting that zooming reveals more.

Esri's advice on thin halos matched to the background colour is snippet-level. The researchers' suggested label ramp (10-11, 12-13 and 14-16 px) and cross-fade timings are their estimates.

### Route line and position marker

The route line is already conventional. Mapbox draws a casing, a main line and a travelled-portion treatment (snippet), and Atlas has all three plus direction chevrons (audit §6.4). The audit's "plain" verdict concerns sharp joins and missing draw-on. The notes found no source for route widths, dash speeds or chevron specs, so the researchers' suggested widths are estimates. I rank route polish below everything above.

The position marker is the better investment. Atlas's halo is static and "is not an accuracy radius" (audit §6.5). Mappedin's documented rules are a ring showing accuracy in metres, a grey dot after 30 seconds without updates, and hiding the dot above 50 m error ([Mappedin Blue Dot](https://developer.mappedin.com/web-sdk/blue-dot)). Two older lab findings, both snippet-level, add nuance: uniform hard-edged circles are read more accurately than faded ones, and in a degraded-GPS field test users preferred uncertainty shown on the path segment. Atlas's QR checkpoint is the natural recovery action when the dot goes stale. The right hide threshold for a mall is unknown, and the researchers' "a corridor width or two" is a guess.

### Camera, 3D and amenities

- **Orientation.** The evidence does not settle heading-up versus north-up. One 2025 study found heading-up faster for self-localisation, and others found small or no effects (all snippets). Mappedin's `position-and-path-direction` mode rotates to the route direction, not the compass, which suits dead reckoning. Rotation is new machinery for Atlas's SVG camera, so treat it as an experiment to test in a mall.
- **3D.** The evidence is mixed and mostly from 2013-2017. Skip it.
- **Amenity glyphs.** Facilities currently render as Unicode characters (audit §6.3). The Maki and Temaki icon sets are listed as CC0 (snippet; one mirror lists a different licence), and AIGA/DOT pictograms are described as public domain (snippet). Check the licences, then draw proper glyphs.
- **Brand logos.** These need permission through the mall or tenant. The only legal sources retrieved are German and US summaries.

## A prioritised action list for one developer

Effort sizes are my rough judgement (S = about a day or two, M = about a week, L = multiple weeks) and are not sourced. "Basis" says whether the action rests on sourced guidance or on judgement. The order puts measurement and no-regret fixes first, then the interaction model, then refinement.

| # | Action | Audit weakness | Basis | Effort |
|---|---|---|---|---|
| 1 | Profile a release build on a physical mid-range Samsung at its 90/120 Hz setting, zoomed in with detail labels mounted. This gates items 5, 12 and any Skia decision | §6.10, no device measurement | Sourced risk (Reanimated ceiling, Margelo) | S |
| 2 | Fix Android system bars so the map is full-bleed in both themes. Add app icon, adaptive icon and splash | §12 items 16, 17 | Audit only. Fix path not researched | S |
| 3 | Raise corridor-versus-unit contrast toward 3:1, derive unit strokes from fills, and move the 34 map colour literals into the theme. Re-check dark mode separately | §12 item 6 | Sourced (Mapbox, Felt). Exact values are judgement | S-M |
| 4 | Fix the selected-label shrink. Give labels a size hierarchy above the 9-10 pt floor and cross-fade threshold changes | §12 item 7 | Sourced (Axis Maps). Sizes are estimates | S |
| 5 | Wire up tokens: collapse 13 font sizes and 15 radii onto one scale, import `space` and `radius`, delete dead components and unused tokens | §12 items 1, 20 | Sourced scale (Apple HIG). Spacing and radius values are synthesis | M |
| 6 | Use one pressed-state pattern everywhere (scale 0.97 plus Android ripple) and cover the ten or so buttons with none | §12 item 11 | Sourced (Kowalski, Gesture Handler 3) | S |
| 7 | Build one sheet component: content swaps by state, whole-surface drag, three detents, release velocity into the spring, visible close button, Android Back steps states | §12 item 2 | Sourced (Apple HIG, NN/g). Detent heights are judgement | L |
| 8 | Drive camera padding from the sheet's shared value on the UI thread | §12 item 3 | Judgement. No source retrieved | M |
| 9 | Add a platform-split haptic helper using `performAndroidHapticsAsync`, with turn, off-route, QR-success and error cues, each paired with a visual | §12 item 12 | API sourced (Expo). Mapping is judgement | S |
| 10 | Rework guidance content: one dominant number, an "Arrive hh:mm" line, a "then" line for chained turns, one landmark per instruction, a real arrival state | §2.2 missing states | Sourced (Apple, Google, Mapbox). Landmark research is snippet-level | M |
| 11 | Motion pass: exit animations, preview-to-guidance cross-fade, move `Motion.tsx` onto Reanimated | §12 items 4, 5 | Practitioner guidance. Premium effect unproven | M |
| 12 | Move walk and position updates off the 500 ms React state loop into shared values | §4 | Sourced (Margelo) | M |
| 13 | Replace the icon set with one licensed family that has filled variants. Fix the settings, arrival and saved glyphs. Draw amenity pictograms | §12 item 9 | Licences are snippet-level. Verify | M |
| 14 | Honest position marker: accuracy ring, stale grey state, hide-and-prompt-QR state | §6.5 | Sourced (Mappedin). Thresholds are judgement | M |
| 15 | Keep the map mounted across tabs, persist settings, and put a step-free toggle on route preview | §12 item 13, §2.1 | Audit. Toggle pattern is snippet-level | S-M |
| 16 | Bring the connected-venue screen (loading, offline, reroute, floor confirm) up to the main flow's design | §12 items 14, 15 | Audit only | L |
| 17 | Label collision and priority with pan-stable solving and dimmed "zoom for more" pins | §12 item 7 | Sourced (Mappedin) | L |

I would defer or skip the following:

- **Glass on sheets, or any Android port of glass.** This runs against Apple's guidance and Android reception.
- **A Skia or MapLibre migration** before item 1 says it is needed.
- **Tilt and 3D, a custom typeface, shared element transitions, native tabs, Lottie or Rive, and brand logos.** None addresses an audit finding.
- **Heading-up rotation,** until it has been tested in a mall.

## Conclusion

The research changes the framing of the question. "Premium" in current navigation apps is described by reviewers in terms of restraint: continuous map context, one large number, quiet guidance and honest position display. Nobody retrieved a study tying any of those details to measured outcomes. Atlas's weaknesses are structural and local, so the highest-return work is finishing the system the code already implies. The platform design languages matter mostly as constraints: keep glass small on iOS, keep one emphasised action on both platforms, and give Android a surface that was designed for it.

Three questions remain open, and only device time answers them:

- Does the SVG map hold frame rate on a mid-range Samsung at high refresh? That decides whether the rendering approach survives.
- What do Samsung actuators do with the Android haptic constants?
- Does route-direction-up orientation help real shoppers?

The evidence base for indoor map design on phones is thin and mostly pre-2020. Atlas's own in-mall tests, timed to the first confident step, will be better evidence than most of what is published.
