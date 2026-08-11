# Atlas mobile

The map screen uses `react-native-maps` on iOS and Android and a platform-specific SVG fallback on web. The current native basemap is outdoor context used only to prototype the interaction model; the overlaid route is deterministic fixture data and does not represent surveyed mall geometry.

## Maps configuration

Expo Go can exercise the native preview without committing credentials. Store builds that select Google Maps require platform map credentials supplied through local/EAS build configuration. Do not put map keys in this repository. iOS uses the system map provider by default; Android uses Google Maps.

## Run

```powershell
corepack pnpm --filter mobile start
corepack pnpm --filter mobile web
```

The web target deliberately retains the structured vector renderer. A successful web export verifies the shared UI and fallback only; it does not prove that the native map provider rendered.
