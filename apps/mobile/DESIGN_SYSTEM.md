# Atlas map-first UI

The mall overview puts Search, Directory, and Saved together in the bottom dock. Tap or drag the handle to reveal suggested places. The top bar shows the venue and opens map options.

Native regular Liquid Glass is reserved for floating controls and the menu on supported iOS devices. Other platforms use static surfaces. Reduced motion, reduced transparency and increased contrast use opaque fills. Slate typography and cobalt actions work in light and dark appearances. Search uses a dedicated screen with category filters and grouped results. The route preview puts the estimated time, walking steps and start action in the same card, with venue details available on demand.

The suggestions sheet tracks the drag and springs to its compact or expanded position on release. Floating controls follow it while the map holds its framing until release. Walking guidance interpolates the position, bearing and camera, with a stable zoom. Panning stops camera following while the demo continues, and recenter restores following. The map offers explicit zoom controls during manual exploration and accessibility zoom actions.

Settings and the directory have an explicit Back to map control. The demo label stays visible in the main flow. The floor plan, route lengths and entrances are approximate, and the position marker represents the simulated walk.

## Navigation screen references

- **Waze** uses a high-contrast maneuver panel above the map and groups arrival and travel totals below. Its search screen keeps categories and recent places close to the field. Atlas uses the same separation of tasks for indoor walking. [Published screens](https://apps.apple.com/us/app/waze-navigation-live-traffic/id323229106) · [Search guide](https://support.google.com/waze/answer/6262563?hl=en)
- **Google Maps** gives the highlighted route and upcoming maneuver priority, with map controls grouped along the edge and trip totals in a compact card. Atlas uses dots for walking previews, a solid path during guidance, and a labeled Follow route control after exploring the map. [Published screens](https://apps.apple.com/us/app/google-maps/id585027354) · [Navigation guide](https://support.google.com/maps/answer/3273406?hl=en)
- **Apple Maps** keeps the destination visible around its place cards and adds indoor detail with zoom. Atlas uses a compact place card, offers walking steps before starting, and reveals unconfirmed unit references at close zoom. [Indoor map guidance](https://developer.apple.com/design/human-interface-guidelines/maps/) · [Walking directions](https://support.apple.com/en-gb/guide/iphone/iph8eae299d1/27/ios/27)
