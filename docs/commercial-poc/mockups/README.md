# Atlas product concepts

Self-contained visual concepts for the R100,000 / 12-month fund application. These are proposed interfaces with fictional stores, schematic venue geometry and explicitly illustrative data. They are not screenshots of deployed services or real advertising delivery.

## Premium mobile plates used in the PDF

Created with built-in ImageGen at 1536 x 1024 pixels each. The second image uses the first as a visual style reference. Original generated files remain in the Codex image library; the project copies below are the document assets.

- [Map home and sponsored search](imagegen/atlas-mobile-discovery.png)
- [Route preview and active guidance](imagegen/atlas-mobile-navigation.png)
- [Exact generation prompts and method](imagegen/prompts.json)

The local HTML mobile screens below are optional code-native references. The fund PDF uses the ImageGen mobile plates requested by the user.

## Editable dashboard and optional mobile concepts

Open `index.html` for the full collection, or use one screen query:

- `?screen=dashboard-analytics`
- `?screen=dashboard-advertising`
- `?screen=app-map`
- `?screen=app-search`
- `?screen=app-route`
- `?screen=app-guidance`
- `?screen=app-overview`

The two dashboard PNGs in `screens/` are 2880 x 1800 pixels, rendered from a 1440 x 900 CSS-pixel viewport at 2x. Optional code-native phone concepts are 1170 x 2532 pixels (390 x 844 at 3x). The four-phone overview is 3584 x 2220 pixels.

The dashboard analytics source is the app-observed sample, not whole-mall footfall. The hourly illustrative session distribution sums to 1,248. Advertising figures distinguish budget ceilings, delivered spend, valid impressions and the venue share; amounts and impressions are rounded examples. The HTML controls express the proposed interface and are not connected to production data.

To regenerate code-native screen PNGs, run `render-screens.mjs` with the bundled Node executable. It uses bundled Playwright through an ignored local `node_modules` junction, opens an installed Chromium window, captures every screen and closes the browser. No external fonts, photos or network services are required.
