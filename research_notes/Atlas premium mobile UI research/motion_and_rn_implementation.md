# Premium motion, gestures, haptics, sheets and micro-interactions in React Native / Expo (2026 state)

Research date: 2026-11-14. Target stack: Expo SDK 58, React Native 0.88 (New Architecture), Reanimated 4.7, react-native-worklets 0.13, Gesture Handler 3.3, react-native-svg 15, expo-haptics, expo-glass-effect, custom bottom sheet, custom SVG map canvas.

Notes on method: GitHub stars / licence / last-push dates were read from the GitHub REST API on 2026-11-14 and are cited to the repo URL. "Last release" is given only where the releases endpoint answered (the API rate-limited part-way); otherwise "last push" is given and labelled as such. Where a number comes from a third-party summary rather than a primary source, it is flagged.

---

## 1. Motion principles: springs vs timing, durations, interruptibility, velocity hand-off, what feels "cheap"

### Takeaway
Use springs (critically damped or near it) for anything a finger moves or can interrupt, and short ease-out timing (roughly 125-300 ms) for simple enter/exit and state changes; keep press feedback subtle (scale 0.97) and never start from scale 0. Official Material 3 Expressive token values and Apple's own numeric spring values could not be retrieved from primary sources, so the numbers for those two systems below are third-party and partly conflicting.

### Cited Findings

**Emil Kowalski (primary source, web-oriented but directly transferable)**
- Scale pressed buttons to `0.97` for immediate tactile feedback — [Emil Kowalski, 7 Practical Animation Tips](https://emilkowal.ski/ui/7-practical-animation-tips)
- Never animate from `scale(0)`; start from about `0.9` or higher (his example uses `0.93`) — [Emil Kowalski](https://emilkowal.ski/ui/7-practical-animation-tips)
- Use ease-out for elements entering or leaving; two dropdowns at the same 300 ms feel different, the ease-in one feels slower. Built-in CSS easings are "often too weak"; use stronger custom ease-out curves — [Emil Kowalski](https://emilkowal.ski/ui/7-practical-animation-tips)
- Keep UI animations generally under 300 ms; a 180 ms select feels more responsive than a 400 ms one; remove animation altogether from interactions performed many times a day — [Emil Kowalski](https://emilkowal.ski/ui/7-practical-animation-tips)
- Tooltip example: `transform 125ms ease-out, opacity 125ms ease-out`, from `opacity 0 / scale(0.97)`; subsequent tooltips open with 0 ms — [Emil Kowalski](https://emilkowal.ski/ui/7-practical-animation-tips)
- Make scale animations origin-aware (grow from the trigger, not the centre) — [Emil Kowalski](https://emilkowal.ski/ui/7-practical-animation-tips)
- If a crossfade still feels off, add a small blur (2 px in his example) to mask the transition — [Emil Kowalski](https://emilkowal.ski/ui/7-practical-animation-tips)
- Community-compiled tables attributed to his course give: button press 100-160 ms, tooltips 125-200 ms, dropdowns 150-250 ms, and a button transition of `transform 160ms ease-out`. These come from third-party "skill" wrappers, not his own pages — [skills.cat summary](https://skills.cat/skills/mrmps/smry/emilkowal-animations)

**Apple "Designing Fluid Interfaces" (WWDC 2018) — via secondary sources**
- The talk's core claim: fluid interfaces are responsive, interruptible and redirectable — the UI reacts immediately, can be stopped at any point and can change course midway — [Nathan Gitter, Building Fluid Interfaces](https://medium.com/@nathangitter/building-fluid-interfaces-ios-swift-9732bb934bf5)
- Apple proposed designing springs with two parameters, damping ratio and response, instead of mass/stiffness/damping; ratio 1 = critically damped (no bounce), lower = overshoot — [Nathan Gitter](https://medium.com/@nathangitter/building-fluid-interfaces-ios-swift-9732bb934bf5)
- Conversion (mass = 1): `stiffness = (2π / response)^2`, `damping = 4π × dampingRatio / response`; a damping ratio of 1 is what most animations should use — [Nathan Gitter](https://medium.com/@nathangitter/building-fluid-interfaces-ios-swift-9732bb934bf5)
- UNVERIFIED third-party table of "values Apple ships" (damping ratio / response): move 1.0 / 0.4 s, rotation 0.8 / 0.4 s, drawer 0.8 / 0.3 s; plus a momentum `project()` function with deceleration rate ~0.998 attributed to the session sample code. I could not confirm these against Apple material — [third-party "apple-design" skill page](https://mcpservers.org/agent-skills/emilkowalski/apple-design)

**Material 3 Expressive motion-physics tokens — third-party only, values conflict**
- One Flutter port lists expressive default spatial as stiffness 380 / damping ratio 0.8, fast spatial 800 / 0.6, slow spatial 200 / 0.8, standard default spatial 700 / 0.9; "effects" tokens (opacity, colour) use damping 1 so they never bounce — [pub.dev M3EMotion](https://pub.dev/documentation/m3e_slider/0.0.2/common_m3e_common/M3EMotion-class.html)
- Another port lists expressive default spatial as stiffness 380 / damping 0.73 — [pub.dev material_expressive](https://pub.dev/documentation/material_expressive/0.8.0/); conflicts with the 0.8 figure above [pub.dev M3EMotion](https://pub.dev/documentation/m3e_slider/0.0.2/common_m3e_common/M3EMotion-class.html)
- Compose's own spring constants (official): `Spring.StiffnessMedium = 1500`, `Spring.StiffnessLow = 200`; default `spring()` is `DampingRatioNoBouncy` + `StiffnessMedium` — [Android reference: Spring](https://developer.android.com/reference/kotlin/androidx/compose/animation/core/Spring)

**Reanimated 4 spring semantics (what the numbers mean in Atlas's stack)**
- `withSpring` defaults in Reanimated 4: damping 120, stiffness 900, mass 4 (physics mode); or duration 550 ms with dampingRatio 1 (duration mode); `overshootClamping` false; `energyThreshold` 6e-9; `velocity` 0; `reduceMotion` defaults to `ReduceMotion.System` — [Reanimated withSpring docs](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/)
- Duration mode: `duration` is perceptual; the actual settle time is 1.5x the value. dampingRatio 1 = critical, <1 underdamped, >1 overdamped. If both styles are passed, `duration`/`dampingRatio` override `stiffness`/`damping` — [Reanimated withSpring docs](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/)
- `velocity` is a first-class config field, which is the hook for gesture velocity hand-off — [Reanimated withSpring docs](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/)

**What makes it feel cheap (sourced items)**
- Animating layout properties (`top/left/width/height/margin/padding`) forces layout recalculation every frame; prefer `transform`, `opacity`, `backgroundColor` — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- Ease-in on entering elements, durations of 400 ms+, scaling from 0, and animating high-frequency interactions are called out as mistakes — [Emil Kowalski](https://emilkowal.ski/ui/7-practical-animation-tips)
- Frame pacing matters more than curve correctness: a mathematically monotonic spring looked like it "jumped" on a 120 Hz budget phone purely because 85% of frames missed the 8.3 ms budget — [Margelo case study, June 2026](https://margelo.com/blog/profiling-skia-reanimated-low-end-android)

### Inferences
- Converting the (unverified) Apple pairs with Gitter's formula at mass 1: 1.0 / 0.4 s → stiffness ≈ 247, damping ≈ 31.4; 0.8 / 0.3 s ("drawer", the closest analogue to a bottom sheet) → stiffness ≈ 439, damping ≈ 33.5. In Reanimated 4 the simpler route is duration mode: `withSpring(target, { duration: ~300-400, dampingRatio: 0.8-1, velocity })`, remembering the 1.5x actual-duration rule.
- Reanimated's default spring (120 / 900 / mass 4) has damping ratio 120 / (2·√(900·4)) = 1.0, i.e. critically damped; it is a safe default for sheets and map-camera settles, and bounce should be opt-in.
- A workable token set for Atlas, assembled from the sources above: press-in scale 0.97 over ~100-160 ms ease-out; enter/exit 150-250 ms ease-out from scale ≥0.93 + opacity; sheets/drawers on a spring with damping ratio 0.8-1.0 and response ~0.3-0.4 s seeded with release velocity; nothing over 300 ms except full-screen transitions owned by the native stack.
- Interruptibility in practice means: drive position from one shared value, never block gestures while animating, and start each new spring from the current value and current velocity (Reanimated does this when the same shared value is re-assigned).
- For a mostly-Android audience, the M3 split is useful regardless of exact numbers: bouncy springs only on "spatial" properties (position, size, corner radius), critically damped on "effects" (opacity, colour).

### Gaps
- Official Material 3 Expressive motion token values (m3.material.io and the androidx `MotionTokens` source) were not retrievable; the two third-party ports disagree (0.8 vs 0.73 damping). Verify against the androidx material3 source before adopting.
- Apple's own numeric values and the velocity-projection formula were only found on third-party pages; the WWDC18 session 803 transcript/sample code was not fetched.
- No WWDC 2025-26 motion-session notes were retrieved.
- Rauno Freiberg and Josh Comeau guidance was not retrieved; no citations for them.
- Exact custom ease-out cubic-bezier values recommended by Kowalski were not on the page fetched (he points to easings.co).

---

## 2. Reanimated 4, worklets, Gesture Handler 3, and when to use Skia

### Takeaway
Reanimated 4 is New-Architecture-only and adds CSS-style animations/transitions that coexist with shared values; its biggest wins on low-end Android come from static feature flags (synchronous UI props) and from staying under ~100 animated views. Shared element transitions remain flagged and officially "not yet production ready" as of the 4.7 docs. Skia v3 (Graphite/Vulkan, minSdk 26) is the right tool for dense or shader-based drawing, but on Android its default TextureView canvas is a known frame-pacing trap.

### Cited Findings

**Reanimated 4 architecture and APIs**
- Reanimated 4 supports only the New Architecture (Fabric); legacy renderer support is dropped — [Reanimated migration guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/)
- CSS-style animations and transitions work simultaneously and interchangeably with shared-value animations, so adoption can be incremental — [Reanimated migration guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/)
- CSS animations/transitions can drive a limited set of props on react-native-svg `Circle`, `Ellipse`, `Line`, `Path`, `Rect` (`EXPERIMENTAL_CSS_ANIMATIONS_FOR_SVG_COMPONENTS`, default true from 4.4.0) — [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)
- Experimental: CSS transitions can be executed by the platform instead of Reanimated's loop — `IOS_CSS_CORE_ANIMATION` (Core Animation, added 4.4.0) and `ANDROID_CSS_PLATFORM_TRANSITIONS` (ObjectAnimator, added 4.6.0); both default false — [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)

**Shared element transitions (SET)**
- Introduced behind `ENABLE_SHARED_ELEMENT_TRANSITIONS` in 4.2.0 — [Software Mansion, Introducing Reanimated 4.2.0](https://swmansion.com/blog/introducing-reanimated-4-2-0)
- Current docs: flag default `false`; feature is "not yet production ready"; enabling changes layout-animation behaviour; incompatible with `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY` (added 4.7.0) — [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)
- 4.5.0 added `SharedTransitionBoundary` to scope SETs to a subtree — [Reanimated 4.5.0 changelog](https://swmansion.com/changelog/reanimated-4-5-0/)
- Several 2026 third-party guides call SET "stable"; this contradicts the official flag docs — e.g. [reactnativerelay guide](https://reactnativerelay.com/ko/article/react-native-reanimated-4-wanbyeok-gaideu-2026); contradicted by [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)

**Performance flags (static unless noted)**
- `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` (4.0.0, default false): applies non-layout styles without layout recalculation; up to 4x FPS in an artificial benchmark, smaller gains expected in production. Side effect: touch detection problems for RN `Pressable` under animated transforms — use Gesture Handler components instead — [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)
- `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` (4.2.0, default false): iOS counterpart, additionally covers `shadowOffset/shadowOpacity/shadowRadius` — [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)
- `USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS` (default true from 4.3.0): fixes low FPS while scrolling — [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)
- `FORCE_REACT_RENDER_FOR_SETTLED_ANIMATIONS` (default true from 4.3.0): syncs settled styles back to React to reduce shadow-node cloning; mutually exclusive with experimental `USE_ANIMATION_BACKEND` (4.4.0) — [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)
- `DISABLE_COMMIT_PAUSING_MECHANISM` (default false): fixes sticky-header jitter during scroll, but only safe with RN's `preventShadowTreeCommitExhaustion` enabled (RN 0.81+) — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- `TRACK_SYNCHRONOUS_PROPS_IN_LAYOUT_ANIMATIONS` (dynamic, 4.7.0): keeps layout animations/SET consistent with synchronous props, at extra per-frame cloning cost; enable per screen — [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)

**Pitfalls and hard limits**
- Guideline ceiling for simultaneously animated components: about 100 on low-end Android, about 500 on iOS; beyond that use Reanimated + react-native-skia — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- Reading `sharedValue.value` on the JS thread blocks it until the UI thread answers — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- Memoize `useFrameCallback` worklets and gesture objects (React Compiler does this automatically); matters most in list items — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- New-Architecture regressions are often visible only in debug builds; RN 0.82+ has an Android `debugOptimized` variant — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- FlashList layout blink on New Architecture is an RN-side issue with no flag fix (tracked in RN issue #52373) — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- For changing numbers (counters), drive an animated `TextInput` from a shared value instead of React state; animated `Text` is in progress — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)

**Gesture Handler 3 (relevant to the map canvas and custom sheet)**
- Hook API: `usePanGesture()`, `usePinchGesture()`, etc.; composition via `useSimultaneousGestures()`, `useCompetingGestures()`, `useExclusiveGestures()`; hook and builder gestures cannot be related to each other — [Gesture Handler 3 upgrade guide](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3/)
- Callback renames: `onStart/onEnd` → `onActivate/onDeactivate`; `onChange` removed (use `change*` fields in `onUpdate`); `success` replaced by inverted `event.canceled` — [Gesture Handler 3 upgrade guide](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3/)
- `GestureDetector` is now a host view, which "can break components that depend on view hierarchy, such as SVG"; the fix is `InterceptingGestureDetector` outside and `VirtualGestureDetector` inside — [Gesture Handler 3 upgrade guide](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3/)
- New `Touchable` component replaces all button/Touchable variants; e.g. TouchableOpacity equivalent is `activeOpacity={0.2}` with `animationDuration={{ in: 0, out: 150 }}`; Android ripple via `androidRipple` — [Gesture Handler 3 upgrade guide](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3/)
- Some gesture config (`enabled`, `hitSlop`, swipeable offsets) now accepts SharedValues — [Gesture Handler 3 upgrade guide](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3/)

**Skia (@shopify/react-native-skia)**
- Repo now resolves to `wcandillon/react-native-skia`: 8,780 stars, MIT, latest release v3.10.1 on 2026-11-13 — [GitHub](https://github.com/Shopify/react-native-skia)
- v3 renders with Graphite (Metal on Apple, Vulkan on Android); Android minSdk 26 — [bestofjs listing of react-native-skia](https://bestofjs.org/projects/react-native-skia); in v2 Graphite was opt-in and not shipped by default — [react-native-skia README mirror](https://github.com/tmgrask/react-native-skia)
- Margelo (June 2026), sub-$100 Android phone with 120 Hz panel: 85% janky frames at 120 Hz vs 15% at 60 Hz for the same workload; 79% of frames flagged for slow bitmap uploads; idle canvas frame time 17-32 ms — [Margelo](https://margelo.com/blog/profiling-skia-reanimated-low-end-android)
- Root cause #1: the default `<Canvas>` on Android is a `SkiaTextureView`, composited into the app window every frame with a texture upload (2-3 GPU passes). Fix: `<Canvas opaque={Platform.OS === "android"}>` to get a SurfaceView/hardware overlay; RenderThread CPU fell 50-65%, slow bitmap uploads went to near zero, idle frame ≈ 9 ms (~2.9x). Trade-off: the canvas must paint its own opaque background and sits first in z-order — [Margelo](https://margelo.com/blog/profiling-skia-reanimated-low-end-android)
- Root cause #2: `usePathValue` / `usePathInterpolation` re-dirty every vsync, and a global `withRepeat(-1)` keeps even off-screen canvases redrawing; fix with a `useDerivedValue<SkPath>` that mutates one stable buffer. One redraw of a ~150-node canvas cost ~13% of the JS frame budget — [Margelo](https://margelo.com/blog/profiling-skia-reanimated-low-end-android)
- Other fixes: replace `useState` + `runOnJS` per-frame updates (8-15 ms UI-thread blocks through Fabric) with `useAnimatedReaction` + `scheduleOnRN`; avoid per-frame allocations (Hermes GC pauses); quantize animated blur/shadow alpha so Skia's blur-mask cache hits; profile release builds with `dumpsys gfxinfo`, Perfetto and a Hermes sampling profile — [Margelo](https://margelo.com/blog/profiling-skia-reanimated-low-end-android)
- iOS was smooth from the start and a 60 Hz flagship Android tolerated the same code — [Margelo](https://margelo.com/blog/profiling-skia-reanimated-low-end-android)

### Inferences
- Atlas's SVG map canvas is the highest-risk surface: (a) GH3's host-view `GestureDetector` is explicitly flagged as SVG-breaking, so the pan/pinch detector should be an `InterceptingGestureDetector` wrapping the `Svg`, not placed inside it; (b) react-native-svg nodes count toward the ~100-animated-components Android ceiling, so pan/pinch should transform one parent `Animated.View`/`G`, not individual nodes.
- Route line draw-on, the pulsing blue dot and accuracy halo are good candidates for either CSS animations on SVG `Path`/`Circle` (cheap, already in stack, now platform-executed experimentally) or a single Skia overlay. Move to Skia only if the map exceeds the component ceiling or needs shaders/blur; if so, use an opaque SurfaceView canvas on Android and pause infinite animations when off-screen.
- Given a Samsung-heavy mid-range audience with 90/120 Hz panels (e.g. Galaxy A-series), the Margelo finding implies testing at the panel's high refresh rate on a real budget device is mandatory; 60 Hz flagship testing hides the problem.
- Recommended flag set to trial on SDK 58: `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` + `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` on, after swapping RN `Pressable` for GH3 `Touchable` on anything under an animated transform. Leave SET off.

### Gaps
- Could not confirm whether Reanimated 4.7 ships named spring presets; none are in the `withSpring` docs page.
- No primary benchmark found for Skia blur/shader cost on low-end Android under Graphite vs the old Ganesh backend.
- Gesture Handler 3 minimum RN version / New Architecture requirement is not stated on the upgrade page fetched.
- react-native-worklets usage specifics (API such as `scheduleOnRN`, `scheduleOnUI`, bundle mode) were only seen indirectly (Margelo); the worklets docs were not fetched. The GitHub API showed a `software-mansion/react-native-worklets` repo with 38 stars and no licence detected, which looks like a placeholder rather than the real source location (worklets historically lived in the Reanimated monorepo) — unverified.
- App.js Conf / React Native EU / Chain React 2025-26 talks were not retrieved.

---

## 3. Bottom sheets

### Takeaway
For native iOS 26+ Liquid Glass sheets with correct keyboard handling and Reanimated-synced position, `@lodev09/react-native-true-sheet` v4 is the strongest actively-maintained option; expo-router `formSheet` gives the same native sheet for simple cases; `@gorhom/bottom-sheet` is still on v5 with no v6 and its docs still state Reanimated v1-3 compatibility.

### Cited Findings

**@gorhom/bottom-sheet**
- 9,111 stars, MIT, last push 2026-05-09 — [GitHub](https://github.com/gorhom/react-native-bottom-sheet)
- Latest release 5.2.14 (2026-05-09): mount animation alongside keyboard, window height read from a shared value on the UI thread. A burst of 5.2.9-5.2.14 fixes in Apr-May 2026 followed a gap from Dec 2025; no v6 release exists — [GitHub releases](https://github.com/gorhom/react-native-bottom-sheet/releases)
- Docs still describe v5 as written against Reanimated v3 and Gesture Handler v2, "compatible with Reanimated v1-3" — [gorhom docs](https://gorhom.dev/react-native-bottom-sheet/)

**@lodev09/react-native-true-sheet**
- 2,097 stars, MIT, latest release v4.1.0 on 2026-11-07 — [GitHub](https://github.com/lodev09/react-native-true-sheet)
- v4.0 shipped "a rewritten layout engine"; v3.0+ requires RN 0.81+ and the New Architecture — [True Sheet docs](https://sheet.lodev09.com/)
- Liquid Glass is on by default on iOS 26+; setting `backgroundColor` or `backgroundBlur` replaces it (iOS 26.1+); `backgroundColor="transparent"` disables it without colour; app-wide opt-out via `UIDesignRequiresCompatibility` (ignored on iOS 27 SDK builds) — [True Sheet Liquid Glass guide](https://sheet.lodev09.com/guides/liquid-glass)
- Limits: tinted glass is not per-detent; detents with a `detentBackgrounds` entry lose glass touch response; `draggable={false}` does not turn off glass touch response on iOS 26+ — [True Sheet Liquid Glass guide](https://sheet.lodev09.com/guides/liquid-glass)
- Detents: `'auto'`, fractions, named values, e.g. `detents={['peek', 0.6, 1]}` — [True Sheet docs](https://sheet.lodev09.com/reference/types)
- Keyboard: iOS relies on `UISheetPresentationController`'s built-in avoidance; Android tracks keyboard height with `WindowInsetsAnimationCompat` and reconfigures detents in real time — [True Sheet docs](https://sheet.lodev09.com/)
- Reanimated integration: `ReanimatedTrueSheetProvider` + `ReanimatedTrueSheet` + `useReanimatedTrueSheet()` expose `animatedPosition` (Y px from screen top), `animatedIndex` (continuous float between detents) and `animatedDetent` (0-1 of screen height); `onPositionChange` runs as a UI-thread worklet. Requires reanimated ^4.1.0 and worklets ^0.5.0 — [True Sheet Reanimated guide](https://sheet.lodev09.com/guides/reanimated)

**expo-router formSheet / @expo/ui BottomSheet**
- iOS 26 native sheet behaviour: floats with gap and rounded corners at the lowest detent, smaller gap at mid, becomes a full edge-attached sheet at the top detent (Apple Maps pattern) — [Expo blog](https://expo.dev/blog/how-to-create-apple-maps-style-liquid-glass-sheets)
- Router recipe: `presentation: "formSheet"`, `sheetAllowedDetents: [0.1, 0.5, 1]`, `sheetInitialDetentIndex: 0`, `sheetLargestUndimmedDetentIndex: 0` (keeps the map interactive/undimmed), `sheetGrabberVisible: true`, `contentStyle: { backgroundColor: "transparent" }` (lets glass show), `gestureEnabled: false` (non-dismissable) — [Expo blog](https://expo.dev/blog/how-to-create-apple-maps-style-liquid-glass-sheets)
- Limitation noted by the author: hard to control custom footers or to sync animations with sheet movement, so formSheet suits simpler sheets — [Expo blog](https://expo.dev/blog/how-to-create-apple-maps-style-liquid-glass-sheets)
- `@expo/ui/swift-ui` `BottomSheet` (`presentationDetents={[0.1, 0.5, 1]}`, `presentationDragIndicator`) was described as beta and not recommended for production at the time of that post — [Expo blog](https://expo.dev/blog/how-to-create-apple-maps-style-liquid-glass-sheets)

**react-native-actions-sheet**
- 2,201 stars, MIT, last push 2026-11-01 — [GitHub](https://github.com/ammarahm-ed/react-native-actions-sheet)

**Keyboard helper**
- react-native-keyboard-controller: 3,765 stars, MIT, last push 2026-11-14 — [GitHub](https://github.com/kirillzyusko/react-native-keyboard-controller)

### Inferences
- Map-padding sync: with True Sheet, derive the map's bottom inset on the UI thread from `animatedPosition` (`screenHeight - animatedPosition`) and apply it to the map camera/controls via `useAnimatedStyle`/`useDerivedValue`; clamp to the mid detent so the full-height detent does not shove the camera. With Atlas's existing custom sheet the same pattern already applies since it owns the shared value. With `formSheet` there is no position stream, so only discrete detent-change updates are possible.
- Decision for Atlas: keep the custom Reanimated sheet (full control of velocity hand-off and map sync, identical on Android) or adopt True Sheet v4 to get real Liquid Glass and system keyboard behaviour on iOS for free. A hybrid (True Sheet on iOS, custom on Android) doubles QA. Gorhom is the weakest fit: no stated Reanimated 4 / GH3 support in docs and a JS sheet cannot render system Liquid Glass sheet chrome.
- The glass "floating" look at low detents is system-drawn; replicating it in a custom sheet means an `expo-glass-effect` `GlassView` background plus manual inset/corner interpolation, and it will still not match system touch response.

### Gaps
- Could not verify gorhom v5.2.x peer-dependency ranges for Reanimated 4.7 / worklets 0.13 / Gesture Handler 3.3 (the docs say v1-3; real-world compatibility untested here).
- True Sheet's Android implementation details and its documented behaviour over an always-interactive map were not retrieved.
- react-native-actions-sheet's Reanimated 4 / New Architecture status and latest release tag were not retrieved.
- No source found for an official "map padding follows sheet" recipe.

---

## 4. Navigation and transitions

### Takeaway
On SDK 58, native tabs are promoted to `expo-router/native-tabs` and render the system Liquid Glass tab bar on iOS 26+; the iOS 18+ zoom transition is available through `Link.AppleZoom` but is still alpha and iOS-only; Reanimated shared element transitions are not a production option yet.

### Cited Findings
- SDK 58 targets iOS 27 and bundles React Native 0.88 — [Expo SDK 58 changelog](https://expo.dev/changelog/sdk-58)
- Native tabs import path is `expo-router/native-tabs` from SDK 58 (`expo-router/unstable-native-tabs` in SDK 54-57) — [Expo native tabs guide](https://docs.expo.dev/router/advanced/native-tabs/)
- SDK 57→58: native tabs show only screens declared in the layout; `expo-symbols` and `@expo/ui` became optional peer deps of Expo Router — [Expo Router SDK 57→58 migration](https://docs.expo.dev/router/migrate/sdk-57-to-58.md)
- iOS 26+: tab bar is system Liquid Glass and adapts to content behind it; `backgroundColor`, `blurEffect`, `shadowColor` only affect iOS 18 and earlier; use `DynamicColorIOS`/`PlatformColor` for custom label/icon colours — [Expo native tabs guide](https://docs.expo.dev/router/advanced/native-tabs/)
- `minimizeBehavior="onScrollDown"` minimizes the bar on scroll; `role="search"` gives a separate search tab (iOS 26+); `NativeTabs.BottomAccessory` (SDK 55+) is a floating view above the bar with `usePlacement()` returning `'regular'` or `'inline'`; badges via `NativeTabs.Trigger.Badge` — [Expo native tabs guide](https://docs.expo.dev/router/advanced/native-tabs/)
- Icons: `sf` (SF Symbols, iOS), `md` (Material Symbols, Android), `src`, `xcasset`; `{ default, selected }` variants — [Expo native tabs guide](https://docs.expo.dev/router/advanced/native-tabs/)
- Limits: max 5 tabs on Android; cannot nest native tabs in native tabs; FlatList has limited support (scroll-to-top and minimize-on-scroll do not work, bar may appear transparent); tabs cannot be added/removed dynamically; tab bar height cannot be measured; no web equivalent — [Expo native tabs guide](https://docs.expo.dev/router/advanced/native-tabs/)
- Android: keyboard overlays the tab bar by default; `tabBarRespectsIMEInsets` lifts it (Android 11+, `softwareKeyboardLayoutMode: "resize"`) — [Expo native tabs guide](https://docs.expo.dev/router/advanced/native-tabs/)
- Zoom transition: alpha API, iOS only, SDK 55+, iOS 18+; wrap source in `Link.AppleZoom` (single child, inside `Link asChild`), optionally `Link.AppleZoomTarget` on the destination; renders normally without the effect on older iOS/Android; headers can cause glitches — [Expo zoom transition docs](https://docs.expo.dev/router/advanced/zoom-transition/)
- react-native-screens: 3,752 stars, MIT, last push 2026-11-13 — [GitHub](https://github.com/software-mansion/react-native-screens)
- react-native-bottom-tabs (now `callstack/react-native-bottom-tabs`): 1,472 stars, MIT, last push 2026-11-10 — [GitHub](https://github.com/callstack/react-native-bottom-tabs)
- Reanimated SET is flagged and "not yet production ready" — [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)

### Inferences
- For Atlas (map-first app), the unmeasurable native tab bar height and the "content behind glass" model mean the map should extend under the bar and floating controls should use safe-area insets plus the bottom accessory slot (e.g. an active-navigation mini banner) rather than hard-coded offsets.
- Leave screen push/pop to the native stack (system curves, interruptible back-swipe); reserve custom Reanimated transitions for in-screen state changes. Use `Link.AppleZoom` as progressive enhancement for venue-card → venue-detail on iOS only; Android gets the default transition.
- The FlatList limitation suggests using ScrollView/FlashList-backed screens under native tabs and verifying minimize-on-scroll per list implementation.

### Gaps
- Android appearance of native tabs (Material 3 navigation bar specifics, dynamic colour) is not described in the page fetched.
- Whether native tabs are formally "stable" in SDK 58 is not explicitly stated (only the dropped `unstable-` prefix).
- react-native-screens 4.x transition option details (custom durations, `animation` values, Android predictive back) were not retrieved.

---

## 5. Native feel: glass, @expo/ui, menus, symbols, Material You

### Takeaway
`expo-glass-effect` is iOS 26+/tvOS only with a plain-View fallback elsewhere and has real constraints (no opacity < 1, needs runtime availability checks); `@expo/ui` now exposes real SwiftUI and Jetpack Compose components behind a universal `Host`; `expo-symbols` covers SF Symbols on iOS and Material Symbols on Android but symbol animation is effectively iOS-centric.

### Cited Findings

**expo-glass-effect (SDK 58, ~58.0.5)**
- Exports `GlassView`, `GlassContainer`, `isLiquidGlassAvailable()`, `isGlassEffectAPIAvailable()`; iOS and tvOS only, `GlassView` requires iOS 26+; on unsupported platforms it falls back to a regular `View` — [Expo glass-effect docs](https://docs.expo.dev/versions/v58.0.0/sdk/glass-effect.md)
- `glassEffectStyle`: `'regular' | 'clear' | 'none'` or `{ style, animate, animationDuration (seconds) }`; `isInteractive` (default false); `tintColor`; `colorScheme` — [Expo glass-effect docs](https://docs.expo.dev/versions/v58.0.0/sdk/glass-effect.md)
- `GlassContainer` `spacing` = distance at which glass elements begin to merge — [Expo glass-effect docs](https://docs.expo.dev/versions/v58.0.0/sdk/glass-effect.md)
- Known issue: opacity below 1 on a `GlassView` or its parents does not render correctly; to fade, toggle `glassEffectStyle` between the target and `'none'` with `animate: true` (and animate a wrapper's opacity with Reanimated) — [Expo glass-effect docs](https://docs.expo.dev/versions/v58.0.0/sdk/glass-effect.md)
- `isLiquidGlassAvailable()` does not reflect Reduce Transparency; check `AccessibilityInfo.isReduceTransparencyEnabled()` separately. Guard rendering with `isGlassEffectAPIAvailable()` — [Expo glass-effect docs](https://docs.expo.dev/versions/v58.0.0/sdk/glass-effect.md)
- SDK 58 fixed the Liquid Glass availability check for apps built with the iOS 27 SDK — [Expo SDK 58 changelog](https://expo.dev/changelog/sdk-58)
- Alternative: `callstack/liquid-glass` — 1,733 stars, MIT, last push 2026-09-15 — [GitHub](https://github.com/callstack/liquid-glass)

**@expo/ui**
- SDK 58 docs cover SwiftUI components, Jetpack Compose components, and a universal `Host` that re-exports the platform Host on iOS/Android and falls back to a `View` on web — [Expo UI universal Host docs](https://docs.expo.dev/versions/v58.0.0/sdk/ui/universal/host/)
- An Expo-authored post describes `@expo/ui` as production-ready with real SwiftUI and Compose components from SDK 56 (Compose was beta in SDK 55) — [Expo on DEV](https://dev.to/expo/native-ui-components-from-one-import-expo-ui-is-production-ready-n0k)
- On iOS 16+, SwiftUI's `contentTransition(.numericText())` is suggested by Software Mansion as a native alternative for animated numbers — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)

**expo-symbols**
- `SymbolView` `name` takes a per-platform object (`ios`, `android`, `web`) or an SF Symbol string (iOS-only render); iOS/tvOS use SF Symbols, Android and web use Material Symbols; a string-only name renders nothing on Android without `fallback` — [Expo symbols docs](https://docs.expo.dev/versions/v58.0.0/sdk/symbols/)
- `animationSpec.effect.type`: `bounce | pulse | scale`, with `direction`, `wholeSymbol`, `repeating`, `repeatCount`, `speed`; `variableAnimationSpec` flags (`cumulative`, `iterative`, `dimInactiveLayers`, `hideInactiveLayers`, `reversing`, `nonReversing`). The props table marks `animationSpec` iOS-only while the type table lists Android/web too — the page is internally inconsistent — [Expo symbols docs](https://docs.expo.dev/versions/v58.0.0/sdk/symbols/)
- iOS-only rendering types: `monochrome`, `hierarchical`, `palette`, `multicolor` — [Expo symbols docs](https://docs.expo.dev/versions/v58.0.0/sdk/symbols/)

**Menus / context menus (repo facts)**
- zeego: 2,254 stars, MIT, last push 2026-01-28 — [GitHub](https://github.com/nandorojo/zeego)
- react-native-ios-context-menu: 699 stars, MIT, last push 2026-04-17 — [GitHub](https://github.com/dominicstop/react-native-ios-context-menu)
- @react-native-menu/menu: 1,239 stars, MIT, last push 2026-08-17 — [GitHub](https://github.com/react-native-menu/menu)

**Material You**
- expo-material3-theme: 133 stars, MIT, last push 2026-02-02 — [GitHub](https://github.com/pchmn/expo-material3-theme)

### Inferences
- With ~82% Android users, glass must be treated as an iOS-only enhancement: design the Android surface first (opaque/tonal M3 surfaces, elevation, ripple via GH3 `Touchable androidRipple`), then swap in `GlassView` on iOS 26+ behind `isGlassEffectAPIAvailable()` and a Reduce Transparency check.
- The opacity limitation directly affects sheet/overlay enter-exit animations: animate transform (translate/scale) on glass containers, not opacity.
- Because zeego and the iOS context-menu library show slower 2026 activity than `@expo/ui`, the first-party SwiftUI/Compose menu components in `@expo/ui` are the lower-risk choice on SDK 58; verify component availability before committing.
- Treat SF Symbol effects as iOS-only polish and provide a Reanimated scale/opacity fallback for Android Material Symbols.

### Gaps
- Specific `@expo/ui` component inventory for SDK 58 (ContextMenu, Picker, Slider, etc.) and its formal stability label were not retrieved.
- zeego / react-native-ios-context-menu New Architecture and SDK 58 compatibility not verified.
- No verified source for Material You dynamic colour in 2026 beyond the repo metadata of expo-material3-theme (small, last pushed Feb 2026); React Native's `PlatformColor` with Android system dynamic colour resources is a possible route but was not researched. Samsung One UI's handling of dynamic colour was not researched.
- No Android equivalent for Liquid Glass (e.g. RenderEffect blur) was researched.

---

## 6. Haptics

### Takeaway
On Android, prefer `Haptics.performAndroidHapticsAsync` (system `HapticFeedbackConstants`-style effects, no VIBRATE permission) over `impactAsync`, which is only simulated with the raw Vibrator; Google's guidance is to favour clear, short haptics over "buzzy" ones and to check device capability. For custom patterns and worklet-driven haptics, Expo's own docs now point to Software Mansion's Pulsar.

### Cited Findings
- expo-haptics API: `impactAsync(Light|Medium|Heavy|Rigid|Soft)`, `notificationAsync(Success|Warning|Error)`, `selectionAsync()`, and Android-only `performAndroidHapticsAsync(type)` — [Expo haptics docs](https://docs.expo.dev/versions/v58.0.0/sdk/haptics/)
- On Android `impactAsync` is simulated with `Vibrator`; the docs recommend `performAndroidHapticsAsync`, which uses the device haptics engine and needs no `VIBRATE` permission — [Expo haptics docs](https://docs.expo.dev/versions/v58.0.0/sdk/haptics/)
- `AndroidHaptics` values include `Confirm`, `Reject`, `Segment_Tick`, `Segment_Frequent_Tick` (very soft, may produce nothing on some devices), `Clock_Tick`, `Context_Click`, `Long_Press`, `Drag_Start`, `Gesture_Start/End`, `Toggle_On/Off`, `Virtual_Key`, `Keyboard_Tap`, `Text_Handle_Move` — [Expo haptics docs](https://docs.expo.dev/versions/v58.0.0/sdk/haptics/)
- iOS Taptic Engine is silent in Low Power Mode, when disabled in settings, while the camera is active, and during dictation — [Expo haptics docs](https://docs.expo.dev/versions/v58.0.0/sdk/haptics/)
- For custom patterns, more presets, gesture-based haptics or haptics on worklets, the Expo docs recommend Pulsar — [Expo haptics docs](https://docs.expo.dev/versions/v58.0.0/sdk/haptics/)
- Pulsar (`react-native-pulsar`): presets, `usePatternComposer` (time/amplitude/frequency points) and `useRealtimeComposer` (`set`/`stop` for gesture-driven feedback); all preset functions and hook methods are worklet-compatible; Android side uses `VibrationEffect` with fallbacks for older devices; install `npx expo install react-native-pulsar react-native-worklets`; custom `.pulsar` bundles registered via Expo config plugin `bundleDirs` — [Pulsar React Native SDK docs](https://docs.swmansion.com/pulsar/sdk/react-native/)
- Pulsar Studio (authoring tool) is paid, "from 9$/month" — [Pulsar Studio](https://docs.swmansion.com/pulsar/studio/)
- Pulsar repo: 469 stars, MIT, last push 2026-11-13 — [GitHub](https://github.com/software-mansion/pulsar)
- react-native-haptic-feedback: 982 stars, MIT, last push 2026-06-10 — [GitHub](https://github.com/mkuczera/react-native-haptic-feedback)
- Google's Android haptics principles: favour "clear" and "rich" haptics over "buzzy"; be consistent with system and app; consider frequency and importance of the event; co-design haptics with visual and audio feedback; legacy on/off vibration patterns tend to be buzzy — [Android haptics design principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles)
- Apps should generally use `HapticFeedbackConstants` (action-based; implementation varies per device) for consistency; e.g. CONFIRM is short and light, REJECT stronger — [Android haptics APIs](https://developer.android.com/develop/ui/views/haptics/haptics-apis)
- Composition primitives: short (<20 ms) `CLICK`, `TICK`, `LOW_TICK`; chirps `SLOW_RISE`, `QUICK_RISE`, `QUICK_FALL`, `THUD`, `SPIN`; check support with `areAllPrimitivesSupported` / `areEffectsSupported` before combining — [AOSP haptics constants and primitives](https://source.android.com/docs/core/interaction/haptics/haptics-constants-primitives)

### Inferences
- Suggested Atlas mapping (derived from the principles above, not prescribed by any source): sheet snaps to a detent → `selectionAsync` (iOS) / `Segment_Tick` (Android); primary button commit → `impactAsync(Light)` / `Context_Click` or `Confirm`; upcoming turn → a distinct two-pulse pattern (needs Pulsar or `notificationAsync(Warning)`); arrival → `notificationAsync(Success)` / `Confirm`; off-route/reroute → `notificationAsync(Warning)` / `Reject`. Never fire haptics on continuous pan/zoom or on every list scroll tick.
- Because Low Power Mode silences iOS haptics and budget Android actuators vary, haptics must always be redundant with a visual (and optionally audio) cue — essential for turn alerts when the phone is in a pocket.
- Platform-split wrapper: one `haptic(kind)` helper that calls `performAndroidHapticsAsync` on Android and the iOS APIs on iOS avoids the "buzzy" Vibrator path on mid-range Samsungs.
- Pulsar's worklet compatibility allows firing a detent tick from the sheet's UI-thread animation at the exact crossing frame, avoiding JS-thread latency.

### Gaps
- No reliable source was found on Samsung mid-range (Galaxy A-series) actuator quality or One UI-specific haptic behaviour; this is a genuine gap and needs device testing.
- Pulsar's licence terms for the SDK vs paid Studio, and its maturity (469 stars), were not examined beyond repo metadata.
- No authoritative guidance was found on haptic timing for pedestrian/indoor turn-by-turn navigation specifically.
- Custom Core Haptics (AHAP) libraries for RN were not verified (repos guessed at returned 404).

---

## 7. Micro-interactions: pressed states, skeletons, tickers, Lottie vs Rive

### Takeaway
Pressed state should be immediate-in and eased-out (scale 0.97; GH3's TouchableOpacity-equivalent uses 0 ms in, 150 ms out); number changes should be driven on the UI thread (animated TextInput, SwiftUI numericText, or a number-flow port); Lottie remains the most widely adopted illustration runtime while Rive's advantage is interactivity/state machines rather than a proven performance win.

### Cited Findings
- Button press scale 0.97; avoid scale-from-0 (use ≥0.9) — [Emil Kowalski](https://emilkowal.ski/ui/7-practical-animation-tips)
- GH3 `Touchable` presets: TouchableOpacity-equivalent `activeOpacity 0.2` with `animationDuration { in: 0, out: 150 }`; BorderlessButton-equivalent `activeOpacity 0.3`, duration 0; Android uses `androidRipple` — [Gesture Handler 3 upgrade guide](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3/)
- With Reanimated's synchronous-props flags, RN `Pressable` hit-testing under animated transforms is unreliable; use Gesture Handler pressables — [Reanimated feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)
- Counters: use a shared value + animated `TextInput`, not React state; SwiftUI `contentTransition(.numericText())` on iOS 16+ — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- `number-flow-react-native`: RN port of NumberFlow; per-digit virtual wheels with automatic direction, full `Intl.NumberFormat` support, View-based and Skia renderers, peers on reanimated and (for Reanimated 4) react-native-worklets; listed v0.3.0, updated March 2026 — [socket.dev listing](https://socket.dev/npm/package/number-flow-react-native)
- `@jeongshin/react-native-animated-rolling-numbers` (MIT, v2.0.1, Reanimated-based) — [jsDelivr listing](https://www.jsdelivr.com/package/npm/@jeongshin/react-native-animated-rolling-numbers)
- lottie-react-native: 17,215 stars, Apache-2.0, last push 2026-11-13 — [GitHub](https://github.com/lottie-react-native/lottie-react-native)
- rive-react-native: 789 stars, MIT, last push 2026-10-15; rive-nitro-react-native: 159 stars, MIT, last push 2026-11-13 — [GitHub rive-react-native](https://github.com/rive-app/rive-react-native), [GitHub rive-nitro-react-native](https://github.com/rive-app/rive-nitro-react-native)
- dotlottie-react-native: 50 stars, MIT, last push 2026-11-11 — [GitHub](https://github.com/LottieFiles/dotlottie-react-native)
- Callstack benchmark (older, Sony Xperia Z3): total memory Lottie 246 MB vs Rive 276 MB; native heap Lottie 49 MB vs Rive 25 MB; graphics Lottie 123 MB vs Rive 184 MB — roughly comparable — [Callstack](https://callstack.com/blog/lottie-vs-rive-optimizing-mobile-app-animation)
- Vendor claims (treat as marketing): Rive cites a 267 KB Lottie import vs 16 KB Rive-native file and a customer cutting ~150 KB to ~15 KB — [Rive blog](https://rive.app/blog/why-importing-lotties-isn-t-the-workflow-rive-was-built-for); LottieFiles counters that the zipped dotLottie format gives comparable sizes — [LottieFiles blog](https://lottiefiles.com/blog/working-with-lottie-animations/lottiefiles-or-rive)
- react-native-ease (appandflow): 995 stars, MIT, last push 2026-11-13 — [GitHub](https://github.com/appandflow/react-native-ease)
- react-native-sortables: 979 stars, MIT, last push 2026-11-10 — [GitHub](https://github.com/MatiPl01/react-native-sortables)

### Inferences
- Atlas distance/ETA readouts: start with `fontVariant: ['tabular-nums']` + cross-fade or number-flow port; rolling digits on every GPS tick would be noisy — throttle to meaningful changes (e.g. per 5 m / per minute), consistent with Kowalski's "don't animate what happens constantly".
- For a small team, Lottie (or dotLottie) for a handful of onboarding/empty-state illustrations is the lowest-risk path given adoption; Rive only pays off if state-machine-driven interactive illustrations are wanted. The Nitro-based Rive runtime is new (159 stars).
- Shimmer on Android should be a single translating gradient per skeleton group (one animated node), not per-row animations, to stay under the ~100 animated components guideline.
- Press feedback recipe: scale to 0.97 with ~100-160 ms ease-out (or 0 ms in / 150 ms out for opacity) and fire the haptic on press-in for primary actions.

### Gaps
- No primary source retrieved for skeleton/shimmer timing values (cycle duration, gradient width) or for optimistic-UI guidance.
- No 2026 benchmark of Rive (Nitro) vs Lottie on low-end Android.
- number-flow-react-native repo metadata (stars/licence) could not be confirmed via GitHub (guessed repo path 404); the similarly named `rn-number-flow` also exists — verify which is maintained.
- Animated icon libraries beyond SF Symbol effects were not researched.

---

## 8. Perceived performance

### Takeaway
The measurable levers are: ProMotion enabled (default in RN 0.82+ templates), keeping per-frame work off the JS thread, React Compiler memoization, a New-Architecture list (FlashList v2 or Legend List), and testing release builds on a budget high-refresh Android device.

### Cited Findings
- 120 fps on iOS requires `CADisableMinimumFrameDurationOnPhone = true` in Info.plist; it is on by default in the app template from RN 0.82 — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- Frame budget ≈ 8.3 ms at 120 Hz vs 16.6 ms at 60 Hz; a sub-$100 Android phone with a 120 Hz panel had 85% janky frames on a workload that showed 15% at 60 Hz — [Margelo](https://margelo.com/blog/profiling-skia-reanimated-low-end-android)
- Per-frame React state updates (`useState` + `runOnJS`) cost 8-15 ms UI-thread blocks through Fabric; per-frame allocations cause Hermes GC pauses — [Margelo](https://margelo.com/blog/profiling-skia-reanimated-low-end-android)
- React Compiler automatically memoizes frame callbacks and gesture objects — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- Profile release (or Android `debugOptimized`, RN 0.82+) builds; New-Architecture regressions are often debug-only — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- FlashList: 7,248 stars, MIT, latest release v2.3.3 on 2026-10-01 — [GitHub](https://github.com/Shopify/flash-list); v2 is New-Architecture-only — [pkgpulse guide](https://www.pkgpulse.com/guides/flashlist-vs-flatlist-vs-legendlist-react-native-lists-2026)
- Legend List: 3,440 stars, MIT, last push 2026-11-07 — [GitHub](https://github.com/LegendApp/legend-list)
- FlashList on New Architecture can show a layout blink that is an RN-side bug (RN issue #52373) — [Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- Third-party list comparisons disagree (one names FlashList v2 the default, another ranks Legend List between FlatList and FlashList) and cite un-reproducible single-author numbers — [reactnativerelay (cs)](https://reactnativerelay.com/cs/article/flashlist-v2-react-native-2026); [reactnativerelay (th)](https://reactnativerelay.com/th/article/priabthieb-flashlist-flatlist-legendlist-2026)
- Fonts embedded with the `expo-font` config plugin are available at launch with no async loading — [Expo fonts guide](https://docs.expo.dev/develop/user-interface/fonts/)

### Inferences
- For Atlas the lists are short (search results, floor lists, saved places); either FlashList v2 or Legend List is adequate — pick on bug profile, and note the native-tabs FlatList limitation in section 4.
- Position updates from the positioning engine should flow into shared values (worklets) rather than React state so the blue dot and route progress never re-render the map tree; the Margelo numbers show what per-frame `setState` costs.
- Config-plugin fonts remove a first-frame text flash, which is one of the cheapest perceived-startup wins.

### Gaps
- No sources retrieved on startup-time specifics for SDK 58 (Hermes version/bytecode, expo-splash-screen fade options, TTI numbers), on expo-image blurhash/thumbhash placeholders, or on React Compiler's status in SDK 58 templates. These key-question items are unanswered here.
- No independent, reproducible FlashList v2 vs Legend List benchmark found.
- Android high-refresh enablement specifics for RN (per-window preferred refresh rate on Samsung) not researched.

---

## 9. Text rendering polish

### Takeaway
Embed fonts with the `expo-font` config plugin (default recommendation), name files by PostScript name so families match across platforms, and note that SDK 58 / RN 0.88 adds variable-font support and `fontVariationSettings`.

### Cited Findings
- The config plugin is the recommended default for local fonts: bundled natively, available at startup, no async code; requires a development build; Android + iOS only (`useFonts` for web) — [Expo fonts guide](https://docs.expo.dev/develop/user-interface/fonts/)
- Android family name = file name without extension when only paths are listed; iOS reads the family name from the file; name files after the PostScript name (e.g. `Inter-Black`) so both agree — [Expo fonts guide](https://docs.expo.dev/develop/user-interface/fonts/)
- Android `fontDefinitions` take `path`, `weight`, optional `style`, optional `axes`; weight+style must be unique per family; declare weight and style for every face — [Expo fonts guide](https://docs.expo.dev/develop/user-interface/fonts/)
- Variable fonts supported on Android and iOS from SDK 58: Android reads `wght` (range needs Android 10+; `ital` axis Android 15+, otherwise synthesized); iOS uses named instances, picking the closest weight; RN 0.88 adds `fontVariationSettings` on `Text`/`TextInput` — [Expo fonts guide](https://docs.expo.dev/develop/user-interface/fonts/)
- Prefer OTF over TTF where both exist (smaller, sometimes better rendering) — [Expo fonts guide](https://docs.expo.dev/develop/user-interface/fonts/)
- If loading at runtime, hold the splash screen (`SplashScreen.preventAutoHideAsync()` at module scope; `hideAsync()` once loaded or errored) — [Expo fonts guide](https://docs.expo.dev/develop/user-interface/fonts/)

### Inferences
- Since many South African Android devices run Android versions below 15 (and some below 10), ship static weight files (or explicit `fontDefinitions`) rather than relying on variable-font weight ranges and the `ital` axis.
- Use tabular figures for distance/ETA/floor numbers so digits do not shift width during updates; this pairs with the ticker guidance in section 7.

### Gaps
- No source was retrieved for React Native `fontVariant: ['tabular-nums']` behaviour (and whether a given custom font supports the `tnum` feature), for font-scaling best practice (`maxFontSizeMultiplier`, `allowFontScaling`), or for truncation (`numberOfLines`, `ellipsizeMode`, `adjustsFontSizeToFit`). These are known RN APIs but are uncited here.

---

## 10. Sound design and spoken guidance

### Takeaway
`expo-speech` wraps the platform TTS engines with rate/pitch/voice control and a `VoiceQuality` of Default or Enhanced, but voices are device-dependent, iOS speech is silent in silent mode by default, and Android lacks pause/resume — so spoken guidance quality on Android will vary by device and installed TTS engine.

### Cited Findings
- `Speech.speak` options: `voice`, `rate` (1.0 normal), `pitch` (1.0 normal), `language` (BCP 47), `volume` (0-1), callbacks `onStart/onDone/onStopped/onError/onBoundary`; iOS-only `useApplicationAudioSession` — [Expo speech docs](https://docs.expo.dev/versions/v58.0.0/sdk/speech/)
- `getAvailableVoicesAsync()` returns device-dependent voices; identifiers must be fetched at runtime, not hard-coded; `VoiceQuality` is `Default` or `Enhanced` — [Expo speech docs](https://docs.expo.dev/versions/v58.0.0/sdk/speech/)
- On physical iOS devices speech produces no sound in silent mode — [Expo speech docs](https://docs.expo.dev/versions/v58.0.0/sdk/speech/)
- `pause()`/`resume()` are iOS and web only; `stop()` works everywhere; `maxSpeechInputLength` is platform-dependent — [Expo speech docs](https://docs.expo.dev/versions/v58.0.0/sdk/speech/)
- Google recommends co-designing haptic, visual and audio feedback together — [Android haptics design principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles)

### Inferences
- For Atlas, pick the best available voice at runtime (prefer `Enhanced` for the user's locale, e.g. en-ZA falling back to en-GB/en-US), keep prompts short, and pair each spoken turn with a haptic and a visual banner so guidance survives silent mode and poor TTS voices.
- South African language coverage (isiZulu, isiXhosa, Afrikaans, etc.) in on-device TTS engines on Samsung phones is likely uneven; it must be checked per device via `getAvailableVoicesAsync()`.

### Gaps
- No sources retrieved on `expo-audio` (short UI sound playback, latency, audio-session/ducking configuration) or on UI sound-design guidance (levels, durations). Unanswered.
- No source on TTS voice quality on Samsung (Samsung TTS vs Google Speech Services) or on SA-language voice availability.
- Whether `useApplicationAudioSession` plus an expo-audio session category allows speech in iOS silent mode was not verified.

---

## Appendix: library fact table (GitHub API, 2026-11-14)

Columns that could not be verified from a fetched source are marked "n/v" (not verified) rather than guessed.

| Library | Licence | Stars | Last release / push | Expo requirement | New Arch | Reanimated 4 |
|---|---|---|---|---|---|---|
| [react-native-reanimated](https://github.com/software-mansion/react-native-reanimated) | MIT | 11,071 | push 2026-11-13; 4.7 in Atlas | bundled with Expo SDK | required ([migration guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/)) | is v4 |
| [react-native-gesture-handler](https://github.com/software-mansion/react-native-gesture-handler) | MIT | 6,805 | push 2026-11-13; v3 hook API ([guide](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3/)) | bundled with Expo SDK | n/v | accepts SharedValues in config |
| [react-native-screens](https://github.com/software-mansion/react-native-screens) | MIT | 3,752 | push 2026-11-13 | bundled with Expo SDK | n/v | n/a |
| [react-native-svg](https://github.com/software-mansion/react-native-svg) | MIT | 8,012 | push 2026-11-13 | bundled with Expo SDK | n/v | CSS animations on Circle/Ellipse/Line/Path/Rect ([flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)) |
| [@shopify/react-native-skia](https://github.com/Shopify/react-native-skia) | MIT | 8,780 | v3.10.1, 2026-11-13 | dev build (native); n/v plugin | n/v | used with Reanimated 4 + worklets in [Margelo study](https://margelo.com/blog/profiling-skia-reanimated-low-end-android) |
| [@gorhom/bottom-sheet](https://github.com/gorhom/react-native-bottom-sheet) | MIT | 9,111 | 5.2.14, 2026-05-09 | JS-only (works in Expo) | n/v | docs say Reanimated v1-3 ([docs](https://gorhom.dev/react-native-bottom-sheet/)) |
| [@lodev09/react-native-true-sheet](https://github.com/lodev09/react-native-true-sheet) | MIT | 2,097 | v4.1.0, 2026-11-07 | dev build (native) | required from v3 ([docs](https://sheet.lodev09.com/)) | yes, ^4.1.0 ([guide](https://sheet.lodev09.com/guides/reanimated)) |
| [react-native-actions-sheet](https://github.com/ammarahm-ed/react-native-actions-sheet) | MIT | 2,201 | push 2026-11-01 | n/v | n/v | n/v |
| [react-native-keyboard-controller](https://github.com/kirillzyusko/react-native-keyboard-controller) | MIT | 3,765 | push 2026-11-14 | dev build (native) | n/v | n/v |
| [react-native-bottom-tabs](https://github.com/callstack/react-native-bottom-tabs) | MIT | 1,472 | push 2026-11-10 | dev build (native) | n/v | n/a |
| [callstack/liquid-glass](https://github.com/callstack/liquid-glass) | MIT | 1,733 | push 2026-09-15 | dev build (native) | n/v | n/a |
| [zeego](https://github.com/nandorojo/zeego) | MIT | 2,254 | push 2026-01-28 | dev build (native deps) | n/v | n/a |
| [react-native-ios-context-menu](https://github.com/dominicstop/react-native-ios-context-menu) | MIT | 699 | push 2026-04-17 | dev build | n/v | n/a |
| [@react-native-menu/menu](https://github.com/react-native-menu/menu) | MIT | 1,239 | push 2026-08-17 | dev build | n/v | n/a |
| [expo (expo-haptics, expo-glass-effect, expo-symbols, @expo/ui, expo-font, expo-speech)](https://github.com/expo/expo) | MIT | 53,543 | SDK 58 ([changelog](https://expo.dev/changelog/sdk-58)) | first-party | yes (SDK 58 = RN 0.88) | n/a |
| [react-native-pulsar](https://github.com/software-mansion/pulsar) | MIT | 469 | push 2026-11-13 | Expo config plugin for bundles ([docs](https://docs.swmansion.com/pulsar/sdk/react-native/)) | n/v | worklet-compatible; needs react-native-worklets |
| [react-native-haptic-feedback](https://github.com/mkuczera/react-native-haptic-feedback) | MIT | 982 | push 2026-06-10 | dev build | n/v | n/a |
| [@shopify/flash-list](https://github.com/Shopify/flash-list) | MIT | 7,248 | v2.3.3, 2026-10-01 | JS-only in v2 (n/v) | required for v2 ([pkgpulse](https://www.pkgpulse.com/guides/flashlist-vs-flatlist-vs-legendlist-react-native-lists-2026)) | n/v |
| [@legendapp/list](https://github.com/LegendApp/legend-list) | MIT | 3,440 | push 2026-11-07 | n/v | n/v | n/v |
| [lottie-react-native](https://github.com/lottie-react-native/lottie-react-native) | Apache-2.0 | 17,215 | push 2026-11-13 | dev build | n/v | n/a |
| [rive-react-native](https://github.com/rive-app/rive-react-native) | MIT | 789 | push 2026-10-15 | dev build | n/v | n/a |
| [rive-nitro-react-native](https://github.com/rive-app/rive-nitro-react-native) | MIT | 159 | push 2026-11-13 | dev build | n/v | n/a |
| [dotlottie-react-native](https://github.com/LottieFiles/dotlottie-react-native) | MIT | 50 | push 2026-11-11 | dev build | n/v | n/a |
| [expo-material3-theme](https://github.com/pchmn/expo-material3-theme) | MIT | 133 | push 2026-02-02 | dev build | n/v | n/a |
| [react-native-ease](https://github.com/appandflow/react-native-ease) | MIT | 995 | push 2026-11-13 | n/v | n/v | n/v |
| [react-native-redash](https://github.com/wcandillon/react-native-redash) | MIT | 2,058 | push 2026-08-04 | JS-only | n/v | n/v |
