def build_pages(fund):
 pages=[]
 def page(title,strap='',mode='portrait'):
  p={'title':title,'strap':strap,'mode':mode,'blocks':[]};pages.append(p);return p
 def para(p,t):p['blocks'].append(('p',t))
 def sub(p,t):p['blocks'].append(('h',t))
 def bullets(p,x):p['blocks'].append(('b',x))
 def table(p,h,r,w=None):p['blocks'].append(('t',(h,r,w)))
 def image(p,rel,caption,cover=False):p['blocks'].append(('coverimage' if cover else 'image',(rel,caption)))
 def note(p,t):p['blocks'].append(('n',t))
 def rand(n):return f'R{n:,.0f}'

 p=page('A clearer journey.\nA smarter venue.','R100,000 FUND APPLICATION / 12-MONTH DEVELOPMENT PLAN')
 para(p,'Atlas connects indoor navigation, privacy-aware venue intelligence and relevant store discovery in one spatial platform.')
 image(p,'mockups/imagegen/atlas-mobile-discovery.png','AI-generated product concept. Central Arcade and its stores are fictional; this is a proposed interface, not a live app screenshot.',True)
 sub(p,'One app for visitors. One clearer view for operators.')
 para(p,'The requested fund will support a focused, founder-led proof of concept using the existing Atlas code foundation. The 12-month programme will produce a bounded navigation experience, aggregate analytics and a testable sponsored-discovery workflow.')
 note(p,'Application pending. The proposed allocation is R86,000 in direct costs plus R14,000 held as contingency. Founder time is an in-kind contribution. Prepared 28 October 2026.')

 p=page('What the fund will make possible','A focused proof of concept over twelve months')
 para(p,'Atlas addresses a familiar gap in complex indoor venues: visitors can find the building but still struggle to find a particular store, service or route inside it. At the same time, venue operators have limited visibility into how app-assisted journeys connect search demand, navigation and the use of space.')
 table(p,['Audience','Value','12-month proof'],[
  ['Visitors','Find a store, understand the route and navigate with clear floor and destination context.','A bounded venue map, search, route preview and guided test journey.'],
  ['Venue operators','Understand aggregate app-observed activity, route completion, dwell and search demand.','A sample-aware analytics dashboard with visible data quality.'],
  ['Stores','Appear during relevant searches and route planning, with transparent delivery reporting.','Labelled sponsored cards and a testable impression/budget ledger.']
 ],[85,215,211])
 sub(p,'The request')
 para(p,'R100,000 over 12 months will pay for direct development and validation costs: hosting, site work, test equipment, limited specialist assistance, privacy/documentation work and participant recruitment. It is a development grant application; no award or customer income is secured.')
 sub(p,'Delivery assumptions')
 bullets(p,['The founder supplies core product and engineering effort in kind, using the existing repository and available development tools. The allocation contains no full-time payroll.','Scope is one concept venue and, if permissions and access are obtained, a limited real-world test area. Map rights and venue participation must be secured.','The first analytics view can operate on explicitly labelled replay/test data while approved, consented field evidence is collected.','A national rollout, continuous store-level positioning, new building-wide sensors and autonomous digital-twin operations are outside this funding scope.'])

 p=page('Find the place. See the possibilities.','MOBILE CONCEPT / MAP AND SPONSORED SEARCH')
 image(p,'mockups/imagegen/atlas-mobile-discovery.png','Image-generated Atlas mobile concepts: a map-first home screen and a relevant sponsored coffee result alongside visible organic alternatives. Venue geometry and businesses are illustrative.')
 table(p,['Design decision','Purpose'],[
  ['Map-first home','Keep location, floor and indoor context visible; place search within easy reach.'],
  ['Labelled sponsored discovery','Give stores relevant visibility while preserving a clear organic choice.'],
  ['Consistent Atlas identity','Navy typography, pale cartography and a restrained cobalt accent make the journey legible.']
 ],[155,356])

 p=page('A route that stays understandable','MOBILE CONCEPT / ROUTE PREVIEW AND GUIDANCE')
 image(p,'mockups/imagegen/atlas-mobile-navigation.png','Image-generated proposed route preview and guidance screens. A store can be promoted along the route; adding it as a stop is an explicit visitor choice. No advertisement interrupts the guidance screen.')
 para(p,'The preview brings destination, walking time and a nearby store offer into one readable surface. Active guidance gives the next instruction priority. The concept recommends keeping route geometry unchanged unless a visitor selects an additional stop; that policy must be resolved against the older commercial-routing specification before implementation.')
 note(p,'These are product-direction visuals. They do not establish actual location accuracy, surveyed mapping, working native guidance or an existing store partnership.')

 p=page('Make the activity meaningful','MOVEMENT INTELLIGENCE / OBSERVED DATA FIRST')
 table(p,['Measure','Definition','How it helps'],[
  ['Atlas-observed sessions','Eligible app sessions within the reporting venue/window.','Measures app use; does not represent all mall visitors.'],
  ['Zone activity','Valid zone entry and exit events, deduplicated and filtered for quality.','Shows which reporting areas receive observed activity.'],
  ['Dwell','Time between reliable entry and exit observations, excluding gaps and implausible fixes.','Compares distributions; passing a store is not a verified store visit.'],
  ['Route completion','Completed eligible routes divided by route starts in the same scope.','Exposes wayfinding friction; completion is not a purchase.'],
  ['Search demand','Queries, store selections and route starts with explicit denominators.','Finds discovery demand and directory gaps.'],
  ['Whole-venue estimates','A later calibrated product requiring independent reference counts and validation.','Not inferred by multiplying a small app sample by a fixed factor.']
 ],[105,230,176])
 sub(p,'Every metric needs context')
 para(p,'The operator view shows the reporting period, sample size, source and excluded low-confidence records. Where coverage is inadequate, the report remains an Atlas-observed sample. Predictions, counter-based estimates and raw observations must be presented as different kinds of evidence.')
 sub(p,'Privacy is part of the product')
 para(p,'Proposed dashboards expose aggregate patterns rather than individual visitor trails. Small-cohort suppression, access boundaries, retention and query/export restrictions must be implemented and tested before any real venue data is shared.')

 p=page('Movement overview','DASHBOARD CONCEPT / AGGREGATE ACTIVITY, DWELL AND DATA QUALITY','landscape')
 image(p,'mockups/screens/dashboard-analytics.png','Concept dashboard with illustrative data: 1,248 Atlas-observed sessions, 18.4-minute median dwell, 84% route completion and eight reporting zones. These are design examples, not measured Atlas or whole-mall results.')

 p=page('Store visibility, measured','DASHBOARD CONCEPT / BUDGETS, DELIVERY AND VENUE SHARE','landscape')
 image(p,'mockups/screens/dashboard-advertising.png','Illustrative campaign reporting distinguishes a R18,750 budget ceiling from R2,096 delivered spend and a R629 venue share. Budget that has not been delivered is not revenue; the examples are rounded.')

 p=page('The revenue model','VENUE SOFTWARE + ANALYTICS + DELIVERED MEDIA')
 table(p,['Stream','Proposed commercial hypothesis','Validation required'],[
  ['Core venue software','R18,000 per venue-month for maps, directory, routes and basic operational reporting.','Buyer interviews, procurement scope and paid willingness to adopt.'],
  ['Analytics upgrade','Additional R12,000 per venue-month for spatial analysis, comparisons and quality-aware reporting.','Useful operator decisions, sufficient sample quality and adoption.'],
  ['Commercial onboarding','R60,000 for agreed map preparation, calibration and launch scope.','Actual deployment costs and venue-specific requirements.'],
  ['Sponsored search','Proposed R180 CPM on valid delivered search-card impressions.','Relevant audience, viewability, approved creative and retailer demand.'],
  ['Sponsored route cards','Proposed R140 CPM on valid route-preview cards; explicit add-stop action.','Safe presentation and a verified delivery ledger.']
 ],[105,235,171])
 para(p,'These are future commercial price hypotheses, not signed contracts or guaranteed receipts. The R100,000 use-of-funds plan assumes no customer revenue so that delivery of the funded scope does not depend on early sales.')
 sub(p,'Why advertising scales with adoption')
 para(p,'At an illustrative 20,000 app sessions per venue-month, the earlier base inventory assumptions produce roughly R2,096 in gross media delivery. After a 30% venue share, Atlas retains about R1,467 before servicing, hosting, sales and other costs. A R18,750 retailer budget ceiling does not create R18,750 of earned revenue when there is insufficient eligible inventory.')
 bullets(p,['Bill delivered impressions once, only after eligibility, visibility and deduplication checks.','Apply campaign dates, budget caps, relevance and frequency limits on the server.','Report clicks and destination choices separately; do not present them as purchases or proven incremental sales.'])

 p=page('A twelve-month delivery programme','MONTHS BEGIN AT THE AGREED PROJECT START AFTER AWARD')
 table(p,['Period','Work package','Reviewable output'],[
  ['Months 1-3','Confirm scope, fund conditions and venue/map rights; review existing code; prepare one map and test-device setup.','Prioritised backlog, permitted test map, privacy/consent design and baseline journey.'],
  ['Months 4-6','Connect bounded search and routing; strengthen navigation states and event validation; test on available physical devices.','Usable alpha journey, task results and replayable telemetry with quality labels.'],
  ['Months 7-9','Build aggregate analytics views and managed sponsored search/route concepts; implement/test impression and budget logic.','Dashboard reports, replay reconciliation and a campaign-delivery test ledger.'],
  ['Months 10-12','Conduct approved small-scale usability and venue tests; gather operator/retailer feedback; revise assumptions and prepare follow-on materials.','Evidence pack, evaluated prototype, cost report, commercial feedback and next-stage plan.']
 ],[85,235,191])
 sub(p,'Prioritisation within the funding envelope')
 para(p,'The navigation journey, reliable event pipeline and aggregate reporting come first. Advertising begins as managed test delivery. If venue permissions or positioning quality delay field work, the team can still evaluate navigation on a permitted schematic and validate the analytics/billing logic with labelled replays. That fallback proves workflow correctness; it does not prove real-world adoption or accuracy.')
 sub(p,'Completion means evidence')
 para(p,'Each stage ends with a working demonstration or a documented test result rather than only a presentation. A final report will distinguish code checks, replay/simulated evidence, physical-device tests and any real venue observations. The mockups in this document communicate the intended product experience.')

 p=page('Use of the R100,000 fund','DIRECT COSTS AND AN EXPLICIT CASH RESERVE')
 purposes=[
  'Hosting, storage and observability during development and evaluation.',
  'Permitted site visits, map preparation and limited calibration work.',
  'Test-device access, accessories and necessary device purchases.',
  'Limited specialist help for defined technical gaps and reviews.',
  'Consent materials, agreements and information-handling documentation.',
  'Consenting usability participants and venue-approved test materials.'
 ]
 rows=[[x['name'],rand(x['total']),purpose]for x,purpose in zip(fund['categories'],purposes)]
 rows +=[['Planned direct expenditure',rand(fund['directSpend']),'Cash scheduled across twelve months.'],['Contingency held unspent',rand(fund['reserve']),'Reserved for approved changes; not a committed expense.'],['Total requested',rand(fund['requested']),'R86,000 direct costs + R14,000 retained reserve.']]
 table(p,['Allocation','Amount','Purpose'],rows,[190,75,246])
 para(p,'These are indicative gross cash allowances, including VAT where charged. They must be reconciled to fund eligibility rules and quotations before submission. The fund name, permitted categories and disbursement schedule have not been supplied; this document does not invent those conditions.')
 para(p,'Founder product and development work is contributed in kind and has not been assigned an invented cash value. There is no funded full-time payroll, rent allowance or assumed new building-wide sensor installation. The scoped programme depends on that in-kind capacity and on access to a suitable test area.')

 p=page('Twelve-month cash plan','A FUNDED PLANNING CASE, NOT AN AWARD CONFIRMATION')
 table(p,['Period','Assumed fund receipt','Planned direct spend','Closing project cash'],[[f"Month {x['month']}",rand(x['receipt']),rand(x['spend']),rand(x['closingCash'])]for x in fund['monthly']],[85,145,145,136])
 para(p,'For planning, the workbook assumes the full R100,000 is received in month 1. At month 12, R86,000 has been spent and R14,000 remains as the contingency reserve. No customer receipts or reserve draw are forecast. Month 1 is relative to the agreed project start, not a confirmed calendar date.')
 para(p,'The editable workbook lets the receipt month move or the assumed award switch off. If funding arrives later than planned expenditure, it exposes the temporary cash gap rather than inserting unapproved borrowing or extra founder cash. Actual fund instalments should replace the receipt assumption once terms are known.')
 note(p,'This is a cash use-of-funds plan. It does not determine grant income recognition, tax treatment, fund eligibility or the eventual cost of a scaled business.')

 p=page('What success will look like','PROPOSED TARGETS TO AGREE BEFORE TESTING')
 table(p,['Area','Target / evidence','If the evidence is weak'],[
  ['Navigation','At least 50 predefined physical-device tasks with at least 20 consenting participants; target 90% correct destination completion without staff rescue.','Repair geometry or guidance, narrow the coverage and record failures.'],
  ['Telemetry and reports','Replay at least 500 known test events; deduplicate every repeated event ID; reconcile known zone and route aggregates.','Repair ingestion/rollups before exposing real reports.'],
  ['Advertising integrity','Every sponsor labelled; no duplicate billing; no spend above the approved budget; explicit add-stop behaviour.','Keep delivery in test mode until the ledger and controls reconcile.'],
  ['Privacy and access','Test refusal/reset, venue access boundaries and suppression; dashboards disclose sample scope and excluded records.','Stop affected collection or sharing until controls work.'],
  ['Commercial learning','Seek one written venue collaboration interest and two retailer feedback/interest letters; record objections to the price and product.','Revise the offer and target customer; do not convert interest into revenue.']
 ],[95,245,171])
 para(p,'These are programme targets, not achieved outcomes. The limited study may validate usability and data/reporting correctness without establishing causal sales lift, whole-mall coverage or continuous indoor precision. Any larger field deployment and its hardware requirements require separate permission, costing and evidence.')
 sub(p,'Decision at month 12')
 para(p,'Use the final evidence pack to decide whether to extend testing, pursue a paid venue engagement or seek follow-on support. Report actual cash use and remaining reserve, revise the revenue assumptions and identify the narrowest next commercial milestone.')

 p=page('Build from the existing foundation','CLEAR STATUS AND RESPONSIBLE PRODUCT BOUNDARIES')
 table(p,['Area','Present in the repository','Funded direction'],[
  ['Consumer app','React Native / Expo screens, maps and demo navigation presentation.','A connected, tested bounded journey.'],
  ['Platform services','Kotlin search, routing, map packages and event-ingestion foundations.','Authenticated integration and validated telemetry.'],
  ['Analytics','Event catalogue and aggregation-job scaffold; rollup queries remain unfinished.','Zone, dwell, usage and route report calculations with quality gates.'],
  ['Operator dashboard','Next.js shell; diagrams describe a broader B2B direction.','Usable aggregate reports represented by these mockups.'],
  ['Advertising','Concept and event names; operational delivery/billing engine remains work.','Managed search/route test campaigns and verifiable budgets.']
 ],[100,225,186])
 para(p,'The concept venue and businesses in the images are fictional. Mobile plates were created with image generation for presentation; dashboards were rendered from editable interface mockups. All displayed analytics and media figures are illustrative. No mockup establishes a venue partnership, production deployment or measured operational outcome.')
 sub(p,'Privacy and routing decisions')
 para(p,'Define permitted data use, consent choices, retention, deletion/reset and responsible roles before collecting real location events. Rotating identifiers are not automatically anonymous. Keep operator views aggregate, restrict fine-grained exports and give advertisers campaign summaries rather than visitor trails. Resolve the older silent-detour policy before any advertising influences a real journey.')

 p=page('Evidence and next steps','A PRODUCT DIRECTION THAT CAN BE REVIEWED AND TESTED')
 bullets(p,[
  'Confirm the fund programme, eligible costs, reporting duties, instalment dates and required application format. The request in this document is R100,000 for twelve months.',
  'Confirm founder availability, obtain supplier quotes and secure venue/map permissions before committing expenditure.',
  'Use the four mobile concepts and two dashboards to collect specific visitor, operator and retailer feedback on the proposed flows.',
  'Update the grant cash plan with actual release dates and approved spending; retain evidence of tests and cash use throughout delivery.'
 ])
 sub(p,'Sources and asset provenance')
 bullets(p,[
  'Funding amount and duration: user brief supplied 28 October 2026. All allocations are proposed assumptions.',
  'Atlas repository: techspec.md; apps/mobile/DESIGN_SYSTEM.md; apps/mobile/src/theme.ts; docs/atlas-b2b/README.md; dashboard, service and event source files. Repository source identifies a foundation, not field proof.',
  'Mobile imagery: built-in ImageGen, using Atlas-specific prompts saved with the project. The second plate uses the first as a visual reference. Both depict fictional concept interfaces.',
  'Dashboard imagery: editable local HTML/CSS and schematic charts, rendered to PNG. The figures are visibly marked illustrative.',
  'Privacy reference: Protection of Personal Information Act 4 of 2013. https://www.justice.gov.za/legislation/acts/2013-004.pdf',
  'Advertising visibility reference: familiar display threshold from Google Active View, proposed as an internal measurement policy without accreditation claim. https://support.google.com/google-ads/answer/7029393?hl=en'
 ])
 note(p,'Prepared 28 October 2026. This version centres on the twelve-month fund application. Commercial prices and any subsequent rollout remain hypotheses to validate through the development programme.')
 return pages
