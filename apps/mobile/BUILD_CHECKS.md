# Native build and runtime checks

## Map-free beta bundle exports — 2026-11-13

- Android and iOS each exported successfully twice with the connected fictional venue enabled. The Hermes files had matching names per platform and differed by one byte in size, with different SHA-256 hashes.
- Mobile regression tests and deterministic replay passed. Installation, connected Android/iOS interaction, device storage, QR scanning and system sharing still need current runtime checks. See the [beta readiness report](../../docs/indoor-navigation-beta-readiness.md).

## Map visual cleanup — 2026-11-06

- Reduced prominent-store depth to 2.5 map units and flattened the smaller units. Softened shadows, surface highlights and tile contrast.
- Reduced primary name size, used quieter text colours and removed fictional-store icon badges. Fictional names reveal at closer zoom or when selected; overview keeps the original five major labels. Label hit testing respects the same reveal threshold.
- TypeScript and the 284-case route, viewport, camera and place-memory suite passed. Android Expo Go rendered the simplified overview and opened the cafe preview from its discovery card.

## Concept venue depth and content — 2026-11-06

- Added shallow shop wall faces and glazed surfaces, warm concourse tiles and illustrative court planting/seating. The camera remains overhead and touch footprints retain their original geometry.
- Eight fictional tenants reuse existing unit IDs and gallery approaches. Discovery cards, directory and search share the same identities; details identify the fictional content. The original five reference names remain.
- TypeScript, 284 schematic routing combinations and the viewport, camera and place-memory checks passed. Android Expo Go rendered the light scene and dark walking preview, and opened Juniper Cafe's route from its discovery card. Captures are under artifacts/sdk58/concept-* and juniper-final-preview.png. The SDK 58 iOS development bundle returned HTTP 200 (7,629,673 bytes); native iOS appearance remains unverified.

## Expo SDK 58 upgrade — 2026-11-06

- Expo 58.0.23, React Native 0.88.1, React 19.3.0 and their supported native modules are installed. The mobile app requires Node 22.13 or a newer supported release; the EAS simulator profile uses Node 22.13.0.
- Expo dependency compatibility and all 20 Expo Doctor checks passed. Mobile TypeScript and the 284-case route suite, viewport, camera and place-memory checks passed.
- The public Expo tunnel returned an SDK 58 iOS manifest and a successful Hermes development bundle response (7,621,433 bytes). The first uncached request exceeded the tunnel timeout; the warm bundle returned HTTP 200.
- Android Expo Go 58.0.5 on the Atlas API 34 emulator rendered the home map, directory, Woolworths preview, walking steps, active guidance and arrival. Runtime captures are under the ignored artifacts/sdk58 directory.
- Physical iPhone runtime and native iOS glass appearance remain device checks. Existing standalone iOS builds predate this upgrade.

## Map screen comparison and UI refinement — 2026-11-06

- Android Expo Go verified the map dock, sheet gestures, search filters, saved places, the directory, walking steps before starting, and the transition from dotted preview to solid guidance. The emulator also exercised pause, manual zoom, returning to follow mode and ending the demo.
- Arrival and dark appearance were visually checked. Home and route preview also rendered with accessible controls at a 360 × 800 logical-pixel viewport.
- Mobile TypeScript, the 284-case route and UI regression suite, and iOS Hermes export passed. Native iOS appearance remains to be checked on a device.

## Map and motion refinement — 2026-11-04

- Android Expo Go on the Atlas API 34 emulator verified search and keyboard dismissal, saved places, route preview and expanding place details, simulated turn guidance, pause and resume, manual pan and recenter, route steps, and arrival. Drag and tap both changed the suggestion sheet detent. The detents and route flow also worked with Reduce Motion enabled.
- Mobile TypeScript and the regression suite passed, including 284 schematic route cases plus the map viewport, camera and place-memory checks.
- iOS Hermes export passed. Native Liquid Glass appearance and physical-device frame pacing remain to be verified.

## Map-first redesign — 2026-10-17

- TypeScript passed after the map-first redesign; no automated suites were run.
- Android Expo Go rendered the position-focused home map, bottom search sheet and menu. The Settings entry and Back to map worked; searching Clicks returned one result and opened its route preview. Continuous Woolworths movement advanced across multiple turns; pause/continue was confirmed in the native UI. A Clicks walkthrough reached its arrival instruction. The iOS Hermes development bundle returned HTTP 200 (7,327,359 bytes).
- Screenshots under artifacts/map-first include home.png and walking.png. Earlier captures in that folder may precede final spacing changes.
- Native glass is capability-gated and has Reduce Transparency/Reduce Motion fallbacks. Its iOS appearance and physical-device smoothness remain unverified. Indoor movement is simulated, never GPS positioning.

## Sandton schematic and immersive UI — 2026-10-17

The active fixture is now traced from the user's supplied image: 141 spaces, five visible store names, one Reference level and an illustrative gallery routing graph. The original image is preserved in assets/sandton-reference.png.

- Mobile TypeScript compilation passed after the map and UI changes.
- The current iOS Hermes development bundle returned HTTP 200 from the phone-facing server. No physical iPhone runtime is claimed.
- Actual Android Expo Go 57.0.9 screens were rendered and visually inspected for the light/dark map overview, complete directory, Woolworths route preview and focused navigation. The trace, surrounding roads, native controls and route were visible. Captures are under the ignored artifacts/immersive-ui directory.
- Dense unknown-unit labels mount at the detail zoom threshold; no physical-device frame-rate measurement was performed.
- Existing fixture assertions were adapted for reference-level routes and generated units. Automated test suites were not run during this UI request.
- The Android emulator used a separate local Metro port because the LAN address did not load reliably from that emulator. The phone-facing LAN server remains on port 8081.

Unknown tenant names and actual entrance positions are unconfirmed. Routes to those units end at a nearby mapped gallery. These are schematic routes, not verified indoor navigation for a real visit. The historical results below belong to the earlier Galleria fixture.

## Historical Galleria custom map — 2026-10-17

The current map replaces react-native-maps with a local SVG scene, Gesture Handler and Reanimated. Atlas Galleria is a fictional two-floor demo with 24 named stores. The older SDK 51/client findings below describe the previous implementation.

- Mobile TypeScript and Expo dependency compatibility checks passed with SDK 57, React Native 0.86.3 and TypeScript 6.0.3.
- The routing suite passed 54 destination/preference combinations, exact entrance endpoints, lift-only step-free routing and unreachable-floor handling.
- The new map suite checks all 24 named unit/directory identities, label hit testing, routes outside store interiors, focal-point invariance through zoom limits, panel/control padding and nearby storefront context in follow mode.
- Actual iOS and Android Hermes development bundle requests returned HTTP 200. This is bundle evidence; no new standalone iOS compilation is claimed.
- **Actual Android runtime passed** on the Atlas_API34 emulator with Expo Go 57.0.9, installed from Expo's SDK-specific official release URL. The custom map rendered with all 12 store names on the ground floor.
- Tapping the Woolworths unit selected Woolworths and drew a route to its doorway. ZARA selection opened the Level 1 route preview; Start returned to the ground-floor demo entrance.
- The complete seven-step ZARA journey passed native UI checks: pan to manual mode, advance without resuming the camera, Resume, actual corner instructions, escalator transition to Level 1, and arrival. Native hierarchy assertions confirmed the mode, step, floor and completion states.
- Native captures also cover the explicit zoom buttons, double-tap zoom, Recenter, both floor overviews and light/dark map appearance. Searching for the newly added LEGO Store returned one result and opened that store's route preview.
- Native screenshots and hierarchy dumps are in the ignored apps/mobile/artifacts/custom-map folder. The local scripts there document the actions taken against the emulator.

Physical iPhone runtime, VoiceOver/TalkBack operation, real two-finger touch on a phone and measured physical-device frame rates remain device QA tasks. The emulator run does not establish those results. The demo advances explicitly and does not track live movement.

## Historical SDK 51 checks — 2026-10-12

## Xcross

Executable: `%LOCALAPPDATA%\xcross\bin\xcross.exe`, version **2.0.2**.

Actual commands were executed from apps/mobile:

| Command                                      | Result                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `xcross react-native --help`                 | Command not found                                                                                                                    |
| `xcross flutter build --no-pub`              | Initially could not resolve the iOS bundle identifier; after generating the native iOS project, failed with `pubspec.yaml not found` |
| `xcross compose build --configuration debug` | Failed with `No settings.gradle.kts found`                                                                                           |

The native iOS probe generated an Expo project using the SDK 51 prebuild internals, because the normal CLI skips iOS on Windows. It did not install Pods or compile anything. Generated native files are ignored. No fake Flutter manifest was added. A working React Native Xcross command/wrapper remains needed to reproduce the user's other project.

## iOS compilation

- First EAS compilation failed in the Xcode bundle phase because `expo-asset` could not be resolved under the isolated pnpm layout.
- Enabling hoisted dependencies in the root .npmrc fixed native autolinking and module resolution.
- [Build fc599bf0](https://expo.dev/accounts/certi4no/projects/indoor-navigation-mobile/builds/fc599bf0-445d-44a6-b5a8-07901f2e18a8) completed successfully and produced a Release simulator application.
- [Build 5273ac4d](https://expo.dev/accounts/certi4no/projects/indoor-navigation-mobile/builds/5273ac4d-3e16-4657-aaf6-5adcef163cd0) also completed successfully, compiling the new native map overlays, directory screens and destination-specific routing.
- [Final build 1aaa674b](https://expo.dev/accounts/certi4no/projects/indoor-navigation-mobile/builds/1aaa674b-3c49-4681-9475-8dd21ca3e6ef) completed successfully with the final typography, quick-destination actions and Android environment configuration seam. [Download simulator app](https://expo.dev/artifacts/eas/9FGYj9YEUgwjT6kbeZ8-83302S1Rca5j1-nEFf3p8c0.tar.gz).

The artifact is an iOS simulator app, not a signed physical-device/App Store build. It was compiled on EAS's macOS/Xcode builder and has not been launched in an iOS simulator from Windows. These are EAS results, not successful Xcross results.

## Code checks

- All workspace TypeScript checks passed after the native dependency setup.
- Mobile routing test passed all 18 destination/preference combinations, exact endpoints, floor changes, lift-only transitions for step-free routes, and an unreachable floor.
- Expo dependency compatibility check passed.
- iOS JavaScript/Hermes bundle export passed; this is separate from native compilation.

## Further UX enhancement pass (2026-10-12)

- Primary-source research and implementation rationale: docs/mobile-ux-research.md.
- All workspace TypeScript checks and Expo dependency compatibility passed.
- The mobile suite passed all 18 routing cases, place-history recovery/pruning/ordering/saving/clearing, and floor/route/follow/manual camera checks.
- iOS JavaScript/Hermes export passed with the new native haptics and AsyncStorage integrations.
- An isolated React 18.2 hook harness with mocked native storage passed early-action hydration, history clearing/saving merge, read-failure preservation, serialized writes and write-error recovery. This is not a native AsyncStorage/device test.
- [Build 37628342](https://expo.dev/accounts/certi4no/projects/indoor-navigation-mobile/builds/37628342-1f62-474d-943e-99889684fa31) completed successfully, compiling the UX/motion pass with expo-haptics 13.0.1 and AsyncStorage 1.23.1.
- [Final UX build f6359dda](https://expo.dev/accounts/certi4no/projects/indoor-navigation-mobile/builds/f6359dda-0630-4c7f-9c17-ba9fc1ff83b8) **FINISHED successfully**, including the failed-storage-read guard and Android back-navigation correction. [Download simulator application](https://expo.dev/artifacts/eas/gFc-Oua59PEKD1d4nSCIvI0RVr5MobSS0Du6SqmeS90.tar.gz).
- The final iOS Hermes export also passed (1171 modules, 2.7 MB bundle).

Native runtime verification is still outstanding. No simulator/device screenshot or physical haptic verification is claimed for this pass.

## Android runtime details

Actual rendering remains **unverified**. Expo Go 2.31.2 failed on both the installed Android 37 preview/16 KB emulator and a fresh stable API 34 emulator. The client/version match was checked against Expo's versions API: SDK 51, React Native 0.74.5, client 2.31.2.

A minimal React Native Text/View startup probe also failed, and was removed afterward. Clearing Expo Go data, rebuilding Metro's cache, reducing workers and retrying without external networking did not resolve startup. Logs included `Unable to attach a rootView to ReactInstance when UIManager is not properly initialized` and `host.exp.exponent.MainApplication cannot be cast to com.facebook.react.ReactApplication`.

No Android map, interaction or screenshot pass is claimed. A compatible development client/device run is needed to complete visual verification; standalone Android map-provider initialization requires a Google Maps key. The code and iOS compilation checks above do not replace runtime QA.
