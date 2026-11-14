# Navigation app UI/UX patterns that read as "premium" (state as of Nov 2026)

Reader notes on evidence quality:
- "Primary" = vendor docs / vendor blog / Apple HIG fetched directly. "Secondary" = tech press reporting on a release. "Snippet" = seen only in a search-result summary, page not opened; treat as lower confidence.
- Dates are given per finding. Anything before 2024 is marked (older).
- Several things the brief asked for could not be sourced (see Gaps in each section). Nothing in "Cited Findings" is from memory; design suggestions for Atlas are confined to "Inferences".

## 1. Outdoor leaders: what Apple Maps, Google Maps, Waze, Citymapper, Transit, Mapbox, HERE WeGo do per screen, and what changed recently

### Takeaway
The 2025-26 redesigns converge on the same moves: everything becomes a rounded bottom sheet over a always-visible map, controls migrate to the bottom/right for one-handed use, the guidance banner shrinks while ETA/time/distance get larger, and instructions move from distances to visible landmarks. Google's stated reasons are reachability and context preservation; Apple's iOS 26 change is mostly material (Liquid Glass) plus a smaller instruction bar and an always-present floating Directions button.

### Cited Findings

**Apple Maps, iOS 26 (Sept 2025) - secondary, MacRumors guide**
- Search bar and navigation menu are translucent so the map shows through; place icons are larger; icons have a layered-glass look; menus, cards and buttons have more rounded corners; the share sheet is a transparent popover. — [MacRumors iOS 26 Maps guide](https://www.macrumors.com/guide/ios-26-maps/)
- Guidance: turn-by-turn directions now appear in "a smaller pop-up bar instead of across the top of the screen", and ETA, travel time and distance are more prominent. — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/)
- Place card: Call, Menu and Website buttons moved higher in the place view alongside hours (and an order option when available); a floating Directions button sits at the bottom right and is always available. — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/)
- Voice: "Voice Volume" renamed "Voice Controls" with three labelled options - Muted, Alerts Only, Unmuted (previously unlabelled toggles in iOS 18). — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/)
- During navigation a new incident button sits on the right side of the screen; report types expanded from 3 (crash, speed check, hazard) to 6 (adds traffic, roadwork, road closure). — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/)
- "Library" tab renamed "Places", with improved spacing and a new Visited Places section (grouped by month, searchable; retention 3 months / 1 year / forever; on-device only). Preferred Routes learns commutes on-device and alerts about delays. — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/)
- Liquid Glass was toned down during the beta after social-media complaints (legibility); the redesign is described as most visible on place listings and guides. — [9to5Mac, Sept 2025](https://9to5mac.com/2025/09/18/heres-everything-new-for-apple-maps-in-ios-26/) (snippet-level; attribution of this specific claim to this URL vs. other launch coverage in the same result set is not verified)

**Apple Maps, iOS 27 (Sept 2026) - secondary, 9to5Mac**
- Changes are incremental, not a UI overhaul: AI-enhanced Flyover in select cities; "Local Lists" (US only) of trending place collections; a "Trending Restaurants" section on the search screen; Suggested Places becomes a horizontally swipeable row with many more than two suggestions (built on iOS 26.5); natural-language search extends to routing details; Parked Car Smart Stack widget; unspecified Offline Maps improvements; refreshed icon. — [9to5Mac, 24 Sept 2026](https://9to5mac.com/2026/09/24/heres-everything-new-for-apple-maps-in-ios-27/)
- The article does not report navigation-UI or indoor-map changes in iOS 27. — [9to5Mac](https://9to5mac.com/2026/09/24/heres-everything-new-for-apple-maps-in-ios-27/)

**Google Maps, sheet redesign (Android July 2024; iPhone v25.10.2, March 2025) - secondary, 9to5Google**
- All bottom sheets got more rounded corners. — [9to5Google, 7 Mar 2025](https://9to5google.com/2025/03/07/google-maps-iphone-sheet-redesign/)
- When a place listing is dragged fully up, a sliver of map stays visible above it behind the status bar - reported as preserving context. Place listings are sheets, no longer fullscreen pages. — [9to5Google](https://9to5google.com/2025/03/07/google-maps-iphone-sheet-redesign/)
- Dismissal moved: the left-side back button in the search bar was removed and replaced by an "x" in the sheet's top-right corner next to Share; the search bar is gone from the listing view. Stated benefit: reachability and one-handed use; it also matches Apple Maps' close behaviour. — [9to5Google](https://9to5google.com/2025/03/07/google-maps-iphone-sheet-redesign/)
- Directions: destination entry stays fullscreen; once set, start and end points sit in a floating rounded rectangle at the top while the transport-mode switcher moves to the bottom of the screen. — [9to5Google](https://9to5google.com/2025/03/07/google-maps-iphone-sheet-redesign/)
- Full sheet redesign including You/Contribute tabs reached Android stable in v25.16 (April 2025). — [9to5Google, 24 Apr 2025](https://9to5google.com/2025/04/24/google-maps-sheet-redesign-android/) (snippet)

**Google Maps, trip-overview / route-preview card (Android v25.13.06, March 2025) - secondary**
- Old layout: three dense text lines with empty space on the right. New layout: the colour-coded duration is much larger and spans two lines on the left; a new "Arrive hh:mm AM/PM" line carries the route description; the last line carries distance plus toll fees/savings. Applies to all transport modes. Reviewer's reading: less dense, emphasises the one key figure, better use of sheet width. — [9to5Google, 31 Mar 2025](https://9to5google.com/2025/03/31/google-maps-directions-redesign/)

**Google Maps, landmark guidance (US, 5 Nov 2025) - primary**
- Example instruction: "turn right after the Thai Siam Restaurant", with the landmark highlighted on the map as the user approaches. Landmark types: gas stations, restaurants, famous buildings, used alongside traffic lights and stop signs. — [Google blog, 5 Nov 2025](https://blog.google/products/maps/gemini-navigation-features-landmark-lens/)
- Selection method: Gemini cross-references ~250 million places with Street View imagery to choose landmarks that are actually visible from the street. Stated rationale: distance cues such as "turn right in 500 feet" are uncertain for users. — [Google blog](https://blog.google/products/maps/gemini-navigation-features-landmark-lens/)
- Same release: hands-free multi-step voice requests, voice incident reporting ("I see an accident"), proactive traffic alerts even when not navigating (Android, US), and Lens with Gemini from a camera icon in the search bar. — [Google blog](https://blog.google/products/maps/gemini-navigation-features-landmark-lens/)

**Google Maps, "Immersive Navigation" + "Ask Maps" (US, 12 Mar 2026) - secondary only**
- Billed as the biggest navigation redesign in over a decade: a 3D guidance view with buildings, overpasses and terrain; lanes, crosswalks, traffic lights and stop signs highlighted; "smart zooms" and transparent buildings so the driver can see the upcoming turn through occluding geometry; upgraded lane guidance at complex interchanges. US first, expanding to iOS, Android, CarPlay, Android Auto. — [Droid Life, 12 Mar 2026](https://www.droid-life.com/2026/03/12/google-maps-navigation-gets-biggest-update-in-a-decade/); [TechCrunch, 12 Mar 2026](https://www.techcrunch.com/2026/03/12/google-maps-is-getting-an-ai-ask-maps-feature-and-upgraded-immersive-navigation/); [9to5Google](https://9to5google.com/2026/03/12/google-maps-immersive-navigation) (all snippet-level)
- Ask Maps: conversational search reached via a button near the search bar, supports follow-up refinement, draws on 300M+ places; US and India first. — [TechCrunch](https://www.techcrunch.com/2026/03/12/google-maps-is-getting-an-ai-ask-maps-feature-and-upgraded-immersive-navigation/) (snippet)
- Some user reaction was negative: commenters called the 3D visuals distracting. — [Droid Life](https://www.droid-life.com/2026/03/12/google-maps-navigation-gets-biggest-update-in-a-decade/) (snippet)
- An APK teardown shows Google testing a re-layout of the guidance screen controls: Gemini icon to bottom-left, exit to the right, alternate-routes above the report button; functions unchanged, positions only; apparent aim is one-handed use. Date of teardown not confirmed. — [Android Authority](https://www.androidauthority.com/google-maps-ui-gemini-ask-maps-apk-teardown-3689527/) (snippet)

**Waze (2024-2026) - secondary**
- No visual redesign found for 2025-26; changes are behavioural. Conversational Reporting (speak an incident in natural language) was announced Oct 2024, left beta Oct 2025; July 2026 added spoken map-edit suggestions, Gemini destination search, motorcycle mode, learned personal routing, and a "less chatty" mode that keeps critical hazard/turn/lane prompts but reduces frequency. — [9to5Mac, 14 Jul 2026](https://9to5mac.com/2026/07/14/waze-now-learns-your-preferences-and-gets-more-conversational-but-less-chatty/); [TechCrunch, 13 Jul 2026](https://techcrunch.com/2026/07/13/waze-adds-new-ai-powered-features-and-customization-updates/) (snippets)
- A cautionary detail: the Conversational Reporting rollout used a promo pop-up that would not go away unless the user enabled the feature; press called it annoying. — [Stuff, 8 Oct 2025](https://stuff.co.za/2025/10/08/waze-adds-conversational-reporting-to-cease) (snippet)

**Citymapper - primary (company posts) and student critiques**
- GO mode's notification policy is restraint: it promises no unnecessary alerts; the alert it sends is the get-off alert as the stop approaches. Get Off Alerts start automatically when a route is started with GO and work offline (e.g. underground). — [Citymapper, GO](https://citymapper.com/i/517/go-your-personal-trip-assistant); [Citymapper, Get Off Alerts](https://content.citymapper.com/news/823/get-off-alerts?l=ru) (snippets; these posts are older, undated in results)
- iOS Lock Screen Navigation lets users follow a GO trip without unlocking; it tracks stops remaining and alerts before the final stop. If notifications are disabled, an icon is shown that deep-links to settings. — [Citymapper](https://content.citymapper.com/i/2553/citymapper-introduces-ios-lock-screen-navigation) (snippet)
- A Feb 2026 Pratt design critique describes the in-trip screen as countdowns, live arrivals, stop counts and "Get off now" prompts that update continuously with movement, framed as reducing memory load; a second critique credits Dynamic Island/ETA notifications with removing the need to reopen the app. — [Pratt IXD, Feb 2026](https://ixd.prattsi.org/2026/02/design-critique-citymapper-ios-app/); [Pratt IXD, Sept 2026](https://ixd.prattsi.org/2026/09/design-critique-citymapper/) (student work, not usability data)

**Transit 6.0 (Aug 2025) - secondary**
- First major interface overhaul since 2018. Replaced Interstate with a custom version of Puffin (rationale: friendlier, less tied to North American car culture). Larger type and more white space; redesigned search, schedules, trip-details and route screens. ETA cards are the centrepiece and stay visible while exploring routes. "Neon" dark mode uses more vivid colours and higher contrast for low-light legibility. — [AlternativeTo, Aug 2025](https://alternativeto.net/news/2025/8/transit-6-0-launches-with-new-typeface-refreshed-design-neon-dark-mode-and-new-eta-cards)
- Transit built a colour-matching algorithm so agency/brand colours remain legible on dark backgrounds. — [METRO Magazine, Nov 2025](https://www.metro-magazine.com/10249917/how-the-transit-app-is-redefining-what-it-means-to-move-without-a-car) (snippet)

**Mapbox Navigation SDK drop-in UI - primary docs**
- Android drop-in UI defines five explicit screen states, each with a fixed component set — [Mapbox Android navigation states](https://docs.mapbox.com/android/navigation/v2/guides/drop-in-ui/navigation-states/):
  - Free Drive: full-screen map, puck with bearing, speed limit, recenter button, camera controls, floating road-name label.
  - Destination Preview: adds destination marker and an info panel with POI details (reverse-geocoded), a Route Preview button, a Start Navigation button, and a custom slot.
  - Route Preview: primary route plus selectable alternatives, camera in overview mode, info panel with trip progress (ETA, distance, duration) and Start Navigation.
  - Active Guidance: navigation (following) camera, route line with congestion plus a route arrow at the manoeuvre, road name, camera and volume buttons, speed limit, manoeuvre view, info panel with trip progress and End Navigation.
  - Arrival: triggered when approaching the end of the route; info panel swaps to arrival text plus End Navigation; manoeuvre view states which side of the street the destination is on.
- iOS top banner hierarchy: primary = name of the road/exit for the next manoeuvre; secondary (optional) = more detail; tertiary (optional) = the manoeuvre after next if it follows soon, or lane guidance; quaternary (optional) = junction graphic. Tapping or swiping down on the banner expands the full step list. Bottom banner = ETA, distance remaining, time remaining. Floating buttons: route overview, resume (recenter after overview or manual pan), volume/mute, feedback. — [Mapbox iOS UI guide](https://docs.mapbox.com/ios/navigation/guides/turn-by-turn-navigation/user-interface/)

### Inferences
- The consistent 2025-26 direction is "less chrome, bigger numbers": Apple shrank the instruction bar and enlarged ETA/time/distance; Google enlarged the duration and added an explicit "Arrive hh:mm" line. For Atlas's route preview sheet: one large duration figure (lime or white on navy), an "Arrive 14:32"-style line, then distance and floor-change count as the tertiary line.
- Mapbox's five-state model maps almost 1:1 onto Atlas's components: Free Drive = map home + search sheet; Destination Preview = destination sheet (primary "Start", secondary "Preview route"); Route Preview = overview camera + alternatives (standard vs step-free); Active Guidance = navigation panel + manoeuvre banner; Arrival = distinct sheet content, not just the last step. Treating these as explicit states with fixed component sets is itself a polish lever, because nothing lingers from a previous state.
- Mapbox's "tertiary line = the manoeuvre after next when it follows soon" is directly applicable indoors, where turns chain within a few metres ("then take the escalator up").
- Google's arrival detail ("which side of the street") translates to "Woolworths is on your left" indoors.
- Google's landmark selection rule - only landmarks verified visible from the traveller's viewpoint - is the important part, not the LLM. In a mall this means anchor tenants with large fascia signage, escalators, atria, not small kiosks.
- Citymapper's single-alert policy and Waze's "less chatty" mode both treat silence as a feature. Atlas should cap haptics/audio at decision points (turn, floor change, arrival, off-route).
- Waze's sticky promo pop-up is a documented anti-pattern: never gate dismissal on opting in (relevant to Atlas QR-scan or permission prompts).
- Negative reaction to Immersive Navigation suggests 3D richness is not automatically read as premium; clarity at the decision point is.

### Gaps
- HERE WeGo: no 2025-26 source found on its home/search/guidance UI or redesign rationale. Not researched beyond the initial search set.
- Waze screen-by-screen layout (home, search, place card, arrival): no current source found; only feature news.
- Google's original blog post for the March 2026 Immersive Navigation launch was not located; details are from press snippets.
- Exact numeric specs (banner heights, type sizes, corner radii, sheet detent fractions) are not published by Apple or Google for their Maps apps; none found. They would have to be measured from screenshots.
- Apple WWDC 2025/2026 session content specific to Maps UI was not found.
- Apple's and Google's arrival screens (copy, layout, post-arrival actions) were not described in any source retrieved.

## 2. Indoor-specific leaders: floor switcher, multi-floor routes, "you are here" uncertainty, directory, accessibility toggle

### Takeaway
The best-documented indoor patterns come from Mappedin: a blue dot with an explicit accuracy ring, heading indicator, a grey "stale" state after 30 s, and hiding the dot entirely above 50 m error; three camera follow modes; a multi-floor route preview that shows all floors at once; and (March 2026) an accessibility switch promoted into the route-options header. Evidence for airport/mall/museum apps' actual UI is thin and mostly vendor marketing.

### Cited Findings

**Mappedin Blue Dot - primary developer docs**
- Accuracy ring: a semi-transparent blue shadow around the dot shows the accuracy range in metres; the dot is bright blue with no ring at accuracy 0. — [Mappedin Blue Dot docs](https://developer.mappedin.com/web-sdk/blue-dot)
- Hide rule: "The Blue Dot will be hidden when the accuracy is greater than 50 meters." — [Mappedin Blue Dot docs](https://developer.mappedin.com/web-sdk/blue-dot)
- Stale state: after a timeout with no position updates (default 30 000 ms) the dot turns grey to signal the user may have moved. Configurable: dot colour, accuracy-ring colour/opacity, heading colour/opacity, inactive colour, timeout. — [Mappedin Blue Dot docs](https://developer.mappedin.com/web-sdk/blue-dot)
- Heading indicator shows facing direction. Camera follow modes: `position-only`; `position-and-heading` (map rotates with the device heading); `position-and-path-direction` (map bearing taken from the route path, not the compass); or off. — [Mappedin Blue Dot docs](https://developer.mappedin.com/web-sdk/blue-dot)
- External fixes can be blended with sensors via `reportPosition` with a confidence value (default 0.5), or forced for a duration via `forcePosition(position, durationMs)` after which normal fusion resumes. Position updates carry coordinate, floor, accuracy, heading. — [Mappedin Blue Dot docs](https://developer.mappedin.com/web-sdk/blue-dot)

**Mappedin floors and routes - primary**
- Multi-floor route preview: shows every floor along the route at once, with a button (top-left) to toggle Side View vs Top View. — [Mappedin gallery: multi-floor navigation](https://developer.mappedin.com/gallery/multi-floor-navigation/) (snippet)
- SDK exposes a level selector, a `floor-change` event and an `initialFloor` option; multi-building maps use level selectors per building. — [Mappedin level selection guide](https://developer.mappedin.com/web/v6/guides/level-selection/) (snippet; guide flagged v6 as alpha at the time)
- March 2026: "The Accessibility Toggle has been redesigned as a clear on/off switch in the route options header"; a new Route Options Panel; a "Unified Blue Dot: one positioning experience, everywhere". — [Mappedin March 2026 product updates](https://www.mappedin.com/resources/blog/march-2026-product-updates/) (snippet only; page fetch failed, so surrounding detail is unverified)
- Accessible routes prioritise elevators and ramps. — [Mappedin vs Pointr comparison](https://www.mappedin.com/resources/blog/mappedin-vs-pointr-indoor-mapping-comparison/) (vendor marketing, snippet)

**Other vendors - snippets**
- Visioglobe: a multi-floor route view needs a larger vertical gap between stacked floors so the route is legible. — [Visioglobe](https://visioglobe.com/post/visioweb-multi-floor-routes) (snippet, undated)
- Pointr claims 1-3 m positioning accuracy and says Wi-Fi alone is almost never enough for a solid blue dot. — [Pointr](https://www.pointr.tech/blog/indoor-positioning-everything-you-need-to-know) (vendor claim, snippet). Mappedin's comparison page characterises Pointr as "sub-meter accuracy through hardware infrastructure", which conflicts with Pointr's own 1-3 m figure. — [Mappedin comparison](https://www.mappedin.com/resources/blog/mappedin-vs-pointr-indoor-mapping-comparison/)
- Pointr + Okeenea: the blue dot position is used to decide when and where to trigger accessibility prompts. — [Pointr](https://www.pointr.tech/blog/pointr-okeenea-making-venues-accessible) (snippet)

**Apple Maps indoor - (older, 2017-2018) plus current support page**
- Zooming far enough into a supported venue switches the map to the indoor layout and adds a floor-level selector at the top right on iPhone (bottom of the window on Mac). A "Browse" section lets users find stores by category. — [MacRumors, June 2017](https://www.macrumors.com/2017/06/22/apple-maps-indoor-maps-ios-11/); [Search Engine Land, 2017](https://searchengineland.com/apple-maps-adds-indoor-mapping-malls-airports-not-disturb-mode-276399) (older; snippets)
- Apple's current Mac guide still documents interior maps for large spaces such as airports and malls. — [Apple Support](https://support.apple.com/en-kz/guide/maps/mpsad299abef/3.0/mac/15.0) (snippet)

**Google Maps indoor and heading uncertainty**
- Indoor Live View (older, launched March 2021): AR arrows guide to gates, platforms, stores and indicate which floor the destination is on; launched in a handful of US malls, then Tokyo/Zurich airports and stations. — [CNBC, 30 Mar 2021](https://www.cnbc.com/amp/2021/03/30/google-maps-launches-augmented-reality-directions-for-indoor-spaces.html) (snippet)
- Google's indoor help page describes the indoor blue dot as accurate to within several metres. — [Google indoor maps FAQ](https://maps.google.es/help/maps/indoormaps/faqs.html) (snippet)
- Heading uncertainty (older, 2016, still the convention): the blue dot's beam encodes heading confidence - "the narrower the beam, the more accurate the direction"; a wide beam means the compass is uncalibrated; tapping the dot offers calibration (figure-8, or Live View calibration on newer Android). — [Google Maps blog, Sept 2016](https://maps.googleblog.com/2016/09/always-know-which-way-youre-headed-with.html); [9to5Google, 2016](https://9to5google.com/2016/09/20/google-maps-direction-beam-calibrate/) (snippets)

**Airports**
- Heathrow: Atrius layered blue-dot wayfinding onto Heathrow's existing digital map platform, feeding real-time location into the Heathrow app and partner airline apps. Undated. — [Atrius case study](https://www.casestudies.com/company/atrius/case-study/heathrow-airport-creates-a-seamless-door-to-gate-journey-with-atrius-blue-dot-wayfinding-technology) (snippet)
- Schiphol (older, 2015-2016): app update with new map, location detection and indoor navigation, on roughly 2,000 Bluetooth beacons. — [Passenger Terminal Today](https://www.passengerterminaltoday.com/news/it-software/m2mobi-launches-updated-app-for-schiphol-airport.html); [GIM International](https://www.gim-international.com/content/article/indoor-wayfinding-at-amsterdam-airport) (snippets)

### Inferences
- A defensible uncertainty ladder for Atlas, assembled from Mappedin (position) and Google (heading): (1) confident: solid dot, no/small ring, narrow heading cone; (2) degraded: ring grows to true error radius, cone widens; (3) stale (no fix for ~30 s): dot goes grey, guidance copy softens; (4) unusable (error above a threshold; Mappedin uses 50 m, a mall app would want far lower, e.g. a corridor width or two): hide the dot and prompt a QR checkpoint scan. Atlas's QR checkpoint is functionally Mappedin's `forcePosition`/high-confidence `reportPosition`: a scan should snap the dot, collapse the ring, and animate that collapse so the user sees confidence being restored.
- `position-and-path-direction` is the notable mode for a dead-reckoning app: rotate the map to the route direction, not the magnetometer, since indoor compasses are unreliable. This avoids a spinning map when heading is noisy.
- Multi-floor presentation: an all-floors preview (stacked, with exaggerated vertical gap) belongs in route preview; during active guidance show one floor and present the floor change as its own step ("Take the escalator up to Level 2") with the floor switcher auto-following.
- Floor switcher placement: Apple puts it top-right on iPhone. For a bottom-sheet app, a compact vertical pill on the right edge above the sheet keeps it in thumb range and clear of the instruction banner; this is inference, not a sourced convention.
- Step-free routing: Mappedin's move of the accessibility switch into the route-options header (not buried in settings) is the pattern to copy; a single labelled on/off switch on the route preview sheet, state persisted.
- Category browse as the directory entry point (Apple "Browse") fits Atlas's search sheet empty state.

### Gaps
- Pointr's actual app UI (floor switcher, uncertainty display): only marketing found.
- Changi, Dubai Mall, Westfield, museum apps: no reliable primary description of their current UI found. One secondary guide claims Changi offers AR turn-by-turn tied to gate assignments; unverified, not included above.
- No source found describing how any vendor visually communicates *floor* uncertainty (wrong-floor detection) - a real issue for Atlas.
- No 2025-26 source on Apple Maps indoor UI; the floor-picker/Browse description is from 2017 and may have changed with Liquid Glass.
- Mappedin March 2026 update page could not be fetched; only the quoted sentence is confirmed.
- Whether Google's indoor Live View is still actively expanded in 2026 was not established.

## 3. Bottom sheet conventions: detents, grabber, map padding, tab bars, reach zones

### Takeaway
Apple's HIG gives the canonical rules (nonmodal sheet over a parent view, medium ~half and large detents plus custom ones, always show a grabber on resizable sheets, one sheet at a time). NN/g adds tested cautions: grabbers are often overlooked, always add a visible close button, support Back, never stack sheets, and the "bottom = reachable" claim is largely a myth.

### Cited Findings
- iOS sheets can be nonmodal: "people use its functionality to affect the parent view without dismissing the sheet". — [Apple HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- Detents are "particular heights at which a sheet naturally rests". System detents: large = fully expanded; medium = "about half of the fully expanded height"; sheets can have one or more custom detents. Specifying only medium prevents full expansion. — [Apple HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- "Consider supporting the medium detent to allow progressive disclosure": show the most relevant items at medium, more on scroll/expand. — [Apple HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- "Include a grabber in a resizable sheet": it signals draggability, tapping it cycles detents, and it gives VoiceOver users a way to resize. A resizable sheet also expands when its content is scrolled. — [Apple HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- "Display only one sheet at a time from the main interface"; if an action in a sheet leads to another sheet, close the first before showing the second. — [Apple HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- Support swipe-to-dismiss; Back is for stepping within a flow and "isn't intended to dismiss a sheet"; never show Cancel, Done and Back together. HIG button-placement guidance was updated 24 March 2026. — [Apple HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)
- NN/g: a bottom sheet is progressive disclosure and should not hold things users always need; its advantage over a page is keeping background context visible; map destination details are the cited example of a correct nonmodal use. — [NN/g: Bottom Sheets](https://www.nngroup.com/articles/bottom-sheet/)
- NN/g: sheets typically start nonmodal when minimised and become modal (with scrim) when expanded to near-full screen. — [NN/g](https://www.nngroup.com/articles/bottom-sheet/)
- NN/g: users often overlook the grabber, and downward swipes can collide with system gestures; do not make it the only dismissal - include a visible Close (X) at the top, which also helps screen-reader users. — [NN/g](https://www.nngroup.com/articles/bottom-sheet/)
- NN/g: support the Back button/gesture for dismissal; do not stack sheets (users cannot tell "close this" from "close all"); keep sheet interactions short, because accidental swipes dismiss long content. — [NN/g](https://www.nngroup.com/articles/bottom-sheet/)
- NN/g on reach: the claim that bottom sheets improve reachability is largely incorrect; the middle of the screen is the most easily tapped area across grips. — [NN/g](https://www.nngroup.com/articles/bottom-sheet/)
- In practice, Google's 2025 redesign: top-right "x" on the sheet, rounded corners, a map sliver left visible at full height, mode switcher moved to the bottom. — [9to5Google](https://9to5google.com/2025/03/07/google-maps-iphone-sheet-redesign/)

### Inferences
- Atlas sheet model: a single persistent sheet whose *content* swaps by state (search -> destination -> route preview -> guidance -> steps), not separate stacked sheets. This satisfies both HIG ("one sheet at a time") and NN/g ("do not stack").
- Suggested detents per state (inference; no source gives fractions for Maps apps): collapsed/peek (search field or guidance summary only), medium ~50% (results list, destination details), large stopping short of the status bar so a map sliver remains (Google's context-preserving detail). Route steps is the one place a near-full detent is justified.
- Every sheet state needs an explicit X or back affordance top-right in addition to the grabber; Android hardware/gesture Back must step sheet states backwards (steps -> guidance, destination -> search) before exiting.
- Given NN/g's reach finding, place the primary CTA (Start / End) in the upper-middle of the medium-detent sheet rather than pinned to the extreme bottom edge, and keep map controls (recenter, floor switcher) on the right edge mid-screen.
- Map padding: the camera's visible-area inset should track the sheet's current height so the blue dot and next manoeuvre stay centred in the uncovered map. This is standard practice but no retrieved source states it.

### Gaps
- No source retrieved on map padding/camera inset behaviour relative to sheet height.
- No source retrieved on when map apps hide tab bars (e.g. during guidance). Mapbox's state model shows no tab bar in any state, but that SDK has none to begin with.
- Material 3 bottom-sheet numeric specs (drag handle size, corner radius, max width) could not be extracted; the spec page returned no content.
- Apple has not, in the HIG sheet page, documented iOS 26 Liquid Glass sheet metrics (inset margins, corner radius).
- Thumb-zone data: only NN/g's qualitative statement; no quantitative reach study retrieved.

## 4. Guidance UI: instruction banner, distance/ETA formatting, landmark instructions, progress, off-route / low-confidence, haptics/audio

### Takeaway
The established banner grammar is: manoeuvre icon + one primary line + optional secondary + a "then..." line when the next turn follows closely, with trip summary (arrival time, time left, distance left) in a separate bottom panel; tap/swipe the banner for the full step list. The 2025 shift is toward landmark phrasing with the landmark highlighted on the map, and toward fewer, more deliberate audio prompts.

### Cited Findings
- Banner hierarchy (Mapbox iOS): primary text; optional secondary; tertiary = following manoeuvre if soon, or lane guidance; optional junction graphic; expand on tap or swipe-down to the full manoeuvre list. — [Mapbox iOS UI guide](https://docs.mapbox.com/ios/navigation/guides/turn-by-turn-navigation/user-interface/)
- Trip progress panel: ETA, distance remaining, time remaining - kept separate from the instruction banner, with End Navigation in the same panel on Android. — [Mapbox iOS](https://docs.mapbox.com/ios/navigation/guides/turn-by-turn-navigation/user-interface/); [Mapbox Android states](https://docs.mapbox.com/android/navigation/v2/guides/drop-in-ui/navigation-states/)
- On-map guidance elements: route line plus a distinct route arrow at the manoeuvre; a Resume/recenter control appears after overview or manual panning. — [Mapbox Android states](https://docs.mapbox.com/android/navigation/v2/guides/drop-in-ui/navigation-states/); [Mapbox iOS](https://docs.mapbox.com/ios/navigation/guides/turn-by-turn-navigation/user-interface/)
- Apple iOS 26: instruction shown in a smaller floating bar instead of a full-width top banner; ETA/time/distance made more prominent. — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/)
- Google Nov 2025: "turn right after the Thai Siam Restaurant" with the landmark highlighted on the map on approach; rationale is that distance-only cues are hard to judge. — [Google blog](https://blog.google/products/maps/gemini-navigation-features-landmark-lens/)
- Google route card formatting: large duration, then "Arrive hh:mm AM/PM", then distance. — [9to5Google](https://9to5google.com/2025/03/31/google-maps-directions-redesign/)
- Audio verbosity is tiered: Apple - Muted / Alerts Only / Unmuted, with labels; Waze - a "less chatty" mode that keeps hazard, turn and lane prompts but fewer of them. — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/); [9to5Mac](https://9to5mac.com/2026/07/14/waze-now-learns-your-preferences-and-gets-more-conversational-but-less-chatty/) (snippet)
- Progress as counts, not just distance: Citymapper tracks stops remaining on the lock screen and escalates to a "Get off now" prompt. — [Citymapper](https://content.citymapper.com/i/2553/citymapper-introduces-ios-lock-screen-navigation); [Pratt IXD](https://ixd.prattsi.org/2026/02/design-critique-citymapper-ios-app/) (snippets)
- Low-confidence position: grey dot after 30 s without updates; dot hidden above 50 m error. — [Mappedin Blue Dot docs](https://developer.mappedin.com/web-sdk/blue-dot)
- Arrival: Mapbox switches to a dedicated Arrival state on approach, with arrival text, side-of-street indication, and End Navigation. — [Mapbox Android states](https://docs.mapbox.com/android/navigation/v2/guides/drop-in-ui/navigation-states/)

### Inferences
- Atlas banner template: [turn glyph] "Turn left at Woolworths" (primary, large) / "12 m" or "about 15 steps" (secondary) / "Then escalator up to Level 2" (tertiary, only when the next step is within a few metres). Highlight the named store polygon on the map in lime while it is the active landmark, mirroring Google's on-map landmark highlight.
- Indoors, distances are short and position error is a large fraction of them, so precise metres can overpromise. Prefer rounded distances (5 m steps) and landmark/sequence cues when the blue dot is in a degraded state; this follows from Google's stated rationale but is not directly sourced for indoor use.
- Progress indication suited to malls: "Step 3 of 7" and "2 turns left" (Citymapper's count-based model) alongside time remaining.
- Low-confidence copy ladder: confident -> normal instruction; degraded -> keep the instruction, add "Scan a checkpoint to sharpen your position"; stale/lost -> replace the banner with a recovery card (scan QR / "I'm at..." picker) rather than continuing to issue turns.
- Off-route: reroute silently for small deviations and announce only when the instruction changes; reserve a distinct haptic for "off route" vs "turn now" vs "arrived". No retrieved source specifies haptic patterns, so this is design judgement.
- Arrival should be a state with its own copy ("You've arrived - Woolworths is on your left") and follow-on actions, not a silent end of steps.

### Gaps
- No retrieved source documents haptic patterns in Apple/Google Maps walking guidance (e.g. Apple Watch tap patterns for left/right) or audio cue design. Unsourced; needs dedicated research.
- No source on off-route/rerouting UI specifics (thresholds, copy, animation) for any app; Mapbox's iOS UI page does not cover rerouting.
- No source on distance-unit formatting rules (when metres round, switch to "now", etc.).
- No source on step-count or time-based distance phrasing for pedestrians.

## 5. Search UX: empty state, recents, categories, typo tolerance, result rows, voice

### Takeaway
Retrieved evidence is limited to what the search surface contains in 2025-26: Apple fills the empty search screen with suggested/trending content, Google adds a conversational "Ask Maps" entry and a camera (Lens) entry next to the search bar, and voice is shifting from dictation to natural-language requests. Detailed row design and typo-tolerance practices were not found.

### Cited Findings
- Apple iOS 27 search screen adds a "Trending Restaurants" section; Suggested Places is a horizontally swipeable row (expanded from two suggestions in iOS 26.5); natural-language search covers routing details. — [9to5Mac, Sept 2026](https://9to5mac.com/2026/09/24/heres-everything-new-for-apple-maps-in-ios-27/)
- Apple iOS 26 "Places" (formerly Library) with Visited Places grouped by month and searchable - history as a browsable, privacy-framed surface. — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/)
- Apple indoor (older, 2017): category "Browse" for stores inside a venue. — [MacRumors 2017](https://www.macrumors.com/2017/06/22/apple-maps-indoor-maps-ios-11/) (snippet)
- Google: Ask Maps button near the search bar with follow-up refinement (March 2026); Lens camera icon inside the search bar (Nov 2025). — [TechCrunch](https://www.techcrunch.com/2026/03/12/google-maps-is-getting-an-ai-ask-maps-feature-and-upgraded-immersive-navigation/) (snippet); [Google blog](https://blog.google/products/maps/gemini-navigation-features-landmark-lens/)
- Google: destination entry remains a fullscreen page even after the sheet redesign; only once a destination is chosen does the UI return to map + floating start/end card. — [9to5Google](https://9to5google.com/2025/03/07/google-maps-iphone-sheet-redesign/)
- Waze (July 2026): Gemini destination search by spoken conditions. — [9to5Mac](https://9to5mac.com/2026/07/14/waze-now-learns-your-preferences-and-gets-more-conversational-but-less-chatty/) (snippet)
- Transit 6.0 redesigned search with larger type and more white space. — [AlternativeTo](https://alternativeto.net/news/2025/8/transit-6-0-launches-with-new-typeface-refreshed-design-neon-dark-mode-and-new-eta-cards)

### Inferences
- Atlas search-sheet empty state, by analogy: (1) horizontally scrolling category chips (Food, Fashion, Toilets, ATMs, Parking pay stations, Exits); (2) Recents; (3) a "Popular in this mall" list. A QR-scan icon inside the search field parallels Google's in-bar Lens icon and gives the checkpoint feature a permanent, discoverable home.
- Google keeping text entry fullscreen suggests the search sheet should jump to the large detent on focus (keyboard up), then drop to medium/peek once a destination is selected.
- For a mall directory (hundreds of stores, not millions of places), client-side fuzzy matching plus aliases (brand nicknames, categories, "toilet/restroom/bathroom") is feasible; this is engineering judgement, not sourced.

### Gaps
- No source retrieved on result-row anatomy (icon, title, secondary line, distance/floor, open status) for any app.
- No source on typo tolerance, synonyms or zero-result handling. Baymard/NN/g search guidance was not retrieved in this pass.
- No source on Google Maps' category chips/recents layout in 2025-26.
- No source on indoor-directory search specifically (floor badges in rows, "nearest toilet" shortcuts).

## 6. Evidence: research on pedestrian/indoor wayfinding (landmarks, cognitive load, map orientation)

### Takeaway
The literature supports landmark-based instructions but with a clear constraint: use one highly salient landmark per instruction and show only key landmarks on the map, because landmark-hunting itself consumes attention. Heading-up maps help moment-to-moment self-localisation, especially for lower-spatial-ability users, but the overall north-up vs track-up evidence is mixed. Most studies are small.

### Cited Findings
- Landmark instructions can reduce cognitive load, raise confidence and cut errors, but "the user typically focuses considerable amount of attention on searching for landmark points"; in a supermarket study (n=20) the more visually demanding landmark-instruction style did not improve recall of surroundings and could reduce navigation performance. — [DFKI publication record: Influence of Landmark-based Navigation Instructions on User Attention in Indoor Smart Spaces](https://www.dfki.de/web/forschung/projekte-publikationen/publikation/5739) (older; snippet)
- An indoor study comparing instructions depicting one landmark vs four (63 and 60 participants) concludes a system should primarily show one highly salient landmark for efficient navigation. — [TU Darmstadt repository record](https://tustorage.ulb.tu-darmstadt.de/signposting/describedby/7e461d92-b411-462a-b1dd-1b866d654283) (snippet from a catalogue listing; the URL-to-claim mapping is inferred from the search result set and should be verified)
- Indoor map design (n=80, Cooper-Harper workload scale): maps with only key landmarks produced significantly lower cognitive load than maps with full landmarks; the effect was larger for women. — [ISPRS IJGI 9(2):82, mirror](https://p.gyb.elementfx.com/2220-9964/9/2/82) (2020; snippet; mirror URL, verify against mdpi.com)
- Older adults with mild cognitive impairment hesitated 66.6% less often with a landmark-based prototype than with turn-by-turn. — [University of Porto thesis, 2013](https://repositorio-aberto.up.pt/bitstream/10216/66915/2/26242.pdf) (older; master's thesis; snippet)
- NavMarkAR (AR, older adults; NASA-TLX and STAI measures): landmark cues helped participants build cognitive maps, notably for distinguishing floor levels. — [arXiv 2311.12220](https://arxiv.org/pdf/2311.12220) (2023; snippet)
- Map orientation: a 2016 review found prior empirical studies "failed to find clear evidence to support either North-up or Track-up designs"; field-dependent users were more accurate with track-up while field-independent users showed no difference, yet track-up users rated their maps lower. — [Li et al., Individual Differences in Orienting and Navigating Tasks when Using North-Up and Track-Up Electronic Maps](https://bohrium.dp.tech/paper/arxiv/62184ce55aee126c0f61789d) (2016; snippet)
- A recent VR study (n=22) found heading-up maps gave shorter self-localisation times than north-up, with the largest gap at skewed (non-orthogonal) intersections. — [AHFE open access](https://openaccess.cms-conferences.org/publications/book/979-8-950676-05-5/article/979-8-950676-05-5_8) (c. 2025; snippet)
- CHI 2007 field experiment (Seager and Stanton-Fraser) comparing physical, manual and automatic (compass) rotation with north-up: physical rotation of the device was most effective for wider-area maps. — [University of Bath research portal](https://researchportal.bath.ac.uk/en/publications/comparing-physical-automatic-and-manual-map-rotation-for-pedestri/) (older; snippet)
- A Transit-app redesign project (Oct 2024) identified walking navigation as the part users found very difficult and benchmarked Google Maps, Apple Maps, Citymapper and Moovit. — [Transit redesign competitive analysis](https://transit-redesign.notion.site/Pedestrian-Navigation-12d08bdcb87680ae9cc2c59f09a21dd7) (independent/student project, not Transit's own research; snippet)
- NN/g's bottom-sheet guidance is based on observed usability problems (undismissable sheets, stacking, obscured background). — [NN/g](https://www.nngroup.com/articles/bottom-sheet/)

### Inferences
- Instruction rule for Atlas: exactly one landmark per instruction, chosen for salience from the user's approach direction (anchor tenant, escalator, atrium, food court). On the map during guidance, de-emphasise all store labels except the active landmark and destination - consistent with the key-landmarks-only finding.
- The skewed-intersection result matters for malls with curved or angled concourses: default to heading-up (or path-direction-up) during active guidance; offer north-up for browse mode with a compass control to toggle. Because of the mixed evidence and individual differences, make it a remembered preference, not a forced mode.
- Landmark cues aiding floor discrimination (NavMarkAR) supports naming a landmark at the top of each floor transition ("At the top of the escalator you'll see the food court").
- Evidence does not support heavy AR/3D as a default: more visually demanding guidance reduced performance in the supermarket study, and Google's 3D redesign drew "distracting" comments.

### Gaps
- All academic findings above come from search-result snippets; papers were not read in full, sample sizes are small, and several URL-to-claim mappings need verification before being quoted in a final report.
- No published usability study found specifically on indoor mall navigation apps, QR-checkpoint relocalisation, or uncertainty visualisation comprehension (do users understand accuracy rings?).
- No Baymard or Smashing Magazine material retrieved.
- No vendor-published research (Google, Apple, Citymapper, Transit) with quantitative results was found.

## 7. What designers and reviewers repeatedly call "premium" or "polished"

### Takeaway
Reviewer praise in 2025-26 clusters around a handful of concrete details rather than visual richness: continuous map context, generous rounding, one dominant number, less density, controls where the thumb is, deliberate quiet, legible dark mode, and continuity onto the lock screen. Overdone effects (early Liquid Glass translucency, 3D immersive view, nagging pop-ups) drew the criticism.

### Cited Findings
- Context continuity: translucent search bar and menus that let the map show through (Apple); a map sliver kept visible above a fully raised sheet (Google). — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/); [9to5Google](https://9to5google.com/2025/03/07/google-maps-iphone-sheet-redesign/)
- More rounded corners on sheets, cards, menus and buttons in both Apple's and Google's redesigns. — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/); [9to5Google](https://9to5google.com/2025/03/07/google-maps-iphone-sheet-redesign/)
- Reduced density with one emphasised figure: reviewer calls Google's trip card "less dense", with a much larger duration; Transit 6.0 is described in terms of larger fonts and more white space. — [9to5Google](https://9to5google.com/2025/03/31/google-maps-directions-redesign/); [AlternativeTo](https://alternativeto.net/news/2025/8/transit-6-0-launches-with-new-typeface-refreshed-design-neon-dark-mode-and-new-eta-cards)
- Smaller guidance chrome, more prominent ETA/time/distance. — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/)
- One-handed reach framed as the reason for moving close, mode switching and in-navigation controls. — [9to5Google](https://9to5google.com/2025/03/07/google-maps-iphone-sheet-redesign/); [Android Authority](https://www.androidauthority.com/google-maps-ui-gemini-ask-maps-apk-teardown-3689527/) (snippet). Note NN/g disputes the general reachability premise for bottom placement. — [NN/g](https://www.nngroup.com/articles/bottom-sheet/)
- A persistent primary action: always-available floating Directions button on Apple place cards. — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/)
- Labelled, tiered controls replacing ambiguous toggles (Apple Voice Controls). — [MacRumors](https://www.macrumors.com/guide/ios-26-maps/)
- Custom typography and a deliberately designed dark mode as brand signals: Transit's custom Puffin typeface and high-contrast "Neon" dark mode, plus an algorithm to keep colours legible on dark. — [AlternativeTo](https://alternativeto.net/news/2025/8/transit-6-0-launches-with-new-typeface-refreshed-design-neon-dark-mode-and-new-eta-cards); [METRO Magazine](https://www.metro-magazine.com/10249917/how-the-transit-app-is-redefining-what-it-means-to-move-without-a-car) (snippet)
- Restraint in interruptions and continuity beyond the app: Citymapper's single get-off alert and lock-screen/Dynamic Island trip view; Waze's "less chatty" option. — [Citymapper](https://citymapper.com/i/517/go-your-personal-trip-assistant); [Pratt IXD](https://ixd.prattsi.org/2026/09/design-critique-citymapper/); [9to5Mac](https://9to5mac.com/2026/07/14/waze-now-learns-your-preferences-and-gets-more-conversational-but-less-chatty/) (snippets)
- Honest state display: grey stale dot, accuracy ring, hidden dot when unreliable (Mappedin); beam width as heading confidence (Google). — [Mappedin](https://developer.mappedin.com/web-sdk/blue-dot); [Google Maps blog 2016](https://maps.googleblog.com/2016/09/always-know-which-way-youre-headed-with.html) (older, snippet)
- What drew criticism: Liquid Glass had to be made subtler after first-beta complaints; Immersive Navigation called distracting by some users; Waze's undismissable feature pop-up. — [9to5Mac](https://9to5mac.com/2025/09/18/heres-everything-new-for-apple-maps-in-ios-26/) (snippet, see attribution caveat in section 1); [Droid Life](https://www.droid-life.com/2026/03/12/google-maps-navigation-gets-biggest-update-in-a-decade/) (snippet); [Stuff](https://stuff.co.za/2025/10/08/waze-adds-conversational-reporting-to-cease) (snippet)

### Inferences
- Polish checklist for Atlas, each traceable to a cited pattern above:
  1. Map never fully disappears: large detent stops short of the top; sheet and floating controls may use slight translucency over navy, but keep text contrast high (the Liquid Glass walk-back is the warning).
  2. One dominant number per sheet state (walk time in preview; distance-to-turn in guidance), set large; everything else secondary.
  3. Generous, consistent corner radii across sheet, cards, chips, buttons and floor switcher.
  4. A persistent primary CTA per state in a consistent position (Directions / Start / End).
  5. Use lime as a scarce signal: active route, primary CTA, active landmark highlight. Transit's dark-mode work implies checking every category/brand colour for contrast on navy.
  6. Explicit, labelled voice/haptic levels (Muted / Alerts only / Full) rather than one mute icon.
  7. Truthful positioning visuals (ring, stale grey, hidden) with a clear recovery action (QR scan) - honesty reads as quality.
  8. Quiet guidance: alert only at decision points; no nagging promos.
  9. Continuity outside the app (Live Activity / lock-screen step and "turns left" count) as a later-stage premium feature for React Native/Expo.
- Motion quality (spring physics on sheets, camera easing between states, route-line draw-on) is widely assumed to drive "premium" perception, but no retrieved source documents it for these apps; treat as untested assumption.

### Gaps
- No designer teardown (Mobbin-style) or formal design review with screen-level measurements was retrieved; "premium" attributions here come from tech-press reviewers and student critiques, not professional design criticism or user research.
- No source on motion/animation specifics (durations, easing, haptic pairing) in Apple or Google Maps.
- No evidence linking any of these details to measured outcomes (task success, retention, satisfaction).
