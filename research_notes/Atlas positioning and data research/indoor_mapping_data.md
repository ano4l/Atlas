# Indoor venue map data: open standards, data sources and open-source tooling (status as of Nov 2026)

Scope: how a mall-navigation startup with a custom versioned "map package" JSON (floors, POIs, corridor-graph edges with step-free / one-way / schedule attributes), a Kotlin + PostGIS backend, a React Native SVG renderer and an empty Next.js operator dashboard can obtain, author, validate and render indoor map data cheaply with open standards and OSS, instead of hand-tracing floor-plan images.

Method note: GitHub star counts, licences and feature claims below were read from the live repository pages on 2026-11-14 unless otherwise stated. GitHub's rendered pages did not expose last-commit dates to the fetch tool, so "maintenance status" is given from release pages, READMEs or secondary sources where available and otherwise flagged as a gap.

---

## KQ1. Indoor map data standards: IMDF, IndoorGML 2.0, OSM SIT, Google, CityGML LoD4, IFC — practicality, routing-graph and accessibility modelling, converters

### Takeaway
IMDF (GeoJSON-based, Apple + OGC Community Standard 1.0.0) and OSM Simple Indoor Tagging are the two formats that are actually practical to author and consume today; both model levels, units/rooms and openings/doors, and both encode accessibility, but neither ships a complete routing graph — IMDF's `Relationship` features are explicitly "hints", and SIT relies on consumers deriving connectivity from areas, doors, steps and elevators. IndoorGML 2.0 is the only standard built around a navigation network (dual space/graph), but Part 1 (conceptual model) was only published in Aug 2025 and the JSON encoding (IndoorJSON) is still unratified; CityGML 3.0 dropped LoD4 interiors, and IFC is a source format needing conversion.

### Cited Findings

**IMDF (Apple / OGC)**
- IMDF 1.0.0 is an OGC Community Standard: submitted 2020-07-23, approved 2021-02-02, published 2021-02-18; copyright Apple and OGC; available "on a royalty free, non-discriminatory basis". — [OGC IMDF 1.0.0](https://docs.ogc.org/cs/20-094/index.html)
- IMDF is a set of GeoJSON (RFC 7946) FeatureCollections, one file per feature type, plus `manifest.json`; only `address.geojson` and `venue.geojson` are required. Optional types: Amenity, Anchor, Building, Detail, Fixture, Footprint, Geofence, Kiosk, Level, Occupant, Opening, Relationship, Section, Unit. — [Apple IMDF reference](https://register.apple.com/resources/imdf/reference/reference); [OGC IMDF](https://docs.ogc.org/cs/20-094/)
- Unit categories include `walkway`, `room`, `elevator`, `escalator`, `movingwalkway`, `ramp`, `stairs`, `steps`, `nonpublic`, `opentobelow`, `structure`, `column`; Units carry `level_id`, an `accessibility` array and a `restriction` (`employeesonly`, `restricted`). — [OGC IMDF Unit](https://docs.ogc.org/cs/20-094/Unit/index.html)
- Openings are LineStrings approximating the physical width of the entrance; they carry `category` (`pedestrian`, `pedestrian.principal`, `pedestrian.transit`, `emergencyexit`, `service`, `automobile`, `bicycle`), `accessibility` (array, e.g. `wheelchair`, `tactilepaving`), `access_control` (e.g. `badgereader`), `door` object (`automatic`, `material`, `type`), `level_id`. Connection to Units is spatial, not by reference: an Opening "MUST cover a single Unit boundary". Vertical-traversal Units (elevators, stairs, escalators, steps) each require at least one Opening. — [OGC IMDF Opening](https://docs.ogc.org/cs/20-094/Opening/index.html)
- Accessibility glossary: the main categories are `wheelchair` and `braille`; a wheelchair tag on an Opening implies an automatic door. Accessibility is a property of Amenity, Opening, Section and Unit. — [Apple IMDF glossary](https://register.apple.com/resources/imdf/glossary)
- IMDF `Relationship` models an edge between two features with `origin`, `destination`, optional `intermediary` array (Openings/Units), `direction` = `directed`|`undirected`, and `hours` (temporal constraint). Geometry is null by default; curated LINEAL paths are allowed but the spec says they "are not meant for a comprehensive routing network" and are to be treated as "hints". Escalators whose direction changes by time of day are captured as separate directed Relationships with their own `hours`; elevators are undirected with elevator Units on different Levels as intermediaries. — [OGC IMDF Relationship](https://docs.ogc.org/cs/20-094/Relationship/index.html)
- OGC's community-standard justification lists indoor wayfinding/routing as use cases and contains sections on GTFS Pathways and "extending the routing graph". — [OGC Community Standard Justification (PDF)](https://portal.ogc.org/files/92141)
- The OGC changelog notes some IMDF validation rules were deprecated "because of the proprietary nature of their data requirements". — [OGC IMDF changelog](https://docs.ogc.org/cs/20-094/CHANGELOG/index.html)
- FME has an IMDF reader/writer (commercial ETL). — [Safe Software FME IMDF](https://docs.safe.com/fme/html/FME-Form-Documentation/FME-ReadersWriters/imdf/imdf.htm)

**OGC IndoorGML 2.0**
- OGC published IndoorGML 2.0 Part 1: Conceptual Model (doc 22-045r5) on 28 Aug 2025; it is a UML conceptual schema for "indoor navigation network models" with a core module (topological connectivity, multiple "spaces") and a navigation module (navigable space, transfer space, navigable boundary, non-navigable space); it is free to download and implement. — [OGC announcement](https://www.ogc.org/ogc-publishes-indoorgml-2-0-part-1-conceptual-model-standard/); [22-045r5](https://docs.ogc.org/is/22-045r5/22-045r5.html)
- Version 2.0 structurally separates conceptual model from encodings and simplifies the data model relative to 1.x. — [OGC announcement](https://ogc.org/announcement/ogc-publishes-indoorgml-2-0-part-1-conceptual-model-standard)
- Part 2 (encodings): sources conflict — the approved Part 1 text says Part 2 "specifies technical implementation schemas in GML, SQL and JSON", while an earlier OGC announcement described only a GML 3.2.1 schema. A 2026 ISPRS paper states IndoorJSON "is still a work in progress and has not yet been ratified as an OGC standard"; a FOSS4G 2026 talk describes it as "currently being standardized". Draft IndoorJSON schemas and samples are in the OGC IndoorGML-SWG GitHub repo (Part II JSON folder). — [ISPRS 2026](https://isprs-archives.copernicus.org/articles/L-4-W1-2026/87/2026/); [FOSS4G 2026 talk](https://talks.osgeo.org/foss4g-2026/talk/MSYSPT/)
- Older IndoorGML versions 1.0, 1.0.3, 1.1 remain listed on the OGC standards page. — [OGC IndoorGML](https://www.ogc.org/standards/indoorgml/)

**OSM Simple Indoor Tagging (SIT)** — detail in KQ2; summary here:
- SIT (created 2014) maps covered spaces as areas: `indoor=room|area|corridor|wall|level`, mandatory `level=*` (single, list `1;2`, range `-1-5`), `level:ref`, `repeat_on`; doors as shared nodes `indoor=door` + `door=*`; building `min_level`/`max_level`/`non_existent_levels`; stairs as areas with `stairs=yes` (+`conveying=yes` for escalators), elevators as areas with `highway=elevator`, steps as `highway=steps` ways with a level range. The wiki page has no routing section and does not cover `wheelchair=*`, `incline` or `step_count`. — [OSM wiki: Simple Indoor Tagging](https://wiki.openstreetmap.org/wiki/Simple_Indoor_Tagging)
- OSM pedestrian guidelines: a level change is a multi-value `level=1;2` on `highway=steps`, `highway=elevator`, or `highway=footway`+`incline=*` for ramps. — [OSM wiki: Guidelines for pedestrian navigation](https://wiki.openstreetmap.org/wiki/Guidelines_for_pedestrian_navigation)

**Google indoor maps**
- Google's help page offers no self-serve floor-plan upload; owners contact regional "indoor partners" teams (Americas; Asia-Pacific; Africa/Europe/Middle East) to update floor plans; takedown via "indoor takedown" in a data-problem report. No discontinuation notice. — [Google Maps help: indoor maps](https://support.google.com/maps/answer/2803784)
- Separate, vendor-reported change: Google began rejecting floor-plan uploads in Business Profile's Product Editor (real-estate listings), described as policy enforcement rather than a shutdown. — [repli360](https://www.repli360.com/blog/google-is-removing-floor-plans-from-business-profiles); [SOCi](https://www.soci.ai/blog/google-business-profile-floor-plans-may-be-removed-from-products-what-multifamily-marketers-need-to-know/)

**CityGML / IFC / BIM**
- CityGML 3.0 removed LoD4; interiors are now handled via separate LoDs for exterior and interior features (TU Delft 2025 preprint). The same group released an open-source IFC→CityGML/CityJSON converter (IfcEnvelopeExtractor / bim2geo-converter), noting accuracy drops for complex interiors. — [Preprints.org 202509.2284](https://www.preprints.org/manuscript/202509.2284)
- `ifc2indoorgml` is an open-source C++ tool generating IndoorGML from IFC (ISPRS 2022; UNSW GRID; github.com/grid-unsw/ifc2indoorgml; binaries target 64-bit Windows). — [ual.sg publication page](https://ual.sg/publication/2022-isprs-ifc-2-indoorgml/); [ISPRS Archives 2022](https://isprs-archives.copernicus.org/articles/XLIII-B4-2022/295/2022/)
- A 2024 CIB W78 paper integrates IFC, CityGML, IndoorGML and OSM using BIMserver, CityGML4J and OSM4J, noting "few authors have attempted to convert from IFC to IndoorGML". — [W78 2024 paper 129](https://eres.scix.net/pdfs/w78-2024-paper_129.pdf)
- `BIMtoOSM` (rebeccasc) — IFC→OSM parser; AGPL-3.0; 11 stars; JVM (Gradle Kotlin DSL, depends on opensourceBIM IfcPlugins); README says code is "being rebuilt from scratch and the API might change"; integrated into the JOSM IndoorHelper plugin. — [GitHub BIMtoOSM](https://github.com/rebeccasc/BIMtoOSM)

**Converters between formats**
- `osmtoimdf` (danielrotaermel) — Node/JS script converting OSM XML (gathered with Overpass queries per IMDF feature type) into an IMDF archive usable with Apple MapKit; 20 stars; licence not stated on page; README: conversion "is certainly not straightforward", "a starting point", "some manual mapping is still required"; an aggregator shows it updated Dec 2025. — [GitHub osmtoimdf](https://github.com/danielrotaermel/osmtoimdf); [relatedrepos listing](https://relatedrepos.com/gh/danielrotaermel/osmtoimdf)
- No dedicated IMDF→OSM or IndoorGML↔IMDF open-source converter was found; generic routes are `ogr2osm` (GDAL-readable → .osm) since IMDF is plain GeoJSON. — [GitHub ogr2osm](https://github.com/pnorman/ogr2osm)
- Ariadne's overview of indoor data standards (vendor blog) compares IMDF/IndoorGML/OSM at a high level. — [Ariadne blog](https://www.ariadne.inc/resources/blogs/indoor-map-data-standards/)

### Inferences
- The reader's existing map-package contract (floors, POIs, edges with step-free/one-way/schedule) already maps almost 1:1 onto IMDF concepts: Level ↔ floor, Unit/Occupant/Amenity ↔ POI, Opening ↔ door node, Relationship(`directed`, `hours`, intermediary escalator Unit) ↔ one-way/scheduled edge, Unit/Opening `accessibility: ["wheelchair"]` ↔ step-free. An IMDF import/export adapter is therefore low-cost and would make the package consumable by Apple MapKit/Indoor Maps Program and FME-based venue teams.
- Because neither IMDF nor SIT carries a full corridor graph, the startup's own graph (plus auto-generation, KQ5) remains a differentiator; IMDF Relationships should be treated as inter-level connectors only.
- IndoorGML 2.0 is worth tracking for its network model vocabulary (navigable/transfer space, dual graph) but is not yet a practical interchange format for a 2026 product because the JSON encoding is unratified and tooling is academic.
- IFC/BIM→indoor pipelines exist but are research-grade and Windows/C++-centric; useful only if a mall owner hands over IFC models, which is unlikely for older malls.

### Gaps
- Full IMDF `ACCESSIBILITY-CATEGORY`, `ACCESS-CONTROL-CATEGORY` and complete `RELATIONSHIP-CATEGORY` enumerations live on the Categories page which was not fetched; `traversal.path`, `stairs`, `movingwalkway` as Relationship categories are unconfirmed.
- Apple's own IMDF licence page (register.apple.com .../License) text was not retrieved; only the OGC "royalty free, non-discriminatory" statement is confirmed.
- Whether IndoorGML 2.0 Part 2 (GML/SQL/JSON) has been formally published by Nov 2026 could not be confirmed.
- Current acceptance criteria / turnaround of Google's indoor partner program were not found.

---

## KQ2. OpenStreetMap indoor ecosystem: OpenLevelUp, indoor= tagging coverage, JOSM plugins, OSM-based indoor routers

### Takeaway
OSM has a stable tagging consensus (SIT), a maintained tile pipeline (indoor= / indoorequal, BSD) and editors (JOSM IndoorHelper, OsmInEdit), but global coverage is tiny (~1M indoor objects vs 700M buildings) and effectively nil for South African malls (8 `indoor=*` ways in the Sandton City bbox); OSM-based indoor routing is limited to OpenTripPlanner's elevator/level support and academic forks — no mainstream router (GraphHopper, OSRM, Valhalla) does multi-floor routing out of the box.

### Cited Findings

**Tagging & coverage**
- SIT "was initially created in 2014 by SimonPoole, Tordanik, Peda and Andi"; it is the current consensus per the OSM Indoor Mapping page; alternatives `buildingpart=*` (used by OpenLevelUp/OpenIndoor) and IndoorOSM are legacy/abandoned. — [OSM wiki: Indoor Mapping](https://wiki.openstreetmap.org/wiki/Indoor_Mapping); [SIT](https://wiki.openstreetmap.org/wiki/Simple_Indoor_Tagging)
- A State of the Map 2026 (OSM Science) abstract cites taginfo: "over 700 million objects tagged as buildings, but only 1 million indoor objects". — [SotM 2026 abstract](https://pretalx.com/sotm2026-osm-science/talk/CTNPQJ/)
- Less than 2% of `indoor=room` uses are on nodes (community thread). — [OSM community](https://community.openstreetmap.org/t/should-a-room-node-have-an-indoor-room-tag/147433)
- The OSM Indoor Mapping wiki lists ~35 example mapped venues across ~16 countries; its app-comparison table is dated 2024-01-06; Organic Maps, OsmAnd, Every Door and CoMaps do not render indoor data and StreetComplete "won't support indoor". — [OSM wiki: Indoor Mapping](https://wiki.openstreetmap.org/wiki/Indoor_Mapping)
- Overpass count (2026-11-14, bbox -26.112,28.048,-26.102,28.062 around Sandton City): 8 `indoor=*` elements total (8 ways, 0 nodes, 0 relations). — [Overpass API query](https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3Bnwr%5B%22indoor%22%5D%28-26.112%2C28.048%2C-26.102%2C28.062%29%3Bout%20count%3B)
- The 2008 "Sandton Mapping Party" wiki page documents outdoor street mapping around Sandton City only. — [OSM wiki: Sandton Mapping Party](https://wiki.openstreetmap.org/wiki/Sandton_Mapping_Party)
- Sandton City's own wayfinding is a proprietary ViaDirect kiosk + mobile map deployment; Eastgate is also a ViaDirect client. — [ViaDirect](https://viadirect.com/sandton-city-advanced-digital-wayfinding/); [ViaDirect African centres](https://viadirect.com/digital-wayfinding-african-shopping-centres-sandton-city-eastgate/)
- South African vendor MapIT reportedly produced indoor maps of 65 local malls and nine largest airports (TechCentral report). — [TechCentral](https://techcentral.co.za/?p=187718)

**Viewers / tiles**
- indoor= (indoorequal.org) renders SIT data with a level selector and a coverage heat-map. — [OSM wiki: Indoor Mapping](https://wiki.openstreetmap.org/wiki/Indoor_Mapping)
- `indoorequal/indoorequal` — "Generate vector tiles from OpenStreetMap indoor data"; code BSD, schema/cartography CC-BY (credit IndoorEqual.org and OpenMapTiles.org); 51 stars; built on openmaptiles-tools + PostgreSQL, served via `postserve`; `make generate-tiles-pg` exports MBTiles; updates run manually via `./script/update`. — [GitHub indoorequal](https://github.com/indoorequal/indoorequal)
- indoor= tile schema (derived from OpenMapTiles 0.4.0) layers: `area` (class ∈ area, column, corridor, level, platform, room, wall; `level`, `access`, `is_poi`, `subclass`), `area_name`, `transportation` (class steps, `conveying`, `level`), `poi` (`class`, `subclass`, `name`, `level`, `rank`, `indoor`, `layer`), `heat`. — [indoorequal schema](https://indoorequal.com/doc/schema)
- `indoorequal/maplibre-gl-indoorequal` — MapLibre plugin for indoor= tiles; BSD-3-Clause; 46 stars; 436 commits; API: `map.addControl(indoorEqual)` level control, `setLevel(level)`, `level`/`levels`, events `levelschange`/`levelchange`; `url` option for own tile server, `geojson` option for GeoJSON keyed by layer name; recommends maplibre-gl ≥ 6. — [GitHub maplibre-gl-indoorequal](https://github.com/indoorequal/maplibre-gl-indoorequal)
- OpenLevelUp: Overpass-based level-by-level web viewer supporting `indoor=*` and `buildingpart=*`; wiki page last versioned 2016 (v3.0-alpha2). — [OSM wiki: OpenLevelUp](https://wiki.openstreetmap.org/wiki/OpenLevelUp)
- OpenIndoor (3D MapLibre viewer) listed both as available and as abandoned on the wiki — status unclear. OpenStationMap abandoned. — [OSM wiki: Indoor Mapping](https://wiki.openstreetmap.org/wiki/Indoor_Mapping)
- KDE `kosmindoormap` — "OSM multi-floor indoor map renderer" (C++/Qt, KDE Invent), created 2020-10-18, 1,733 commits, 111 tags; the wiki lists it as also providing routing. — [KDE Invent kosmindoormap](https://invent.kde.org/libraries/kosmindoormap); [OSM wiki](https://wiki.openstreetmap.org/wiki/Indoor_Mapping)

**Editors**
- JOSM IndoorHelper plugin: level bar with current working level; auto-tags new objects with `level=*`; "Insert level" dialog; stairways/elevators use `repeat_on`; validator historically over-warned (ticket closed fixed) and an open ticket reports it flags SIT-valid ranges like `level=0-2`. Code at github.com/JOSM/indoorhelper. — [JOSM help: IndoorHelper](https://josm.openstreetmap.de/wiki/Help/Plugin/IndoorHelper); [OSM wiki plugin page](https://wiki.openstreetmap.org/wiki/JOSM/Plugins/indoorhelper); [JOSM ticket 24478](https://josm.openstreetmap.de/ticket/24478?version=0)
- OsmInEdit (Adrien Pavie / Daimler AG, 2019) — web editor for OSM indoor data based on SIT; ISC licence; 36 stars; 147 commits; GitHub is a read-only mirror of Framagit; replaced the deprecated iD-indoor. — [GitHub OsmInEdit](https://github.com/PanierAvide/OsmInEdit); [OSM wiki](https://wiki.openstreetmap.org/wiki/Indoor_Mapping)
- MapComplete has an "indoors" theme for simple POI edits. — [OSM wiki: Indoor Mapping](https://wiki.openstreetmap.org/wiki/Indoor_Mapping)
- iD editor — ISC licence; 3.9k stars; JavaScript; npm `@openstreetmap/id`; roughly monthly releases. — [GitHub iD](https://github.com/openstreetmap/iD)

**Routers**
- OpenTripPlanner added indoor routing in 0.5: `highway=elevator` nodes connected to ways with `level=`, `layer=` or `level_map` relations "will be routed on properly". — [OTP wiki: Indoor mapping](https://github.com/opentripplanner/OpenTripPlanner/wiki/Indoor-mapping)
- OTP 2 stop-area docs: platform and entrance must share the same `level` value (fallback to `layer`); the 2.8.1 changelog mentions not applying elevation data to `indoor=yes` ways. — [OTP Stop Areas](https://docs.opentripplanner.org/en/latest/StopAreas); [OTP changelog v2.8.1](https://docs.opentripplanner.org/en/v2.8.1/Changelog/)
- A developer blog on OTP elevators recommends `highway=elevator` + `wheelchair=yes`, with level tags on the connecting ways not the elevator node. — [Elevators in OpenTripPlanner](https://optimistic-lichterman-dd9228.netlify.app/post/elevators-in-opentripplanner)
- GraphHopper: `level`/altitude "not for handling indoor routing across different floors"; indoor OSM tags "currently not supported"; workaround via z-component and EdgeFilter (issue #646). — [GraphHopper forum](https://discuss.graphhopper.com/t/multi-floor-support/2398); [GraphHopper forum 2](https://discuss.graphhopper.com/t/use-graphhoper-to-indoor-navigation/9263)
- OSRM (2016 list): "missing a few important features for indoor routing". — [OSRM-talk](https://lists.openstreetmap.org/pipermail/osrm-talk/2016-February/001126.html)
- Wiki-listed indoor routers are forks/prototypes: modified OSRM (Saerdnaer), modified OsmSharp (andreas.balzer), KOSM, FootPath (COMSYS, Android). — [OSM wiki: Indoor Mapping](https://wiki.openstreetmap.org/wiki/Indoor_Mapping)
- OSM data is also convertible to GeoJSON for client-side use with `osmtogeojson`, the path used by map-gl-indoor. — [GitHub map-gl-indoor](https://github.com/map-gl-indoor/map-gl-indoor)

### Inferences
- For South African malls OSM is not a data source today; it is at best a *publication target* (if mall owners agree to ODbL release — unlikely) or a schema to borrow. The SIT vocabulary and indoor= tile schema (`area.class`, `level`, `transportation.conveying`) are good references for naming layers in the startup's own PostGIS → vector-tile pipeline.
- Adopting SIT-compatible tags internally would let the team reuse JOSM IndoorHelper/OsmInEdit as free authoring UIs (editing a private OSM-XML file, not the live DB) and `osmtoimdf` for IMDF export, with zero bespoke editor work in the short term.
- None of the OSM routers are a drop-in for a Kotlin/PostGIS backend; pgRouting over the startup's own edge table (KQ5) is the pragmatic server-side router.

### Gaps
- A country-wide `indoor=*` count for South Africa could not be obtained (Overpass timed out twice on the national bbox); only the Sandton City bbox count (8 ways) is confirmed, and their tags were not inspected.
- Last-commit dates for indoorequal, maplibre-gl-indoorequal, OsmInEdit and kosmindoormap were not visible; kosmindoormap's licence and routing capability were not confirmed from its project page (the Volker Krause 2025 blog post returned 404).
- Whether Valhalla has any indoor/level support was not researched.

---

## KQ3. Open-source indoor map editors and floorplan-to-vector tools (ML vectorization, scanning, Blender/QGIS)

### Takeaway
There is no mature open-source "Mappedin-style" venue editor: the nearest are pre-alpha OpenIndoorMaps (Apache-2.0, TypeScript/MapLibre, editor "planned"), indrz (Django/Vue, 120 stars) and OSM editors; the most pragmatic cheap authoring stack is a MapLibre + Terra Draw (MIT) polygon editor embedded in the Next.js dashboard. Floorplan-vectorization ML (CubiCasa5k, RoomFormer, Raster2Seq, MitUNet) is research-grade and trained on residential CAD plans, not malls, so it is at most a pre-processing aid; phone LiDAR tools (Apple RoomPlan, Polycam) produce wall/door geometry but only for room-scale scans and, for Polycam, 2D DXF/SVG export needs a paid plan.

### Cited Findings

**Open-source venue platforms / editors**
- OpenIndoorMaps — self-hostable web indoor navigation for malls/airports/hospitals/universities; Apache-2.0; 188 stars; TypeScript (Vite/Remix config), MapLibre GL JS + OSM data; multi-floor; "Customizable admin panel" and open APIs claimed; map editor "planned, not yet available"; status Pre-Alpha, "only a demo of the map viewer". An aggregator dates creation to Oct 2024. — [GitHub OpenIndoorMaps](https://github.com/openindoormaps/openindoormaps); [ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fopenindoormaps%2Fopenindoormaps)
- indrz (`indrz/indrz-be`) — "Open source indoor mapping, routing for orientation and wayfinding"; 120 stars; 2,249 commits; Django REST backend + Vue/Nuxt frontend, Docker Compose; licence file present but type not shown; business model relies on paid hosting/data-prep by the maintainer. — [GitHub indrz](https://github.com/indrz/indrz); [indrz docs](https://www.github.com/indrz/indrz-doc)
- Anyplace (self-hostable server) and Osiris Indoor Server (REST APIs) are older academic platforms; `knotzerio/indoor-wayfinder` is a React/TS SVG wayfinding component; Navigine open-sourced an indoor routing-algorithm library (Mar 2024). — [GitHub anyplace mirror](https://github.com/mfkiwl/anyplace); [GitHub osiris](https://github.com/osiris-indoor/osiris); [ecosyste.ms indoor-wayfinder](https://awesome.ecosyste.ms/projects/github.com%2Fknotzerio%2Findoor-wayfinder); [Navigine blog](https://navigine.com/blog/navigine-unveils-innovative-open-source-library-for-indoor-navigation/)
- Mappedin's CMS/map editor is commercial ("all-in-one tool for editing venue maps"); no open-source or IMDF claims. — [Mappedin CMS](https://mappedin.com/map-cms)
- OSM editors usable for private files: JOSM IndoorHelper, OsmInEdit (ISC), iD (ISC) — see KQ2.

**Geometry drawing libraries for a custom editor**
- Terra Draw — "A library for drawing on maps that supports Mapbox, MapLibre, Google Maps, OpenLayers and Leaflet"; MIT; 1.1k stars; adapters for MapLibre GL JS v4/5, Leaflet v1, OpenLayers v10, Google Maps v3, Mapbox GL v3, ArcGIS JS v4; OSGeo community project; includes point/line/polygon/rectangle/circle modes and a select mode for editing. — [GitHub terra-draw](https://github.com/JamesLMilner/terra-draw); [OSGeo project page](https://www.osgeo.org/projects/terra-draw); [MapLibre example](https://maplibre.org/maplibre-gl-js/docs/examples/draw-geometries-with-terra-draw/)
- `watergis/maplibre-gl-terradraw` is a MIT MapLibre wrapper with a simpler API (FOSS4G Europe 2025 talk). — [FOSS4G-E 2025](https://talks.osgeo.org/foss4g-europe-2025/talk/UTUW8Z/)

**Floorplan vectorization (ML)**
- CubiCasa5K — 5,000 CAD-derived floorplans with raster + SVG annotations, >80 object categories; reference multi-task model based on "Raster-to-Vector" network; Python 3.6.5 / PyTorch 1.0.0 (stale); 631 stars; 13 commits; licence not visible on page; LMDB ~105 GB; data on Zenodo. — [GitHub CubiCasa5k](https://github.com/CubiCasa/CubiCasa5k); [Springer paper](https://dx.doi.org/10.1007/978-3-030-20205-7_3)
- RoomFormer (CVPR 2023) — single-stage Transformer predicting variable-size sets of room polygons; MIT; 344 stars; Python/PyTorch 1.9 with CUDA extensions; input is a top-down density map from a 3D point cloud (Structured3D, SceneCAD), not a raster plan; variant predicts room types, doors, windows. — [GitHub RoomFormer](https://github.com/ywyue/RoomFormer)
- Raster2Seq (arXiv 2602.09016, Cornell, Feb 2026) frames raster→vector floorplan conversion as sequence generation, building on Raster2Graph (2024). — [arXiv 2602.09016](https://arxiv.org/html/2602.09016)
- MitUNet (arXiv 2512.02413) — Mix-Transformer + U-Net wall segmentation evaluated on CubiCasa5k; code github.com/aliasstudio/mitunet. — [arXiv 2512.02413](https://arxiv.org/html/2512.02413v2)
- 2024 work on multi-unit floorplan recognition via improved semantic segmentation (arXiv 2408.01526). — [arXiv 2408.01526](https://arxiv.deeppaper.ai/papers/2408.01526v1)
- TU Delft 2024 thesis on domain adaptation for floorplan vectorization tested on CubiCasa5K (no code link found). — [TU Delft repository](https://repository.tudelft.nl/file/File_3e7d7f89-cf96-4167-9f5d-b481349d0c60)

**Phone LiDAR / scanning**
- Apple RoomPlan: `CapturedRoom` exposes walls, doors, openings, windows as parametric objects; export to USDZ via `export(to:metadataURL:modelProvider:exportOptions:)`; `CapturedStructure` merges multi-room scans (WWDC 2023); no official 2D-plan API — Apple staff suggested flattening z to 0; export is one-way (no re-import). — [Apple CapturedRoom](https://developer.apple.com/documentation/roomplan/capturedroom.md); [Apple USDExportOptions](https://developer.apple.com/documentation/roomplan/capturedroom/usdexportoptions.md); [Apple forum thread](https://developer.apple.com/forums/thread/831648)
- Polycam: 2D floor-plan exports in DXF, SVG, PDF, PNG, CSV; requires LiDAR iPhone/iPad Pro; floor-plan/DXF export on Business/Enterprise plans; vendor claims ±0.5 inch on standard interiors; not a certified survey. — [Polycam export formats](https://learn.poly.cam/hc/en-us/articles/27756102599572); [Polycam floor plans](https://poly.cam/floor-plans); [Polycam AutoCAD export](https://learn.poly.cam/hc/en-us/articles/41491709457684-How-to-Export-Polycam-Space-Mode-Captures-to-AutoCAD)

### Inferences
- Given the Next.js dashboard is empty, the cheapest credible path is MapLibre GL JS + Terra Draw (both MIT) over a georeferenced floor-plan raster (served as a MapLibre image source) with the startup's own schema — i.e. "assisted tracing" with snapping, rather than full automation; this beats adopting OpenIndoorMaps (pre-alpha, no editor) or indrz (Python stack, vendor-dependent).
- Vectorization ML is unlikely to pay off for malls in 2026: datasets are residential CAD drawings, models need CUDA, and mall plans are often lease plans with tenant blocks rather than walls. A plausible hybrid is MitUNet-style wall segmentation → polygonize (GDAL/Shapely) → human cleanup in the Terra Draw editor.
- RoomPlan/Polycam are useful for ground-truthing specific areas (kiosks, atrium geometry) and checkpoint placement, not for whole-mall capture.

### Gaps
- Licence of CubiCasa5k code and dataset (commonly stated as CC BY-NC for data) was not visible on the fetched page — verify before any commercial use.
- Last-commit years for OpenIndoorMaps, indrz, RoomFormer, Terra Draw were not exposed by the fetched pages.
- No independent accuracy evaluation of Polycam/RoomPlan floor plans for commercial interiors was found; only vendor claims.
- Blender/QGIS-specific indoor workflows and QGIS indoor plugins were not researched in this pass.

---

## KQ4. Rendering: MapLibre (Native / React Native) with indoor layers and PostGIS vector tiles (Martin, pg_tileserv, tippecanoe) versus custom SVG canvas

### Takeaway
The MapLibre stack is mature and permissively licensed end-to-end: `maplibre-react-native` (MIT, 676 stars, v11.5.1 released 2026-10-29, Expo-compatible), Martin (Rust, MIT/Apache-2.0, 4.1k stars, auto-discovers PostGIS tables/functions, serves MVT/PMTiles/sprites/glyphs) and tippecanoe (BSD-2, Felt-maintained) for offline PMTiles; floor switching is a simple `level` attribute filter, as indoorequal and map-gl-indoor demonstrate. SVG remains viable for a single small venue but loses on labelling, rotation, tile caching and 3D extrusion once multiple malls and offline packages are in play.

### Cited Findings
- `maplibre/maplibre-react-native` — "Interactive vector tile maps with MapLibre Native" for Expo and React Native on Android/iOS; MIT; 676 stars; 3,215 commits; fork of rnmapbox/maps split when SDKs diverged; latest release v11.5.1 on 2026-10-29. — [GitHub maplibre-react-native](https://github.com/maplibre/maplibre-react-native); [Releases](https://github.com/maplibre/maplibre-react-native/releases)
- `maplibre/martin` — "Blazing fast and lightweight PostGIS, MBtiles and PMtiles tile server"; Rust; dual MIT / Apache-2.0; 4.1k stars; auto-discovers PostGIS tables and functions (function sources), serves PMTiles (local or HTTP), MBTiles, GeoJSON, GeoParquet (unstable), composite sources, styles, on-the-fly sprites and font glyphs; 1.0.0 released 19 Nov 2025 with later 2026 releases; requires PostGIS ≥ 3.0 (3.1+ recommended). — [GitHub martin](https://github.com/maplibre/martin); [lib.rs martin](https://lib.rs/crates/martin); [docs.rs martin 1.14.0](https://docs.rs/crate/martin/1.14.0)
- `CrunchyData/pg_tileserv` — "A very thin PostGIS-only tile server in Go"; Apache-2.0; 1.1k stars; table layers + function layers (`z,x,y` → MVT bytea); no caching/pre-generation; no archival notice but 37 open issues. — [GitHub pg_tileserv](https://github.com/CrunchyData/pg_tileserv)
- `felt/tippecanoe` — builds MBTiles/PMTiles from GeoJSON/FlatGeobuf/CSV; BSD-2-Clause; ~1.6k stars; C++17; maintained by Erica Fischer at Felt; feature-dropping/coalescing, `tile-join`, `tippecanoe-overzoom`; v2.0.0 ≡ Mapbox 1.36.0. — [GitHub tippecanoe](https://github.com/felt/tippecanoe)
- A master's-thesis benchmark compares six OSS tile servers including Martin and pg_tileserv on PostGIS in Docker. — [vector-tiles-benchmark](https://awesome.ecosyste.ms/projects/github.com%2FFabianRechsteiner%2Fvector-tiles-benchmark)
- `map-gl-indoor/map-gl-indoor` — "A Mapbox plugin to enable multi-floors maps"; MIT; 101 stars; 187 commits; WIP; ingests GeoJSON from SIT-tagged OSM via osmtogeojson, derives min/max levels from `level` tags, shows only features on current level; `addIndoorTo(map)`, `IndoorMap.fromGeojson`, `IndoorControl`; "should works with maplibre-gl-js too". — [GitHub map-gl-indoor](https://github.com/map-gl-indoor/map-gl-indoor)
- `maplibre-gl-indoorequal` (BSD-3, 46 stars) — level control + `setLevel()`; accepts own tile URL or GeoJSON. — [GitHub maplibre-gl-indoorequal](https://github.com/indoorequal/maplibre-gl-indoorequal)
- Floor switching pattern used by SDK vendors is a layer filter on a level attribute, e.g. `map.setFilter('indoor', ['==', ['get','layer'], floor])`. — [Wemap docs](https://developers.getwemap.com/docs/web/js-sdk/map/map-indoor)
- MapLibre GL JS ships an official "Extrude polygons for 3D indoor mapping" example using a floorplan GeoJSON and `fill-extrusion`. — [MapLibre example](https://maplibre.org/maplibre-gl-js/docs/examples/3d-extrusion-floorplan/)
- A 2024 Japanese talk documents implementing interactive indoor maps with MapLibre directly from IMDF GeoJSON. — [Speaker Deck](https://speakerdeck.com/kyotonagoya/implementing-interactive-indoor-maps-with-maplibre-and-imdf)
- Panoramax web viewer documents indoor-map support (level-filtered MapLibre layers) as a reusable pattern. — [Panoramax indoor maps](https://docs.panoramax.fr/web-viewer/tutorials/indoor_maps/)
- Mapbox GL JS has a first-party indoor guide (floor switching), but it is Mapbox-licensed, not MapLibre. — [Mapbox indoor guide](https://docs.mapbox.com/mapbox-gl-js/ja/guides/indoor/)

### Inferences
- A Kotlin/PostGIS backend can expose each venue as Martin function sources (SQL functions taking `z,x,y` plus a `level` or `venue_id` query param) with zero extra services; for the offline "venue cache" already in the mobile app, tippecanoe can bake each venue's GeoJSON into a PMTiles file bundled in the map package, which MapLibre Native reads locally.
- Floor switching should be implemented as a `level` property on every feature plus style filters (or per-level source-layers), mirroring indoorequal's `area.level` / `poi.level` schema, so the same tiles work in web (dashboard) and RN.
- Keeping the SVG renderer is reasonable until (a) >1 venue, (b) rotation/heading-up navigation, or (c) label collision becomes painful; MapLibre RN v11 is a lower-risk migration now that it has a 2026 release cadence and Expo support.

### Gaps
- maplibre-react-native's exact supported Expo SDK and New Architecture status were not stated on the fetched pages.
- No published 2025/2026 head-to-head throughput numbers for Martin vs pg_tileserv were retrieved (thesis results not read).
- Whether map-gl-indoor has had commits since 2023 could not be determined.

---

## KQ5. Routing-graph generation from polygons: centerlines / medial axis / navigation mesh / visibility graphs and OSS libraries (CGAL, PostGIS SFCGAL, pgRouting)

### Takeaway
PostGIS already contains the needed primitive: `CG_ApproximateMedialAxis` (SFCGAL, PostGIS 3.5+; the older `ST_ApproximateMedialAxis` is deprecated) derives a pruned straight-skeleton centerline from walkway polygons, which can be noded into a pgRouting edge table with per-floor/vertical-connector edges and inner-query filters for step-free/one-way; for TypeScript the `straight-skeleton` npm package wraps CGAL via WASM (MIT), and Python offers `pygeoops.centerline` and Voronoi-based `centerline`. Licensing caveat: CGAL itself is GPL/LGPL mixed, and the straight-skeleton package licence must be checked before shipping it inside proprietary binaries.

### Cited Findings
- `CG_ApproximateMedialAxis` — available from PostGIS 3.5.0; requires SFCGAL backend (SFCGAL ≥ 1.2.0 uses a dedicated API, older builds wrap CG_StraightSkeleton and are slower); approximates the medial axis from the straight skeleton; preserves Z. — [PostGIS docs CG_ApproximateMedialAxis](https://postgis.net/docs/CG_ApproximateMedialAxis.html)
- `ST_ApproximateMedialAxis` is deprecated as of 3.5.0 in favour of `CG_ApproximateMedialAxis`; requires SFCGAL; ignores Z (2D result in 3.5 manual). — [PostGIS docs ST_ApproximateMedialAxis](https://www.postgis.net/docs/ST_ApproximateMedialAxis.html)
- Wherobots' implementation notes: branches are pruned when penetration depth is < 20% of the corner width they bisect; "significant performance limitations" on polygons with very many vertices. — [Wherobots docs](https://docs.wherobots.com/reference/wherobots-db/geometry-data/processing/ST_ApproximateMedialAxis)
- pgRouting: standard edge table `id, source, target, cost, reverse_cost` with `pgr_dijkstra` taking an inner edges SQL query — floor/building columns can be filtered in that inner query; for multi-floor topology use `pgr_createTopology` per floor or with a tolerance smaller than inter-floor distance. — [pgRouting concepts](https://access.crunchydata.com/documentation/pgrouting/3.7.1/pgRouting-concepts.html); [Stack Overflow via kiwix](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/61269530/pgrouting-within-a-isolated-boundary)
- CGAL "2D Straight Skeleton and Polygon Offsetting": weighted skeletons of polygons with holes, interior/exterior skeletons, offset polygons, extrusion; skeleton construction is much slower than offsetting; recommended kernel EPICK. CGAL ≥ 4.0 is distributed under GPL for some packages and LGPLv3+ for others — the package's own LICENSE must be checked. — [CGAL Straight_skeleton_2](https://doc.cgal.org/latest/Straight_skeleton_2/index.html); [CGAL licence](https://www.cgal.org/license.html)
- `straight-skeleton` (StrandedKitty, npm `straight-skeleton`) — TypeScript wrapper of CGAL's straight skeleton compiled to WebAssembly; MIT (as declared by the repo); 90 stars; `SkeletonBuilder.buildFromGeoJSON` / `buildFromPolygon`; outer rings CCW, holes CW. — [GitHub straight-skeleton](https://github.com/StrandedKitty/straight-skeleton); [npm README](https://cdn.jsdelivr.net/npm/straight-skeleton@3.0.0/README.md)
- `rianonehub/straight-skeleton` — TypeScript port of a C# implementation; GeoJSON multipolygon input. — [GitHub](https://github.com/rianonehub/straight-skeleton)
- Python: `pygeoops.centerline` computes a centerline/medial axis with branch cleanup, densification and simplification parameters (PyPI/conda-forge); `centerline` 1.1.1 builds Voronoi-based centerlines (depends on NumPy/SciPy/GDAL); `shapely-polyskel` exposes straight-skeleton ridges/sinks. — [pygeoops docs](https://pygeoops.readthedocs.io/en/stable/api/pygeoops.centerline.html); [PyPI centerline](https://pypi.org/project/centerline); [GitHub shapely-polyskel](https://github.com/vec2pt/shapely-polyskel)
- Rust crate `straight-skeleton` computes skeletons on an integer lattice. — [docs.rs](https://docs.rs/straight-skeleton)
- Academic: SURFER2 is reported as "the fastest and most general straight-skeleton code available". — [On Implementing Straight Skeletons (PDF)](https://core.ac.uk/download/326319667.pdf)
- No Java/JVM straight-skeleton library surfaced in search results (JTS/GEOS lack a straight-skeleton/medial-axis operator). — [search summary; see Gaps]

### Inferences
- Recommended pipeline for the Kotlin/PostGIS stack: walkway polygons (IMDF `walkway` units / SIT `corridor`) per level → `ST_SimplifyPreserveTopology` → `CG_ApproximateMedialAxis` → `ST_Node`/`ST_LineMerge` → snap door `Opening` midpoints and POI entrances to the nearest skeleton edge → insert vertical connector edges (stairs/escalator/elevator units) with attributes `step_free`, `one_way`, `schedule` → `pgr_createTopology` → `pgr_dijkstra` with an inner query that drops non-step-free or closed edges. This keeps generation inside Postgres (no JVM geometry library gap) and produces exactly the edge list the current map-package contract expects.
- The TypeScript `straight-skeleton` WASM package makes it possible to preview auto-generated corridors live in the Next.js editor before committing to the DB.
- Visibility graphs / nav-meshes are better suited to open atria than skeletons (skeletons zig-zag in wide halls); a hybrid — skeleton for corridors, polygon-centroid + visibility edges inside large open units — is a reasonable follow-on but no off-the-shelf PostGIS tool for visibility graphs was found.

### Gaps
- The CGAL Straight_skeleton_2 package licence (GPL vs LGPL) was not stated on the fetched manual page; since the WASM wrapper embeds CGAL, its effective licence depends on this — verify in CGAL's LICENSE file.
- No worked example of multi-floor pgRouting with stairs/elevators as edges was found; the design above is inferred.
- No benchmark of `CG_ApproximateMedialAxis` on venue-scale polygons was found.
- Visibility-graph / nav-mesh OSS options (e.g. recast-navigation JS bindings, pyvisgraph) were not researched.

---

## KQ6. Operator dashboards: adaptable open-source map/venue admin UIs and geodata CMSs

### Takeaway
No open-source venue CMS exists to adopt wholesale; the realistic options are (a) build the Next.js dashboard with MapLibre GL JS + Terra Draw and talk to the Kotlin API, (b) bolt a headless CMS on Postgres — Directus has native geometry/GeoJSON map fields and a map layout, Payload has only a Point field — for tenant/POI/hours administration, or (c) embed iD/OsmInEdit (ISC) against private OSM-XML if the team adopts SIT tagging internally.

### Cited Findings
- Directus stores geospatial data in map-type fields supporting point and "Geometry (All)" types, with a Map interface and a Map Layout in the content module (Directus TV "Uncharted Territory" series; interfaces reference). — [Directus TV: GeoJSON fields](https://directus.io/tv/uncharted-territory/geojson-fields); [Directus interfaces](https://directus.com/docs/raw/guides/data-model/interfaces.md)
- Payload CMS has a built-in `point` field storing `[longitude, latitude]` GeoJSON-style with `within`/`intersects` queries; not supported on SQLite; a full GeoJSON (polygon) field has been a roadmap discussion since 2021. — [Payload Point field](https://payloadcms.com/docs/fields/point); [Payload discussion #296](https://www.github.com/payloadcms/payload/discussions/296)
- iD — ISC, 3.9k stars, JS, published on npm as `@openstreetmap/id`, monthly releases. — [GitHub iD](https://github.com/openstreetmap/iD)
- OsmInEdit — ISC web indoor editor (SIT), 36 stars. — [GitHub OsmInEdit](https://github.com/PanierAvide/OsmInEdit)
- OpenIndoorMaps claims a "customizable admin panel" but is pre-alpha with the editor still planned. — [GitHub OpenIndoorMaps](https://github.com/openindoormaps/openindoormaps)
- indrz exposes a Django REST API and Vue/Nuxt frontend for indoor maps and routing directions. — [GitHub indrz](https://github.com/indrz/indrz)
- Terra Draw (MIT, 1.1k stars) provides drawing + select/edit modes across MapLibre/Leaflet/OpenLayers/Google. — [GitHub terra-draw](https://github.com/JamesLMilner/terra-draw)
- gisbee is an open-source geospatial CMS but the listing does not mention indoor maps. — [gisbee](https://gisbee.sourceforge.io)
- Search for "open source IMDF editor / venue CMS" returned only commercial products (Mappedin, Gevme, Seatmap.pro). — [Mappedin map editor](https://info.mappedin.com/map-editor)

### Inferences
- Since geometry editing with level awareness, snapping doors to unit boundaries and graph editing are the hard parts and no CMS covers them, the dashboard's map editor should be custom (MapLibre + Terra Draw); Directus is the only CMS with usable polygon geometry fields and could handle non-spatial operator tasks (tenants, opening hours, promotions) pointed at the same Postgres, but it would need to coexist with the Kotlin schema.
- Terrastories and Nominatim-style tooling (mentioned in the brief) were not found relevant: neither targets indoor polygons or multi-level editing.

### Gaps
- Directus's exact PostGIS behaviour (native `geometry` column vs. JSON) was not confirmed.
- Terrastories was not researched in this pass; no evidence found that it suits venue admin.

---

## KQ7. Legal/practical: floor-plan rights with mall owners; what OSM already has for major shopping centres (South Africa)

### Takeaway
Floor plans and rendered mall maps are copyrightable (thin protection in the US for plans; rendered maps and, in the EU, map databases are protected) and the rights usually sit with the architect/designer unless assigned; the practical industry and OSM-community norm is to obtain written permission from the mall operator, who in practice "nearly always" agrees, and to survey rather than trace third-party maps. OSM holds essentially no indoor data for South African malls (8 `indoor=*` ways in the Sandton City bbox), and Sandton City / Eastgate run proprietary ViaDirect wayfinding.

### Cited Findings
- US: the 1990 Architectural Works Copyright Protection Act extended copyright to constructed buildings; courts have split — an Eighth Circuit decision suggested pictorial floor-plan reproductions of a built building may infringe, while another federal ruling found real-estate floor plans to be fair use; protection for floor plans is described as "thin". — [Phelps: two recent cases](https://phelps.com/insights/courthouse-reporter-series-two-recent-cases-address-copyright-protection-for-architectural-works.html); [Florida Realtors](https://www.floridarealtors.org/news-media/news-articles/2023/10/federal-court-floor-plans-fall-under-fair-use); [Virginia Realtors](https://virginiarealtors.org/2023/10/17/floor-plans-and-copyrights/)
- Ownership defaults to the original designer (often the architect) unless transferred; a work-for-hire clause alone may not transfer it. — [McDonald Hopkins](https://www.mcdonaldhopkins.com/insights/news/do-you-own-your-store-design-or-does-your-contractor)
- OSM community thread on mall maps: rendered maps are copyrightable independently of underlying facts; tracing store shapes is likely derivative; EU database rights may cover wholesale copying of map data; participants recommend asking mall management, who likely dictated the map content; linking to the mall map in an OSM note is fine. — [OSM community: use of shopping mall online maps](https://community.openstreetmap.org/t/use-of-shopping-mall-online-maps/97778)
- OSM legal-talk (2023) on layouts: rendered maps "definitely would be copyrightable" independently of the underlying data. — [OSM legal-talk Jan 2023](https://lists.openstreetmap.org/pipermail/legal-talk/2023-January/009186.html)
- A mapper who did indoor mapping at malls and stations reported management "nearly always accepted" when asked for permission to use the indoor plan. — [OSM help: floor plans copyright](https://help.openstreetmap.org/questions/32198/floor-plans-copyright/)
- Reddit r/openstreetmap (Mar 2025) discussed using posted emergency evacuation maps as an indoor-mapping source (community opinion, not legal guidance). — [r/openstreetmap thread](https://lr.in.psf.lt/r/openstreetmap/comments/1j7ul2b/using_emergency_maps_for_indoor_mapping)
- Sandton City bbox Overpass count on 2026-11-14: 8 `indoor=*` ways, 0 nodes, 0 relations. — [Overpass API](https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3Bnwr%5B%22indoor%22%5D%28-26.112%2C28.048%2C-26.102%2C28.062%29%3Bout%20count%3B)
- Sandton City uses ViaDirect kiosks + mobile map with QR entry points; ViaDirect also serves Eastgate. — [ViaDirect Sandton City](https://viadirect.com/sandton-city-advanced-digital-wayfinding/); [ViaDirect African centres](https://viadirect.com/digital-wayfinding-african-shopping-centres-sandton-city-eastgate/)
- MapIT (South Africa) reportedly built indoor maps for 65 malls and nine airports (TechCentral). — [TechCentral](https://techcentral.co.za/?p=187718)
- Mappedin publishes a mall-solutions info pack describing its data-licensing/commercial model for malls (commercial comparator). — [Mappedin Mall Solutions (PDF)](https://info.mappedin.com/hubfs/info-packs/Mappedin-Mall-Solutions-Info.pdf?hsLang=en)

### Inferences
- The pragmatic contract for a startup: a written licence from the mall operator granting (i) use of CAD/lease plans as a *source* and (ii) the right to publish a *derived* vector map in the app, with the startup owning the derived graph/POI database; survey-based corrections and LiDAR spot-scans are rights-clean regardless. Avoid tracing competitor kiosks' rendered maps.
- Because OSM has no usable indoor data for SA malls and operators are unlikely to agree to ODbL publication, OSM should be treated as a schema/tooling source rather than a data source for this market.
- Existing ViaDirect/MapIT contracts at flagship malls (Sandton City, Eastgate) mean the startup should expect exclusivity questions when negotiating data access; secondary malls without digital wayfinding are the easier first targets.

### Gaps
- No South-African-law source on architectural-works copyright or on mall-map licensing was found; the legal findings are US/EU/OSM-community commentary and are not legal advice.
- A national count of OSM indoor features for South Africa could not be obtained (Overpass timeouts); other SA malls (Mall of Africa, Gateway, Canal Walk, V&A Waterfront) were not individually queried.
- Whether Sandton City is among MapIT's 65 mapped malls, and the terms of ViaDirect's data ownership, were not found.
