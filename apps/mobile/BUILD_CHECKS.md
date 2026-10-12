# Native build and runtime checks — 2026-10-12

## Xcross

Executable: `%LOCALAPPDATA%\xcross\bin\xcross.exe`, version **2.0.2**.

Actual commands were executed from apps/mobile:

| Command | Result |
|---|---|
| `xcross react-native --help` | Command not found |
| `xcross flutter build --no-pub` | Initially could not resolve the iOS bundle identifier; after generating the native iOS project, failed with `pubspec.yaml not found` |
| `xcross compose build --configuration debug` | Failed with `No settings.gradle.kts found` |

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

## Android runtime

Actual rendering remains **unverified**. Expo Go 2.31.2 failed on both the installed Android 37 preview/16 KB emulator and a fresh stable API 34 emulator. The client/version match was checked against Expo's versions API: SDK 51, React Native 0.74.5, client 2.31.2.

A minimal React Native Text/View startup probe also failed, and was removed afterward. Clearing Expo Go data, rebuilding Metro's cache, reducing workers and retrying without external networking did not resolve startup. Logs included `Unable to attach a rootView to ReactInstance when UIManager is not properly initialized` and `host.exp.exponent.MainApplication cannot be cast to com.facebook.react.ReactApplication`.

No Android map, interaction or screenshot pass is claimed. A compatible development client/device run is needed to complete visual verification; standalone Android map-provider initialization requires a Google Maps key. The code and iOS compilation checks above do not replace runtime QA.
