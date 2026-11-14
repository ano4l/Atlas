# Platform design languages and visual-design fundamentals for a "premium" mobile app (2025-2026)

Researcher notes for Atlas (React Native/Expo indoor navigation; navy + cobalt + lime; light/dark; SVG icons; solid surfaces + optional expo-glass-effect search bar; system fonts). Research date: 2026-11-14.

Source-quality legend used below: **[P]** primary (Apple, Google, W3C, the vendor's own page); **[S]** secondary (session notes, press, reviews); **[W]** weak (third-party ports, blogs, search-result summaries I could not open). Where a value came only from a search-result summary rather than a page I read, it is marked "(search summary, not opened)".

---

## 1. Liquid Glass: what Apple prescribes, what changed in 26.x/27, mistakes, good third-party adoption

### Takeaway
Apple's rule is unambiguous: Liquid Glass is a *functional layer for controls and navigation that floats above content*; do not use it in the content layer, use it sparingly on custom controls, never stack glass on glass, and tint only the one primary action. Apple has since moved steadily toward more opaque glass (26.1 Tinted option, iOS 27 slider with a more tinted default), so Atlas's "solid surfaces + one glass floating search bar" is already aligned with both the guidance and the direction of travel.

### Cited Findings

**Where glass belongs (HIG Materials) [P]**
- "Liquid Glass forms a distinct functional layer for controls and navigation elements — like tab bars and sidebars — that floats above the content layer." — [Apple HIG, Materials](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json)
- "Don't use Liquid Glass in the content layer... use standard materials for elements in the content layer, such as app backgrounds." Exception: transient interactive elements in controls such as sliders and toggles take a glass appearance while activated. — [Apple HIG, Materials](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json)
- Custom controls: "If you apply Liquid Glass effects to a custom control, do so sparingly... Limit these effects to the most important functional elements in your app." — [Apple HIG, Materials](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json)
- Two variants. **Regular** blurs and adjusts luminosity of the background for legibility; use it "when background content might create legibility issues, or when components have a significant amount of text, such as alerts, sidebars, or popovers." **Clear** is highly translucent and is for components floating over media (photos/video). — [Apple HIG, Materials](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json)
- Clear variant dimming: "If the underlying content is bright, consider adding a dark dimming layer of 35% opacity"; not needed if content is already dark. — [Apple HIG, Materials](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json)
- Session notes add: do not mix Regular and Clear; use Clear only when all three hold: element is over media-rich content, content is not harmed by a dimming layer, and content on the glass is bold and bright. "Avoid stacking glass on glass"; for elements on top of glass use fills and transparency instead. Larger elements simulate thicker material (more shadow/scatter); components can flip light/dark independently based on what is behind them. — [WWDC25 219 "Meet Liquid Glass" notes](https://wwdcnotes.com/documentation/wwdc25-219-meet-liquid-glass/) [S]
- "Choose materials and effects based on semantic meaning and recommended usage," not on the colour they appear to impart, because system settings change their appearance. — [Apple HIG, Materials](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json)
- Content-layer standard materials on iOS: ultra-thin, thin, regular (default), thick. Vibrancy labels: `label`, `secondaryLabel`, `tertiaryLabel`, `quaternaryLabel`; avoid quaternary on thin/ultraThin (contrast too low). — [Apple HIG, Materials](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json)
- Apple's developer guidance (per search summary, not opened) says the content layer, not the glass, is the place to express brand identity. — [Apple "Meet with Apple" session 208](https://developer.apple.com/videos/play/meet-with-apple/208) [P, search summary]

**Tinting and colour on glass (HIG Color, updated 2025-12-16) [P]**
- Glass has no inherent colour; it takes colour from content behind it. Colour can be applied "sparingly" for emphasis (status indicators, primary actions). — [Apple HIG, Color](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json)
- To emphasise a primary action, colour the **background** of the control, not its symbol/text (system Done button uses the app accent as its background). "Don't add color to the backgrounds of multiple controls." — [Apple HIG, Color](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json)
- Toolbar/tab bar symbols and text are monochrome by default, darkening over light content and lightening over dark content. If the app has colourful/rich content, prefer monochrome bars or an accent with clear differentiation; brand colour as accent works well in apps with mostly monochrome content. — [Apple HIG, Color](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json)
- Colourful content may scroll under controls, but its *resting state* (e.g. top of a scroll view) must be clearly legible. — [Apple HIG, Color](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json)
- "Even if your app supports only one appearance, provide both light and dark colors to support Liquid Glass adaptivity"; supply an increased-contrast variant for each custom colour. — [Apple HIG, Color](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json)

**Shapes and concentricity (WWDC25 356 notes) [S]**
- Three shape types: Fixed (constant radius), Capsule (radius = half the container height), Concentric ("Calculated radius by subtracting padding from parent"). — [WWDC25 356 notes](https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/)
- iPhone: capsules for controls near the screen edge; iPad/Mac: concentric shapes near edges. Use a concentric shape with a fallback radius for components that appear both nested and standalone. "Check corner radii that feel off," especially nested containers and near screen edges. — [WWDC25 356 notes](https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/)
- Apple's launch statement: controls, toolbars and navigation are concentric with the rounded corners of hardware and app windows. — [Apple Newsroom, June 2025](https://www.apple.com/uk/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design) [P, search summary]

**Tab bars, toolbars, scroll edges, sheets (WWDC25 356 notes) [S]**
- Remove unnecessary bar actions; move secondary actions into a menu; group bar items by function and frequency. Do not group symbols with text buttons ("Put text-buttons in own container"). Primary action (e.g. Done) stays separate and tinted. — [WWDC25 356 notes](https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/)
- Search moved to the bottom in iOS 26 for reachability. Tab bars can host persistent accessory views; "Avoid screen-specific actions in the tab bar (like checkout button)!" — [WWDC25 356 notes](https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/)
- Scroll edge effects: Soft (default, subtle blur, for interactive elements) vs Hard (more opaque, for interactive text, backgroundless controls, pinned headers). "Scroll edge effects are not decorative!"; "Don't use if there no floating elements"; one edge effect per view; do not mix soft and hard. — [WWDC25 356 notes](https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/)
- Sheets: use a dimming layer when a task interrupts the main flow; skip dimming when the task runs in parallel. Custom controls should visually spring from the element that triggered them; "apply material directly to control, not inner views." — [WWDC25 356 notes](https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/)
- "Generally, a label is always better than an icon"; use only icons users clearly understand. — [WWDC25 356 notes](https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/)

**Accessibility settings and fallbacks**
- HIG confirms glass appearance changes with the user's preferred Liquid Glass look and with Reduce Transparency / Increase Contrast, but gives no detail. — [Apple HIG, Materials](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json) [P]
- Third-party descriptions (search summaries, not opened): Reduce Transparency makes glass "frostier"/more solid; Increase Contrast makes elements predominantly black or white with a contrasting border; Reduce Motion decreases effect intensity and disables elastic behaviour. — [TidBITS](https://tidbits.com/2025/10/09/how-to-turn-liquid-glass-into-a-solid-interface/), [Creativetechs](https://www.creativetechs.com/2025/10/03/whats-liquid-glass-and-what-to-do-if-you-dont-like-it/) [S/W]
- Linear confirms from its own reverse-engineering that Apple's glass "adapts to Increase Contrast by drawing solid outlines around glass elements," and mirrored that. — [Linear, "A Linear spin on Liquid Glass"](https://linear.app/now/linear-liquid-glass) [P for Linear]
- Expo: `GlassView` requires iOS 26+, and "will fallback to regular `View` on unsupported platforms." `isLiquidGlassAvailable()` returns true even when accessibility settings limit the effect; check `AccessibilityInfo.isReduceTransparencyEnabled()` separately. `isGlassEffectAPIAvailable()` guards against iOS 26 betas lacking the API. Props: `glassEffectStyle` ('regular' default | 'clear' | 'none'), `tintColor`, `isInteractive`, `colorScheme`; `GlassContainer` with `spacing` merges nearby glass. Known issue: do not set opacity < 1 on a GlassView or its parents (glass may not render); animate a wrapper or toggle style to 'none'. — [Expo GlassEffect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/) [P]

**What changed after criticism (26.0 -> 26.1 -> 26.2 -> 27)**
- iOS 26.1 (public early November 2025; introduced in 26.1 beta 4) added a system setting choosing **Clear** (default) vs **Tinted**, where Tinted increases glass opacity and contrast. — [MacRumors, iOS 26.1 release](https://www.macrumors.com/2025/11/03/apple-releases-ios-26-1/), [MacRumors how-to](https://www.macrumors.com/how-to/ios-26-1-reduce-liquid-glass-effects/) [S, search summary]
- Reception of 26.1 was mixed: critics said Tinted was not enough/looked poor; fans felt it was dialled back too far. — [SlashGear](https://www.slashgear.com/2019119/ios-26-update-liquid-glass-control-users-say-not-enough/) [S, search summary]
- iOS 26.2 added a transparency slider for the Lock Screen clock. — [mobiFlip](https://www.mobiflip.de/?p=470674) [S, search summary]
- iOS 27: Settings > Appearance > Liquid Glass is a continuous slider between More Clear, Default and More Tinted. "The Default setting is more tinted than iOS 26's Clear." Rendering diffuses content better; darker edges and brighter specular highlights improve layer separation. Search button is back *inside* the tab bar in Apple's apps (reversing the iOS 26 floating placement; the other style still supported). Context menus now glassy with a darker edge. Apps built for iOS 26 get the new material automatically. At the clearest setting the reviewer still reports "severe legibility issues" where content scrolls under tab bars/floating toolbars. — [MacStories iOS 27 review, p.2](https://www.macstories.net/stories/ios-and-ipados-27-review/2/) [S]
- iOS 27 slider corroborated. — [9to5Mac, 2026-06-15](https://9to5mac.com/2026/06/15/ios-27-adds-new-liquid-glass-slider-on-iphone-heres-what-it-lets-you-do/), [BGR](https://bgr.com/2191219/ios-27-liquid-glass-fix-customization/) [S, search summary; some coverage describes beta builds]

**Third-party adoption done well: Linear (Robb Böhnke, 2025-10-21) [P]**
- Linear built its own material rather than using Apple's API: Apple's APIs did not give enough control of navigation; the material was changing during beta; and a custom material also ships to iOS 18. Team: two iOS engineers. — [Linear](https://linear.app/now/linear-liquid-glass)
- Recipe: Gaussian blur base (UIVisualEffectView) + subtle gradient + shader-computed specular highlight (SDF of the continuous rounded rect -> normal map; Plus Lighter blend) + mask + subtle shadow. A virtual light moves so highlights shift on scroll/tap. — [Linear](https://linear.app/now/linear-liquid-glass)
- **Dropped refraction**: third parties cannot access the pixels, and "refraction can make dense professional interfaces harder to read." Depth comes from blur, masking and lighting. Framing: Aqua (consumer, glossy) vs ProKit (flatter, for dense pro tools); goal "purpose-built, disciplined, and designed for sustained focus." — [Linear](https://linear.app/now/linear-liquid-glass)
- Glass is confined to the custom tab bar plus variable blur at top/bottom scroll edges (with a subtle colour mask). Touch lifts an element slightly with haptic pulse. — [Linear](https://linear.app/now/linear-liquid-glass)
- STRV argues a single glass element in an otherwise flat app looks out of place. — [STRV](https://www.strv.com/blog/how-to-apply-liquid-glass-to-your-app) [S, search summary]

### Inferences
- For Atlas, the map is the content layer: keep the map, venue cards, lists, and route sheets on solid/standard-material surfaces; restrict glass to the floating search bar, a floating tab bar/toolbar, and at most map controls. Use Regular (not Clear) for the search bar because it holds text; Clear + 35% dim would only apply over photography.
- Tint exactly one glass control per screen (e.g. "Start route") with the brand accent as background; leave other glass controls monochrome. A lime-tinted glass over a colourful map is the specific case HIG warns about (similar colours in content and controls).
- Because iOS 27's default is more tinted and users can push further, do not design layouts that depend on seeing the map through the bar; design for the most opaque state first.
- Build a three-tier fallback in RN: (1) iOS 26+ with `GlassView`; (2) Reduce Transparency on, or iOS < 26, or Android -> solid surface token with a 1 px hairline + shadow; (3) Increase Contrast -> solid surface with a visible outline (mirrors Apple/Linear).
- If the search bar is placed above the tab bar (two glass layers adjacent), wrap in `GlassContainer` or separate them enough to avoid glass-on-glass.

### Gaps
- I could not open Apple's "Adopting Liquid Glass" article or the WWDC25 219 transcript directly; exact Apple wording on Reduce Transparency/Increase Contrast/Reduce Motion behaviour is from third parties.
- No Apple-published "common mistakes" list was found; the mistakes above are derived from the HIG's do/don'ts.
- Could not confirm Apple's own iOS 26.1/26.2/27 release notes; changes are from press/review coverage. No WWDC 2026 session pages were retrieved, so any iOS 27 developer-facing API changes are unknown.
- No reliable sources found on how Spotify, Uber, Revolut, Monzo or Duolingo specifically adopted Liquid Glass.

---

## 2. Material 3 Expressive (2025)

### Takeaway
M3 Expressive is an evolution of Material 3 (not "Material 4") built on five levers: colour, shape, size, motion and containment; its headline claim is that making the key action bigger, more colourful and contained gets it found up to 4x faster. Google itself warns it is not one-size-fits-all and that clarity and familiar patterns beat flourish.

### Cited Findings

**Research claims [P]**
- 46 research studies, hundreds of designs, 18,000+ participants worldwide. — [Google Design, "Expressive Material Design: Google research"](https://design.google/library/expressive-material-design-google-research)
- Expressive designs preferred across all age groups; up to 87% preference among 18-24s. — [Google Design](https://design.google/library/expressive-material-design-google-research)
- Desirability: +32% "subculture" perception, +34% modernity, +30% rebelliousness. — [Google Design](https://design.google/library/expressive-material-design-google-research)
- Eye-tracking across 10 apps: participants spotted key UI elements up to 4x faster; in the email case the enlarged Send button was spotted 4x faster; tap time fell "by seconds" (no figure). Users 45+ performed on par with younger users. — [Google Design](https://design.google/library/expressive-material-design-google-research)
- Caveats from the same article: not one-size-fits-all (banking cited as needing established patterns); an unstructured playlist design *lowered* usability; removing text labels from email actions decreased usability; a "strong minority" preferred calmer designs; "No amount of emotion can compensate for a lack of clarity." — [Google Design](https://design.google/library/expressive-material-design-google-research)
- Tactics: emphasise the key action with size and a secondary colour; group related items with containment; floating toolbar; exceed accessibility minimums (larger tap targets, high-contrast containment). — [Google Design](https://design.google/library/expressive-material-design-google-research)

**Components and adoption [S]**
- Described as "Material 3.5", still based on 2021's Material 3. Observed components: taller pill search app bar with menu and avatar outside the pill; **shorter** bottom navigation bar (reverting the taller Material You bar); floating toolbars (Google Chat, Photos albums); FAB menu with spring (Docs; Drive's has six items); loading indicators that morph M3E shapes instead of spinners; extra-large buttons (Meet, Clock) the author finds disproportionate; heavy use of containers, which made lists feel dense (Drive reportedly removed containers after rollout). — [9to5Google recap, 2025-12-27](https://9to5google.com/2025/12/27/recap-material-3-expressive/)
- Criticism: Google's own apps are not more cohesive; changes are "straightforward component swaps"; small developers follow the guidelines better than Google. — [9to5Google recap](https://9to5google.com/2025/12/27/recap-material-3-expressive/)
- Rollout followed the Android 16 Pixel release; Google app redesigns through Nov-Dec 2025. — [9to5Google recap](https://9to5google.com/2025/12/27/recap-material-3-expressive/)

**Motion physics spring tokens [W: unofficial ports; values conflict]**
- Scheme structure: two schemes (standard, expressive) x two token families (spatial = position/size/shape, may overshoot; effects = colour/opacity, no bounce) x three speeds (fast, default, slow). Damping ratio 1 = no bounce. — [pub.dev material_expressive](https://pub.dev/documentation/material_expressive/0.8.0/), [pub.dev M3EMotion](https://pub.dev/documentation/m3e_slider/0.0.2/common_m3e_common/M3EMotion-class.html) (search summary)
- Reported values (stiffness / damping ratio): standard default spatial 700 / 0.9; standard fast spatial 1400 / 0.9; expressive default spatial 380 / 0.8 (another port says 0.73); expressive fast spatial 800 / 0.6; expressive default effects 1600 / 1; expressive fast effects 3800 / 1. — [pub.dev material_expressive](https://pub.dev/documentation/material_expressive/0.8.0/), [pub.dev MaterialSpringMotion](https://pub.dev/documentation/flutter_floating_bottom_bar/latest/flutter_floating_bottom_bar/MaterialSpringMotion-class.html), [pub.dev M3EMotion](https://pub.dev/documentation/m3e_slider/0.0.2/common_m3e_common/M3EMotion-class.html) (search summary; **ports disagree on the 0.73 vs 0.8 damping — verify against androidx.compose.material3 `MotionScheme` source before hard-coding**)

**Colour roles and tonal surfaces [P/S]**
- M3 replaced elevation-tint overlays with tone-based surface roles: Surface Container Lowest / Low / (default) / High / Highest; old "surface +1/+2/+3" map to Container Low / Container / Container High. "Surface container" is the default role for a contained area on "surface". Dark-theme surfaces were slightly darkened in that update. — [Material blog, "Tone-based surface color in M3" (2023)](https://material.io/blog/tone-based-surface-color-m3) (search summary)
- Flutter documents the same migration away from elevation-based tinted overlays. — [Flutter breaking change: new ColorScheme roles](https://docs.flutter.dev/release/breaking-changes/new-color-scheme-roles)
- M3E was marketed as allowing vibrant palettes from wallpaper or brand identity so apps "look unique while maintaining coherence". — [Android Central comparison](https://www.androidcentral.com/apps-software/android-os/android-16-material-3-expressive-vs-ios-26-liquid-glass) [S, search summary]

### Inferences
- The M3E research and the HIG agree on the important thing: one emphasised primary action per screen. For Atlas that is "Get directions / Start"; make it the largest, most colourful, contained element on both platforms.
- Borrow M3E's *structure* (spatial vs effects springs; five surface-container tones; a shorter nav bar; floating toolbar over the map) rather than its playful shape library; an indoor-wayfinding utility sits nearer Google's "banking" caveat than a media app.
- A practical RN mapping (Reanimated `withSpring`): spatial moves (sheet snap, FAB, marker pop) use a lightly under-damped spring (damping ratio about 0.8-0.9); colour/opacity changes use a critically damped one (ratio 1). Treat the numeric stiffness values above as starting points only.
- Keep text labels on nav items and actions: both Google's research and Apple's session say labels beat icons.

### Gaps
- m3.material.io pages (motion, shape, typography, components, the "Building with M3 Expressive" blog) returned only a page title to the fetcher (JS-rendered), so **official** values for: the 35-shape library, corner-radius token scale, emphasized type styles, button groups, split buttons, toolbar specs and spring tokens are not verified here. Recommend reading m3.material.io directly or the Compose `material3` source.
- Material 2's dark-theme overlay percentages (#121212 + white overlays) were not retrieved.
- No source found on how specific brands keep identity under Android dynamic colour (e.g. opting out vs. harmonising); this remains unsourced.

---

## 3. One brand identity across iOS and Android without looking generic or non-native

### Takeaway
The best-documented pattern is "brand in the content layer, platform in the chrome": own colour, type, iconography, illustration and motion personality, but follow each platform for navigation structure, system controls and materials. Hard evidence from the named apps' design teams is thin; only Linear (2025) and an older Airbnb case study were retrievable.

### Cited Findings
- Apple's position: glass controls sit above content, and the content layer is where brand identity belongs (search summary). — [Apple "Meet with Apple" 208](https://developer.apple.com/videos/play/meet-with-apple/208) [P, search summary]
- Apple: keep one layout, hierarchy and interaction model across devices; share anatomy and core interactions across platforms even where appearance differs. — [WWDC25 356 notes](https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/) [S]
- Linear shipped one visual language to iOS **and** Android by owning its material (blur + lighting, no refraction) instead of depending on Apple's API; rationale was control over navigation and brand fit ("push the design further so it fit the Linear brand"). — [Linear](https://linear.app/now/linear-liquid-glass) [P]
- Airbnb (**note: this Google Design case study dates from circa 2016, not the 2025 redesign**): app should be "clearly recognizable as Airbnb, no matter the platform" while following platform conventions for navigation, iconography and interactions; replaced Android's left drawer with a bottom bar shared with iOS; "A lot of our app is very typographic" (text over ambiguous icons, 27 languages); Material used as a framework to express the brand, not a template. — [Google Design, "Airbnb invites you in"](https://design.google/library/airbnb-invites-you-in) [P, dated]
- Airbnb's May 2025 redesign: repositioned from booking tool to travel companion with Services/Experiences and a new Explore tab; new dimensional (non-flat) icons were covered as part of a broader move away from flat design alongside Liquid Glass. — [9to5Mac, 2025-05-13](https://9to5mac.com/2025/05/13/airbnb-app-redesign-services-experiences-originals/), [Bloomberg, 2025-06-13](https://www.bloomberg.com/news/articles/2025-06-13/apple-airbnb-ditch-flat-app-icons-for-new-3d-ui-design) [S, search summary]
- Android commentary: Robinhood cited as keeping a uniform identity across platforms via a fully custom design system, which "takes significant resources"; columnists complain developers adopt Liquid Glass styling quickly while treating M3 Expressive as an afterthought, and dislike iOS-style glass ported to Android. — [Android Authority](https://www.androidauthority.com/liquid-glass-proves-android-app-design-afterthought-3612843/), [Android Authority, "I hate iOS copycats"](https://www.androidauthority.com/i-hate-ios-copycats-3635269/) [S opinion, search summary]
- A design-systems essay ("The quiet death of the Brand-Colored Button") reports that darkening a Spotify-style green until it passed contrast created a "Christmas tree" effect, and proposes neutral interactive elements with brand colour reserved for accents and emphasis. — [Design Systems Collective](https://www.designsystemscollective.com/the-quiet-death-of-the-brand-colored-button-1a207dda66d3) [S, search summary]

### Inferences
- Shared across platforms for Atlas: colour tokens, type scale, icon set, map style, route/marker styling, spacing/radius scale, motion durations/spring personality, illustration/empty states. Platform-specific: glass vs tonal solid surfaces for floating chrome, back/navigation gestures, sheet behaviour, haptics, system pickers/alerts, ripple vs highlight press feedback.
- Do not port Liquid Glass to Android; give Android the same *layout* (floating search pill, floating toolbar) on an opaque tonal surface-container with elevation. This avoids the "iOS copycat" criticism and matches M3E's floating toolbar.
- A solo developer should not imitate Linear's custom material (two dedicated iOS engineers); the transferable lesson is its restraint: glass in one or two navigation elements, refraction dropped for legibility.

### Gaps
- No primary design-team writing retrieved for Airbnb's 2025 redesign, Spotify, Uber (Base), Arc Search, Revolut, Monzo or Duolingo; claims about those apps should not be made from these notes.
- No sourced data on whether users perceive cross-platform RN apps as "non-native".

---

## 4. Typography

### Takeaway
System fonts are a legitimate premium choice (SF Pro on iOS; Roboto/Google Sans Flex era on Android) and give Dynamic Type and optical sizing for free; if Atlas wants one cross-platform brand voice, an OFL variable sans (Inter, or Google Sans Flex since Nov 2025) is the low-risk route. SF Pro cannot be shipped to Android. Use tabular figures for anything that ticks (distance, ETA).

### Cited Findings

**Apple type specs [P]**
- iOS default text size 17 pt, minimum 11 pt. Avoid Ultralight/Thin/Light weights; prefer Regular, Medium, Semibold, Bold. Limit the number of typefaces. — [Apple HIG, Typography](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json)
- iOS Dynamic Type at Large (default), size/leading in pt: Large Title 34/41; Title 1 28/34; Title 2 22/28; Title 3 20/25; Headline 17/22 (Semibold); Body 17/22; Callout 16/21; Subhead 15/20; Footnote 13/18; Caption 1 12/16; Caption 2 11/13. Emphasized weights (added to spec 2025-12-16): Bold for Large Title/Title 1/Title 2; Semibold for the rest. — [Apple HIG, Typography](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json)
- Custom fonts must implement the same accessibility behaviours as system fonts: Dynamic Type and Bold Text. Verify layouts at all sizes including Larger Accessibility Sizes; minimise truncation; stack layouts and reduce columns at large sizes; scale meaningful icons with text; do not scale everything equally (prioritise content over tab titles). — [Apple HIG, Typography](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json)
- SF and New York are variable fonts with dynamic optical sizes; the system applies size-specific tracking automatically. "Don't embed system fonts in your app." — [Apple HIG, Typography](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json)

**Licensing**
- SF fonts: licence text reportedly permits use "solely for creating mock-ups of user interfaces to be used in software products running on Apple's" platforms; moving them to another platform would breach the licence. — [ScanCode LicenseDB: San Francisco font licence](https://scancode-licensedb.aboutcode.org/san-francisco-font.html), [Apple Fonts page](https://developer.apple.com/fonts/) [S/P, search summary; read current licence before relying]
- Inter: SIL Open Font License 1.1; variable weight 100-900 plus optical-size axis (text to display); 2,000+ glyphs, 147 languages; features include tabular numbers (`tnum`, same width across all weights), slashed zero (`zero`), case-sensitive forms (`case`); designed as a UI "workhorse" with tall x-height. — [rsms.me/inter](https://rsms.me/inter/) [P]
- Google Sans Flex: released 2025-11-18 under SIL OFL (commercial use and redistribution allowed; cannot sell the font itself); variable font described as having six axes; on Google Fonts. — [9to5Google, 2025-11-18](https://9to5google.com/2025/11/18/google-sans-flex-font-available/), [OMG! Ubuntu](https://www.omgubuntu.co.uk/2025/11/google-sans-flex-font-ubuntu), [Abduzeedo](https://www.abduzeedo.com/google-sans-flex-free-font-six-variable-axes-one-file) [S, search summary]

**Numerals**
- Apply tabular numerals to numbers that change so digits keep equal width and do not jitter; note some fonts (Inter) change numeral styling when tabular is on. — [Jakub Krehel, "Details that make interfaces feel better"](https://jakub.kr/writing/details-that-make-interfaces-feel-better) [S practitioner]

### Inferences
- Lowest-risk premium path for Atlas: keep system fonts for body/UI (free Dynamic Type, optical sizes, native feel) and express brand through weight/size hierarchy and, optionally, one OFL display face for large titles and numerals. A custom face adds bundle size, loading states, and the obligation to wire up font scaling and Bold Text yourself.
- Adopt Apple's scale as the cross-platform token set (11/12/13/15/16/17/20/22/28/34) with ~1.2-1.3 line-height, since it is fully specified; never go below 11 pt.
- In RN, use `fontVariant: ['tabular-nums']` on distance, ETA, floor numbers and step counters; keep `allowFontScaling` on and cap with `maxFontSizeMultiplier` only on chrome that cannot wrap (map chips), not on content. (RN API detail is from my own knowledge, not a retrieved source.)

### Gaps
- Geist licence (believed OFL) was not confirmed from a retrieved source. Licence terms/pricing for commercial premium faces (e.g. Circular, Söhne, GT America, Graphik) were not researched.
- Material 3 type scale and M3E emphasized styles not retrieved (m3.material.io not fetchable). Roboto Flex details not retrieved.
- HIG tracking tables and any Liquid-Glass-era title-alignment guidance sit in the unread portion of the Typography page.

---

## 5. Colour

### Takeaway
Gate on WCAG 2.2 ratios (4.5:1 text, 3:1 large text/UI) because that is the compliance baseline, but check dark mode and mid-tones with APCA because WCAG 2 maths is known to be unreliable for dark colours. Lime cannot carry text or thin icons on light backgrounds; treat it as a fill with dark text on top, and use a separate darker green (or cobalt) for accent-coloured text.

### Cited Findings
- APCA's author states WCAG 2.x contrast "cannot be used for guidance designing 'dark mode'" and fails most with dark colours. — [Myndex, WhyAPCA](https://www.github.com/Myndex/SAPC-APCA/blob/master/documentation/WhyAPCA.md) [P for APCA, search summary]
- WCAG 2.2 remains the legal/compliance baseline; where the two disagree, WCAG must take priority for now; APCA is a WCAG 3 candidate, years away. — [University of Bath digital blog, 2024-11-08](https://blogs.bath.ac.uk/digital-content-and-development/2024/11/08/the-times-they-are-a-changin-for-how-we-measure-colour-contrast/) [S, search summary]
- Test dark-mode pairs independently rather than assuming light-mode results carry over; disagreement is largest on tinted mid-tone surfaces; pin the APCA library version because values are still moving. — [AppCrib, WCAG vs APCA dark mode](https://appcrib.pages.dev/blog/wcag-vs-apca-dark-mode-disagreement/) [W, search summary]
- OKLCH rationale: HSL lightness varies by hue (yellow looks lighter than blue at equal L), making contrast unpredictable; OKLCH lightness is closer to perceptual. Counter-view exists: a UX Collective piece titled "Stop using OKLCH lightness for your color scale". — [Hallmark OKLCH write-up](https://instagit.com/Nutlope/hallmark/how-hallmarks-okich-system-ensures-accessibility/), [UX Collective](https://uxdesign.cc/stop-using-oklch-lightness-for-your-color-scale-02025deca49d) [W, search summary; conflicting views]
- Atlassian accent thresholds: 3:1 for UI essential to understanding and text >= 24 px; 4.5:1 for text < 24 px. — [Atlassian Design, colour/accents](https://atlassian.design/foundations/color/accents) [P, search summary]
- Apple: do not use the same colour to mean different things; do not rely on colour alone; provide light, dark and increased-contrast variants of every custom colour; do not redefine semantic system colours. — [Apple HIG, Color](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json) [P]
- Apple system colour reference (light / dark, RGB): Blue 0,136,255 / 0,145,255; Green 52,199,89 / 48,209,88; Yellow 255,204,0 / 255,214,0; Red 255,56,60 / 255,66,69. Increased-contrast light variants are much darker (Yellow 161,106,0; Green 0,137,50; Blue 30,110,244), showing Apple's own fix for light-hue accents. Values are reference only; do not hard-code. — [Apple HIG, Color](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json) [P]
- iOS background hierarchy: system (primary/secondary/tertiary) vs grouped sets; label hierarchy label/secondary/tertiary/quaternary. — [Apple HIG, Color](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json) [P]
- Dark-mode elevation: M3 expresses elevation by surface *tone* (five container roles) rather than opacity overlays or shadow. — [Material blog, tone-based surfaces](https://material.io/blog/tone-based-surface-color-m3) [P, search summary]
- Lime specifics (all search summaries; exact page attribution among the lime guides not verified): lime text on white reported at about 1.2:1 (fails), black text on lime about 17.5:1 (AAA); "white text on lime is a poor starting pair; test dark labels instead". — [Linearity lime guide](https://linearity.io/academy/colors/lime/), [Moda lime-green guide](https://moda.app/resources/colors/lime-green) [W]
- Patterns for light accents: keep brand accent for large surfaces/decoration and use a contrast-adjusted variant for accent-coloured text under 24 px; use the 600+ step of the green ramp for text on light backgrounds; shift lime to a brighter step in dark mode. — [dev.to, "Accessible color contrast without killing the brand"](https://dev.to/raxxostudios/accessible-color-contrast-without-killing-the-brand-4e9n), [Axmed design system colours](https://www.mintlify.com/ax-derrick/axmed-design-system/foundations/colors), [Threshline](https://threshline.pages.dev/blog/color-system-product-design) [W, search summary]

### Inferences
- Token structure to adopt: primitives (navy/cobalt/lime/neutral ramps in OKLCH, about 10-12 steps) -> semantic roles (`bg`, `surface`, `surfaceRaised`, `surfaceOverlay`, `textPrimary/Secondary/Tertiary`, `border`, `accent`, `accentText`, `onAccent`, `success/warning/danger`, `route`, `routeAlt`, `userLocation`) -> component tokens. Light and dark values per semantic role, plus an increased-contrast set (Apple requirement).
- Lime rules for Atlas: (a) lime is a *fill/highlight* only; `onAccent` is navy/near-black in both themes, never white; (b) no lime text, hairlines or thin icon strokes on light surfaces; use cobalt or a dark green `accentText` there; (c) lime is at its best on the dark navy theme, which is where it can be the hero; (d) cobalt carries interactivity (links, selected state), lime carries one emphasis per screen (primary CTA, active route). This also satisfies Apple's "don't colour multiple control backgrounds".
- Dark theme: build 4-5 navy-tinted surface tones getting lighter with elevation (M3 model) and add shadows only as a secondary cue; verify every text/surface pair with both WCAG ratio and APCA.
- Because the map is colourful content, HIG's advice implies monochrome floating chrome over the map with a single tinted primary.

### Gaps
- I did not retrieve APCA's own Lc threshold table (commonly cited levels such as Lc 60/75/90), so no APCA numeric targets are given here.
- No primary source found for how Wise, Monzo, Duolingo or Spotify handle bright green/lime on light backgrounds.
- Atlas's actual hex values were not provided, so no pair-by-pair contrast results could be computed.
- Official M3 dark-theme tone numbers for each surface-container role not retrieved.

---

## 6. Spacing, radii, elevation/shadow, borders and the "small details" checklist

### Takeaway
Premium feel comes from consistency rules more than any single value: nested radii that are concentric (outer = inner + padding), shadows that share one light source and are layered and hue-tinted, hairline rings instead of heavy borders, and optical rather than purely geometric alignment.

### Cited Findings
- Concentric radius: outer radius = inner radius + padding (equivalently Apple: inner = parent radius - padding). — [Jakub Krehel, concentric border radius](https://jakub.kr/work/concentric-border-radius), [WWDC25 356 notes](https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/)
- Limits of the formula: with small inner radius and large padding the result is oversized; when padding exceeds outer radius the inner radius hits zero, which "doesn't feel right"; do not apply as a blanket rule; for asymmetric padding use the smaller padding. — [Design Engineers Weekly](https://designengineers.beehiiv.com/p/family-photo-my-philosophy-radius-24-01-04), [Frontend Masters](https://frontendmasters.com/blog/the-classic-border-radius-advice-plus-an-unusual-trick/), [dev.to concentric rule](https://dev.to/sgbp/the-concentric-border-radius-rule-why-nested-rounded-corners-look-slightly-wrong-3hog) [S, search summary]
- SwiftUI on iOS 26 exposes concentric rectangles natively. — [Nil Coalescing, ConcentricRectangle](https://nilcoalescing.com/blog/ConcentricRectangleInSwiftUI) [S, search summary]
- Shadows (Josh Comeau): one global light source; keep a fixed offset ratio (e.g. y = 2x); as elevation rises, increase offset and blur and *decrease* opacity; layer shadows, e.g. five layers at 0.075 alpha with y/blur 1/1, 2/2, 4/4, 8/8, 16/16 px, or three layers 1-2-2, 2-4-4, 3-6-6; tint the shadow with the background hue rather than pure black (example: bg hsl(220 100% 80%) -> shadow hsl(220 60% 50%)); layered shadows are costly to animate. — [Josh W. Comeau, "Designing Beautiful Shadows in CSS"](https://www.joshwcomeau.com/css/designing-shadows/) [P practitioner]
- Details checklist (Jakub Krehel): shadows instead of borders (layered shadow with a 1 px ring at about 6% black in light mode, about 8% white in dark; slightly stronger on press/hover); 1 px inner outline at 10% opacity on images (black in light, white in dark); tabular numbers for changing figures; optical alignment (e.g. less padding on the icon side of a button; fix the SVG rather than adding margins); interruptible animations; icon swaps animated with opacity + scale + blur; enter animations staggered about 80-100 ms per item; exits subtler than enters (spring about 0.45 s, bounce 0); balanced text wrapping on titles. — [Jakub Krehel, "Details that make interfaces feel better"](https://jakub.kr/writing/details-that-make-interfaces-feel-better) [P practitioner]
- Apple: capsule shapes for touch-friendly prominent controls; three shape families only (fixed, capsule, concentric). — [WWDC25 356 notes](https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/)
- Google: containment (grouping in containers) aids findability but overuse made list views feel dense. — [Google Design research](https://design.google/library/expressive-material-design-google-research), [9to5Google recap](https://9to5google.com/2025/12/27/recap-material-3-expressive/)

### Inferences
- Suggested Atlas tokens (my synthesis, consistent with the sources, not quoted from one): spacing on a 4 pt base (4, 8, 12, 16, 20, 24, 32, 40, 48); radii 8 (chips/inputs), 12 (small cards), 16 (cards), 24 (sheets/large cards), full (pills, search bar, FAB); derive nested radii by the concentric rule with a floor of about 4 so inner corners never go square.
- Elevation ramp of 3-4 levels (card, floating control, sheet, modal), each a 2-3 layer navy-tinted shadow in light mode; in dark mode rely on lighter surface tone + 1 px white ring at about 8%.
- RN practicalities: `boxShadow` supports multiple layers on the New Architecture; avoid animating layered shadows (animate opacity/transform of a wrapper instead). (From my own knowledge, not a retrieved source.)
- Pre-ship checklist for Atlas: concentric nested corners; one light direction; hairline ring on cards and map thumbnails; tabular digits on distance/ETA; optical centring of chevrons/play-style glyphs; 44 pt+ hit targets; skeletons shaped like final content; designed empty/error/offline states; press feedback under 100 ms; every animation interruptible; consistent icon stroke and optical size.

### Gaps
- No retrieved primary pages for 4/8 pt grid definitions or token tables from Polaris, Primer, Carbon or Uber Base; the spacing/radius scale above is synthesis, not citation.
- Emil Kowalski, Rauno Freiberg, Refactoring UI and Erik Kennedy were not retrieved; no claims are attributed to them.
- No sourced guidance retrieved on skeleton loaders or empty states specifically.

---

## 7. Iconography

### Takeaway
SF Symbols 7 is the richest system set (Draw animations, variable draw, gradients) but is Apple-only by licence and platform; for one cross-platform identity in RN, a permissively licensed SVG set with multiple weights (Phosphor: MIT, six weights; Material Symbols: Apache 2.0, four variable axes) is the practical choice, with Lucide/Tabler as single-style stroke alternatives.

### Cited Findings
- SF Symbols 7: Draw animations (Draw On / Draw Off presets, modelled on handwriting), Variable Draw (progress/strength, alternative to Variable Color; only one can apply at render time), enhanced Magic Replace (uses draw off/on when supported), automatic gradients from a single source colour in all rendering modes, "hundreds of new symbols". — [Apple SF Symbols](https://developer.apple.com/sf-symbols), [WWDC25 337 notes](https://wwdcnotes.com/documentation/wwdc25-337-whats-new-in-sf-symbols-7/), [9to5Mac](https://9to5mac.com/2025/06/11/apple-releases-sf-symbols-7-beta/) [P/S, search summary]
- SF Symbols use weights equivalent to SF text weights so they match adjacent text, and scale with Dynamic Type automatically. — [Apple HIG, Typography](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json) [P]
- Apple guidance: use the HIG's preferred standard glyphs; one icon per group of related menu actions; same symbols on every device; a label generally beats an icon. — [WWDC25 356 notes](https://wwdcnotes.com/documentation/wwdc25-356-get-to-know-the-new-design-system/) [S]
- Material Symbols: Apache 2.0; variable font with four axes: fill, weight, grade, optical size. — [Composables: Material Symbols](https://composables.com/icons/icon-libraries/material-symbols), [2026 icon library overview](https://www.youngju.dev/blog/culture/2026-05-16-icon-libraries-designers-developers-2026-lucide-heroicons-phosphor-tabler-radix-material-symbols-iconify-deep-dive.en) [S, search summary]
- Phosphor: MIT; six weights (thin, light, regular, bold, fill, duotone). — [2026 icon library overview](https://www.youngju.dev/blog/culture/2026-05-16-icon-libraries-designers-developers-2026-lucide-heroicons-phosphor-tabler-radix-material-symbols-iconify-deep-dive.en), [dev.to on icon licences](https://dev.to/usapopopooon/what-i-didnt-know-about-icon-library-licenses-and-you-might-not-either-30of) [S, search summary]
- Lucide: ISC licence. Tabler: MIT per most listings (one directory says Apache 2.0, likely an error). — [dev.to on icon licences](https://dev.to/usapopopooon/what-i-didnt-know-about-icon-library-licenses-and-you-might-not-either-30of), [Composables: Tabler](https://composables.com/icons/icon-libraries/tabler) [S, search summary; conflicting listing noted]
- Hugeicons: free set listed as MIT on icon directories; the vendor also sells "Hugeicons Pro", so which styles are free is unclear. — [21st.dev icons](https://21st.dev/icons), [Hugeicons blog](https://hugeicons.com/blog/development/best-open-source-icon-libraries) [W, search summary]
- Icon change animation: animate opacity, scale and blur when icons swap. — [Jakub Krehel](https://jakub.kr/writing/details-that-make-interfaces-feel-better)

### Inferences
- For Atlas's existing SVG pipeline: standardise on one set, one stroke weight (e.g. 1.5 or 2 px at 24 px) and one corner style; use a filled/bold variant for the selected tab state (the pattern both SF Symbols and Material Symbols' FILL axis encode). Phosphor's regular/bold/fill trio covers this with one licence.
- Wayfinding amenity pictograms (toilets, lifts, exits, accessible routes) should stay close to public-signage conventions rather than a stylised UI icon set, and always carry a text label in lists.
- SF Symbols must not be exported as SVGs for Android; treat as iOS-only if used at all.

### Gaps
- SF Symbols licence wording not retrieved (the Apple-platform-only restriction is stated from prior knowledge of Apple's terms; verify on Apple's page).
- Licences were confirmed only via directories/blogs, not each project's LICENSE file; verify before shipping. Animation support in open sets (e.g. Lottie/animated variants) not researched.

---

## 8. Accessibility as premium

### Takeaway
The measurable floor is WCAG 2.2 AA: 24x24 CSS px targets (aim for 44 pt iOS / 48 dp Android on anything important), contrast, and no information by colour alone; for a map app the differentiators are a non-map text alternative for screen-reader users, Dynamic Type that actually reflows, and honouring Reduce Motion/Transparency/Increase Contrast.

### Cited Findings
- WCAG 2.2 SC 2.5.8 Target Size (Minimum), AA: "The size of the target for pointer inputs is at least 24 by 24 CSS pixels," with exceptions: Spacing (a 24 px circle centred on each undersized target must not intersect another target or its circle), Equivalent, Inline, User agent control, Essential. — [W3C, Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) [P]
- SC 2.5.5 Target Size (Enhanced), AAA, is 44x44 CSS px; W3C suggests aiming for it on important controls. — [W3C, Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) [P]
- Maps: W3C uses digital map pins as an example of the Essential exception (pin position reflects real location, so dense pins may be undersized), but "strongly encourages" equivalent functionality by other means. — [W3C, Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) [P]
- Apple: do not rely on colour alone; supply increased-contrast colour variants; support Dynamic Type including accessibility sizes with reflow, minimal truncation and scaled icons; custom fonts must support Bold Text. — [Apple HIG, Color](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/color.json), [Apple HIG, Typography](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json) [P]
- Google's M3E research presents exceeding accessibility minimums (larger targets, high-contrast containment) as part of what made designs perform better, and reports age effects disappearing. — [Google Design research](https://design.google/library/expressive-material-design-google-research) [P]
- Screen-reader map patterns: Bloomberg Connects provides "a linear, text-based version of the map" and defaults to it when a screen reader is detected (both views available to everyone via an icon). — [Bloomberg Connects support](https://support.bloombergconnects.org/article/265-an-app-for-all-abilities) [P, search summary]
- Pointr's indoor SDK has an accessible mode with more detailed directions, changing wording from "Follow the line" to "Go straight". — [Pointr Mobile SDK accessibility guide](https://docs-dev.pointr.tech/docs/8.x/Developer%20Portal/Pointr%20Mobile%20SDK/Guides/Accessibility) [P, search summary]
- Mapbox iOS example: a summary accessibility element announces visible annotations. Google documents accessibility for the Android Maps SDK. MazeMap advertises VoiceOver/TalkBack support and step-free routing. — [Mapbox VoiceOver example](https://docs.mapbox.com/ios/maps/examples/voice-over-accessibility/), [Google Maps Android SDK accessibility](https://developer.google.com/maps/documentation/android-sdk/accessibility), [MazeMap accessibility](https://mazemap.com/accessibility) [P, search summary]
- Colour-vision deficiency: the Okabe-Ito palette is 8 colours that stay distinguishable under all common CVD types and is free to use; colour alone is never fully safe, so add labels, symbols, shapes or patterns; separate colours by lightness as well as hue. — [Okabe-Ito reference](https://conceptviz.app/fr/blog/okabe-ito-palette-hex-codes-complete-reference), [Datawrapper, colourblindness part 2](https://www.datawrapper.de/blog/colorblindness-part2), [Studio Matrx](https://www.studiomatrx.org/students/colour-theory-and-application/colour-blindness-and-inclusive-colour) [S, search summary]
- Liquid Glass and accessibility settings: glass appearance changes under Reduce Transparency and Increase Contrast; in RN check `AccessibilityInfo.isReduceTransparencyEnabled()`. — [Apple HIG, Materials](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json), [Expo GlassEffect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/) [P]

### Inferences
- Atlas-specific actions: (1) every map-only affordance (POI pins, route) needs a list/steps equivalent reachable by VoiceOver/TalkBack, and should become the default when a screen reader is on; (2) route instructions must be landmark/text based ("Go straight past the lift"), not "follow the blue line"; (3) the route line needs a non-colour cue (white casing/outline, direction chevrons, dashed style for alternatives or stairs vs step-free) and a lightness difference from the map base; (4) category colours should be drawn from a CVD-safe set and always paired with distinct glyph shapes.
- A cobalt route on a light map and a lime route on a dark navy map both give strong lightness contrast; lime on a light map does not.
- Hit targets: 44x44 pt minimum for map controls, chips and list rows; expand small pins with `hitSlop` and offer the list alternative (Essential + Equivalent exceptions).
- Reduce Motion: replace spring overshoot, map fly-to and parallax with cross-fades; Reduce Transparency: swap glass for solid tokens.

### Gaps
- Other WCAG 2.2 additions (2.4.11 Focus Not Obscured, 2.5.7 Dragging Movements, 3.2.6 Consistent Help, 3.3.8 Accessible Authentication) were not retrieved; the fetched page only confirmed Dragging Movements exists as the preceding criterion. Dragging matters for map panning and bottom sheets and should be checked against the W3C text.
- Platform minimums (Apple 44x44 pt, Android 48x48 dp) are stated from general knowledge; the HIG Accessibility page and Android guidance were not fetched.
- No authoritative source found on dash/pattern conventions for indoor route lines for CVD users; advice above rests on general redundancy principles.
- No user-research data retrieved linking accessibility quality to "premium" perception beyond Google's M3E study.
