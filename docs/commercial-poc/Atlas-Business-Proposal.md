# Atlas commercial proof of concept

Business proposal, 12-week pilot and 36-month cashflow design. Prepared 28 October 2026. ZAR. All projections illustrative.

## The commercial proposition

Three customers, one spatial platform

Atlas helps visitors find stores, gives venue teams a usable view of how space is being used, and lets retailers reach shoppers during relevant searches and route planning. The consumer app is free. Venue contracts fund the platform; delivered advertising provides an additional income stream.

| Buyer | Product / commercial hypothesis | Proposed price, ex VAT |
| --- | --- | --- |
| Mall operator | Core: indoor directory, maps, multi-floor routes, map updates, operational usage dashboard. | R18,000 / venue / month |
| Mall operator | Intelligence upgrade: aggregate zone flows, dwell, search demand, quality labels and comparison reports. | Additional R12,000 / month |
| Mall operator | Initial map preparation, calibration and launch; scope agreed per venue. | R60,000 once |
| Pilot venue | One defined 12-week pilot, with written success criteria and access to reference counts. | R90,000 pilot fee |
| Retailer / agency | Managed sponsored search and route-preview cards; pay only for valid delivered impressions. | Search R180 CPM; routes R140 CPM |

### Why a venue would buy

The operator receives a maintained indoor navigation service and evidence for tenant discovery, signage, circulation and campaign decisions. A retailer receives visibility at a moment of intent and a transparent delivery report. The financial model does not assume that retailers pay separately for analytics already included in the operator contract.

### Commercial boundaries

- Core reports cover app adoption, searches and route reliability. The paid intelligence upgrade adds spatial analysis, subject to sufficient quality and sample sizes.
- Pilot and commercial onboarding are separate scopes; the model does not credit the pilot fee against onboarding. Test this term with buyers.
- Custom hardware installations, bespoke integrations, white-label licensing and autonomous digital-twin features require separate quotes and contribute no forecast revenue.
- All prices and demand assumptions require discovery interviews and a paid pilot. This is a proposed business design, not validated product-market fit.

## The end-to-end product experience

Search, navigate, understand and advertise

| User | Proof-of-concept journey | Evidence to retain |
| --- | --- | --- |
| Visitor | Choose venue; search a store/category; see a labelled sponsored result alongside an organic option; preview route; follow guidance; arrive. | Task completion, time, corrections and clear sponsor labels. |
| Visitor near a store | Preview route to the original destination; see one relevant nearby-store card; optionally add that store as a stop. | Explicit stop selection and original / chosen route comparison. |
| Venue manager | Open aggregate floor/zone views; compare peak periods; inspect source, sample size and freshness; choose one operational action. | Decision log and before/after measurements with comparison periods. |
| Retailer | Create store-linked campaign; choose search/route placement and dates; set budget; approve creative; inspect delivery and invoice. | Approval trail, valid impression ledger, spend and optional destination selections. |

### Suggested pilot screens

- Consumer: search results with a Sponsored label, neutral results, store details, route preview with a sponsor card, add-stop confirmation, guidance and arrival.
- Operator: venue overview, zone heatmap, flow pairs, dwell distributions, search demand, reference counts and data-quality warnings.
- Advertiser: campaign form, dates and budget, creative review, delivery report, pause control and invoice reconciliation.

### Routing policy to resolve before launch

The existing technical specification, section 7.5, permits silent sponsored influence within both 30 seconds and 5% extra distance. This proposal recommends a narrower pilot: route cards do not alter route geometry; adding a stop requires the visitor to select it. This is a proposed pilot policy, not an implemented change to the app or specification. Venue commercial terms must not override closures, access rules or user requirements.

The proof of concept is the commercial and pilot design in this package. No new working dashboard, ad-serving backend or field-verified positioning system has been built by this pass.

## Movement intelligence that can be trusted

Separate observations, estimates and predictions

| Metric | Definition and source | Decision / limitation |
| --- | --- | --- |
| Observed zone entries | Consenting Atlas sessions entering a zone, deduplicated by session, zone and reporting interval. | Compare app-observed demand; not a census of mall visitors. |
| Dwell | Elapsed time between valid entry and exit events; discard gaps, low-confidence fixes and implausible jumps. | Report median and distribution with exclusions; passing by is not a store visit. |
| Origin-to-destination flows | Aggregated transitions between zones or stores using reliable map/floor positions. | Find circulation patterns; suppress small cohorts and fine-grained exports. |
| Search-to-route funnel | Searches, result selections, route starts and completions, each with its own denominator. | Find unmet demand and navigation friction; completion is not a purchase. |
| Whole-venue count estimate | Combine independent entrance counts and validated sample calibration by entrance/time. | Show calibration method, uncertainty and reference periods. No uniform multiplier assumption. |
| Campaign outcomes | Viewable impressions, clicks, destination choices and optional consented arrival observations. | Descriptive attribution only. Incremental sales require experiments and retailer transaction data. |

### Instrument the evidence pipeline

Use existing event names such as zone.entered, zone.exited, dwell.completed, search.submitted, route.started and ad.impression. Carry event ID, venue/map version, timestamp, source and privacy state. Define proposed quality, freshness and calibration fields in the event contract before collecting pilot data. Deduplicate, quarantine invalid records and aggregate before any operator-facing query.

### Low coverage is visible

Show the observed sample count, reporting window, missing intervals and positioning quality beside each metric. If independent reference data or a representative sample is unavailable, display Atlas-observed activity only. If forecast or simulation features are later added, label them separately from measured state; exclude them from the first paid pilot promise.

## What exists and what the pilot must prove

Repository inspection on 28 October 2026

| Area | Current evidence in this repository | Pilot work still needed |
| --- | --- | --- |
| Consumer app | React Native / Expo app, indoor-map components, local search/navigation presentation and demo routes. | Real venue map, backend-linked journey, native device trials and reliability measurement. |
| Platform API | Kotlin routing, search, versioned map packages, admin endpoints and event-ingestion service source files. | Deployed authenticated integration, operational monitoring, privacy enforcement and load verification. |
| Event definitions | Product, spatial, advertising and quality event catalogue with privacy flags. | Actual client emission, schema validation, consent/reset handling and end-to-end delivery proof. |
| Analytics worker | Scheduled aggregation job scaffold with TODO rollup queries. | Implement zone, dwell, flow, usage and ad-delivery rollups; handle late/invalid events. |
| Venue dashboard | Next.js page explicitly identifies itself as a Phase 0 scaffold. | Operator reports, campaign operations, permissions and tenant isolation. |
| Digital twin / MAS | Concept architecture and diagrams in docs/atlas-b2b. | Later-stage research/product development; no sales or operational claims included here. |

### Implementation path

Consumer navigation and consented telemetry feed the platform API. Validation and storage retain venue/map context. The analytics worker creates aggregate reporting tables. The dashboard reads derived metrics with provenance and sample quality. The ad service returns eligible campaigns; a separate server-validated ledger reconciles visible delivery, spend caps, invoices and the venue share.

### Keep the pilot narrow

Build on the existing monorepo rather than starting another stack. A first deployment needs one known map, a functioning route journey, limited zones, a reference counter feed and managed campaigns. A mall-wide live twin, universal indoor accuracy and autonomous recommendations are later work. Source inspection in this pass is not current runtime, load-test or physical-device proof.

## Advertising operations and billing

A managed retailer service before self-service

| Placement | Eligibility and experience | Billing |
| --- | --- | --- |
| Sponsored search | Venue + category/query relevance, open store, approved campaign and available budget. One clearly labelled card; organic alternatives stay visible. | Valid viewable impression at proposed R180 / 1,000. |
| Route-preview sponsor | Store lies near the selected route; appropriate destination/category context. One labelled card before guidance; optional add-stop action. | Valid viewable card at proposed R140 / 1,000. A route calculation is not an impression. |

### Campaign lifecycle

Verify the retailer and its store/venue relationship; approve creative, dates and claims; allocate a budget ceiling by placement; reserve a small amount before serving; accept a deduplicated view event; finalise spend; release expired reservations; pause at the budget limit; reconcile invoices and venue-share statements monthly. Pilot ad operations are managed by Atlas staff, with approvals recorded.

### Proposed delivery controls

- Visibility policy: at least 50% of the card visible for one continuous second in a foreground app. This adopts a familiar display threshold; it does not imply MRC accreditation.
- Count a unique event once. Limit one impression per placement render; refresh only after a new eligible query/preview. Pilot frequency cap: three campaign impressions per rotating session per day.
- Server verifies campaign status, venue, placement, price, budget reservation and time window. Client-supplied advertiser or billing amounts are never authoritative.
- Use contextual targeting for the pilot. No bought identities, cross-venue tracking, inferred sensitive audiences or unsolicited marketing pushes.
- Advertisers see aggregate spend and engagement. Observed arrivals are optional diagnostics after quality/consent checks, never billed as verified purchases.

The forecast treats budgets as ceilings. Undelivered inventory is not charged. Prepaid balances, if later introduced, remain customer liabilities until delivery or refund and are not extra revenue.

## Advertising economics at realistic scale

A worked example for one commercial venue-month

The base year-2 illustration uses 20,000 commercial app sessions per venue-month, 15 participating stores and a R1,250 media budget ceiling per store. Inventory sell-through is 60%; invalid/duplicate delivery is 2%. These are hypotheses to measure, not measured Atlas performance.

| Calculation | Search | Route-preview |
| --- | --- | --- |
| Sessions with relevant activity | 60% x 20,000 | 45% x 20,000 |
| Candidate placement volume | 12,000 x 2 searches = 24,000 | 9,000 x 1 preview = 9,000 |
| Viewable, valid inventory | 24,000 x 65% x 98% = 15,288 | 9,000 x 60% x 98% = 5,292 |
| Sellable delivery at 60% fill | 9,172.8 impressions | 3,175.2 impressions |
| CPM and capacity value | R180 CPM -> R1,651 | R140 CPM -> R445 |
| Allocated budget ceiling | R18,750 x 65% = R12,188 | R18,750 x 35% = R6,563 |
| Delivered media revenue | Lower of budget and capacity: R1,651 | Lower of budget and capacity: R445 |

Total delivered media is about R2,096 per venue-month. The venue receives 30% (about R629); a 1.5% media servicing fee is about R31. Atlas retains about R1,436 before platform costs, sales, payroll and bad debt. The unused R16,654 of retailer budgets is neither revenue nor a receivable.

### Usage changes the opportunity

| App sessions / venue-month | Gross media at base rates and fill | Atlas after 30% share + 1.5% fee |
| --- | --- | --- |
| 5,000 | R524 | R359 |
| 20,000 | R2,096 | R1,436 |
| 40,000 | R4,191 | R2,871 |
| 100,000 | R10,478 | R7,178 |

This illustration assumes enough matching merchant demand at each volume. The workbook also applies placement-specific budget caps. At the example demand, only about 11.2% of available budget is delivered, so equal allocation would average about R140 per retailer, not R1,250. Distribution will depend on eligibility and demand; no retailer is guaranteed an equal share.

Advertising is useful ancillary revenue at pilot adoption. Selling large fixed monthly media packages before an audience exists would create undeliverable promises.

## The 12-week paid pilot

One venue, bounded coverage and explicit outputs

Select one cooperative mall with permission to use floorplans, one or two floors, 30-60 verified destinations, 6-10 reporting zones and existing entrance counts or an independent temporary counter. Recruit 8-12 retailers across a few categories. The venue is a candidate to secure, not an existing Atlas customer. November 2026 is a planning start that can move in the workbook.

| Period | Work and owner | Reviewable output |
| --- | --- | --- |
| Weeks 1-2 | Founder + venue contact: contract, information-processing roles, reference data access, site survey, baseline and consent design. | Signed scope, rights/access checklist, baseline plan and map validation. |
| Weeks 3-4 | Engineers + product: venue map, backend-linked search and routing, consent choices, event pipeline and correction flow. | Working test-device journey; replayable event records; map and closure checks. |
| Weeks 5-6 | Engineers + venue operations: aggregate zone/dwell/flow queries; quality labels; initial operator report. | Observed metrics and independent reference comparisons; suppression tests. |
| Weeks 7-8 | Engineers + commercial lead: managed campaign setup, search/route cards, budget ledger and billing report. | Approved retailer campaigns; sponsor-label and budget-limit evidence. |
| Weeks 9-10 | Venue operations + analyst function: recruit consenting users, run supervised and unsupervised sessions; measure corrections and adoption. | Device/task results, data coverage report, campaign delivery audit. |
| Weeks 11-12 | Founder + venue manager: one operational intervention, retailer feedback, paid-conversion negotiation and financial update. | Pilot evidence pack, reconciled results, revised model and go / extend / stop decision. |

### Pilot ownership

The model funds one founder, two engineers and a fractional design/product allowance during the first three months. The founder owns commercial and analyst tasks during the pilot; no additional full-time analyst or sales salary is hidden in the pilot budget. External map/calibration work and independent count provision are separately budgeted.

Continuous store-level precision is not assumed. Where positioning quality is inadequate, restrict analytics to larger zones or use explicit/manual anchors, and label the scope accordingly. Pilot campaign tests carry no forecast media income; the base case starts commercial media in month 5, after launch and billing validation.

## Pilot acceptance and decision gates

Targets to agree with the venue before data collection

| Area | Proposed minimum evidence / target | Decision if missed |
| --- | --- | --- |
| Wayfinding | 40 preplanned physical-device tasks across floors, busy/quiet times and closures; at least 90% reach correct destination without staff rescue. Record iOS/Android separately. | Repair map/positioning or narrow coverage; do not claim universal accuracy. |
| Zone reliability | At least 100 independently labelled entry/exit observations. Target >=85% correct zone classification; report denominator and confusion by zone. | Use larger zones or explicit anchors; withhold unreliable dwell. |
| Analytics correctness | Known replay sessions reconcile entries, exits and dwell within defined tolerances; event IDs deduplicate 100%; p95 ingestion-to-report under 5 minutes. | Fix pipeline; no commercial analytics report until reconciled. |
| Coverage / count estimate | Four weeks of reference counts across entrance/time strata; only publish total-footfall estimates after held-out median absolute percentage error <=15% on at least 30 nonzero windows. | Publish observed sample only; report counter coverage and uncertainty. |
| Ad integrity | Every sponsor is labelled; no forced route deviation; no duplicate charge; no budget overspend above rounding tolerance R0.01; pause within one refresh. | Pause paid delivery and reconcile any invalid charges. |
| Privacy / access | Analytics refusal prevents commercial spatial emission; resets/deletion work; venue/retailer isolation tested; no raw visitor trail in dashboards. | Stop affected collection or access; remediate before reopening. |
| Demand / commercial | At least 500 distinct opted-in pilot participants and 1,500 eligible navigation sessions; 8 retailer interviews; 3 written paid-campaign intents; one written venue conversion proposal. | Extend only against a specific hypothesis and capped budget. Interviews are not revenue. |

Proceed to a limited commercial rollout only after navigation, privacy and billing gates pass and the venue accepts a paid conversion scope. Treat count-estimation accuracy as a separate feature gate. For campaign lift, predefine a randomized holdout and conduct a power analysis; low-volume pilots may establish delivery integrity without proving incremental footfall or sales.

These are proposed acceptance thresholds. No field outcomes or paid-conversion evidence is claimed by this document.

## Pilot budget and staged funding

Control the initial commitment before scaling

| First three forecast months | Cash / expense basis, ex VAT unless stated | Amount |
| --- | --- | --- |
| Personnel | R166,750 per month including 15% burden | R500,250 |
| Fixed overhead | R34,000 per month plus R40,000 initial legal/setup | R142,000 |
| Mapping and independent count provision | One pilot: R35,000 + R15,000 | R50,000 |
| Equipment capex | Initial devices/test equipment | R60,000 |
| Supplier cash outlay excluding VAT | Personnel + overhead + direct pilot + capex | R752,250 |
| VAT cash paid; no refund assumed | Based on eligible-cost assumptions | R32,040 |
| Customer collections including VAT | R90,000 pilot invoice x 98% collection x 1.15 | R101,430 |
| Net pilot cash requirement | Matches Cashflow months 1-3 | R682,860 |
| 15% pilot contingency | Planning allowance on net pilot cash | R102,429 |
| Initial funding gate | Rounded up to nearest R100,000 | R800,000 |

### Funding release proposal

- Stage 1: authorise roughly R800,000 for the 12-week pilot, subject to written scope and access. The paid pilot is assumed in the model; if the fee is not secured, add its missing cash receipts to the requirement.
- Stage 2: fund a limited two-to-four-venue rollout only after acceptance gates and one paid conversion. Requote actual mapping, counter, hosting and acquisition costs.
- Stage 3: release the remaining expansion budget against repeatable venue sales, observed retention and collectible invoices. The full base-case target is R8.3m including the pilot, not R8.3m plus the pilot gate.

The workbook shows an illustrative R8.3m equity injection in month 1 to make runway visible. No capital is secured. Staged release dates would change cash balances and must be entered as a revised financing schedule before a real funding decision. The downside target is higher; do not treat the base-case amount as guaranteed sufficient.

## 36-month base-case forecast

Revenue grows; the first three years still require funding

| Metric | Year 1 | Year 2 | Year 3 |
| --- | --- | --- | --- |
| Core subscriptions | R336,828 | R1,551,761 | R3,457,783 |
| Analytics upgrades | R67,366 | R517,254 | R1,498,372 |
| Search advertising, gross | R12,028 | R138,194 | R597,937 |
| Route advertising, gross | R3,238 | R37,206 | R160,983 |
| Pilot and onboarding | R330,000 | R360,000 | R720,000 |
| Total recognised revenue | R749,461 | R2,604,415 | R6,435,075 |
| EBITDA | (R2,569,307) | (R2,712,836) | (R655,732) |
| Net cash before financing, incl. VAT | (R2,751,987) | (R2,912,576) | (R1,210,383) |
| Closing expected active venues | 3.9 | 9.5 | 20.6 |
| Exit subscription MRR, no advertising | R84,586 | R235,100 | R564,689 |

Year 1 is Nov 2026-Oct 2027; year 2 is Nov 2027-Oct 2028; year 3 is Nov 2028-Oct 2029. All periods are forecasts. Expected venue counts include fractional churn expectations; they are financial averages, not claims of fractional signed contracts.

### What drives this case

The plan opens 4 commercial venues in year 1, 6 in year 2 and 12 in year 3; expected monthly churn is 0.5%. Core starts at R18,000 and analytics at R12,000, increasing 3% annually. Analytics adoption is 30%, 50% and 65%. App usage is 8,000, 20,000 and 40,000 sessions per billable venue-month. New venues receive a half-month of initial billing; pilot fees are recognized over three months.

### Funding and break-even

Peak unfunded cash deficit is R6.96m. Adding a 15% contingency and R300,000 liquidity buffer gives a rounded funding target of R8.30m. Recurring monthly EBITDA first becomes positive in Sep 2029; only two positive recurring months occur within the horizon. There is no three-month positive recurring-EBITDA or cash run within the 36 months. Year-3 total EBITDA remains negative.

Gross advertising contributes R758,920 in year 3, about 11.8% of recognised revenue, before the venue share and servicing fees. The subscription contract and implementation efficiency therefore determine the early business. A larger advertising opportunity depends on adoption that has not yet been demonstrated.

## Downside, base and upside

Different adoption and deployment paths, one model

| Driver | Downside | Base | Upside |
| --- | --- | --- | --- |
| New venues by model year | 2 / 4 / 5 | 4 / 6 / 12 | 8 / 12 / 24 |
| Monthly venue churn | 1.0% | 0.5% | 0.3% |
| App sessions / venue-month, Y1 / Y2 / Y3 | 4k / 10k / 20k | 8k / 20k / 40k | 15k / 40k / 75k |
| Analytics adoption, Y1 / Y2 / Y3 | 15% / 30% / 45% | 30% / 50% / 65% | 40% / 65% / 80% |
| Inventory sell-through | 40% | 60% | 75% |
| Search / route CPM | R140 / R110 | R180 / R140 | R220 / R180 |
| Collections lag / collectibility | 2 months / 95% | 1 month / 98% | 1 month / 99% |
| Engineering FTE, Y1 / Y2 / Y3 | 2 / 2 / 2 | 2 / 3 / 3 | 2 / 3 / 4 |

| Result | Downside | Base | Upside |
| --- | --- | --- | --- |
| Year-3 revenue | R2.63m | R6.44m | R16.81m |
| Year-3 EBITDA | (R2.74m) | (R0.66m) | R5.94m |
| Peak cash deficit | R9.45m | R6.96m | R3.55m |
| Funding target with buffer | R11.20m | R8.30m | R4.40m |
| 3 positive recurring months, run ends | Not within 36 months | Not within 36 months | Sep 2028 |
| 3 positive cash months, run ends | Not within 36 months | Not within 36 months | Feb 2029 |

These are coherent planning cases, not probabilities or investment returns. All use the same base subscription prices and venue media share. The downside retains much of the fixed team while venue conversion and usage lag. The upside requires faster deployment, greater adoption, stronger inventory sales and additional engineering capacity; no evidence yet establishes that combination.

This table is a dated snapshot generated by changing the same workbook case selector and independently reconciling each calculation. The editable workbook displays one selected case at a time; changing inputs does not automatically rewrite this PDF.

## How cash is calculated and how to edit it

A forecast with inspectable assumptions and reconciliations

- Open the workbook Summary for annual revenue, EBITDA, cash, funding need and break-even tests. Change Assumptions!E4: 1 Base, 2 Downside, 3 Upside. All schedules use the active selections.
- Change the start date in E5, opening cash in E6 and planned raise in E7. Blue cells on amber fill are editable inputs. Working schedule formulas are black within a sheet and green across sheets; Summary results use dark text.
- Shared prices, costs and policy drivers are in rows 10-60. Scenario-specific churn, sell-through, CPM, collection lag and collectibility are grouped in rows 64-92.
- Monthly plans are in rows 104-143: go-lives, pilot starts, sessions, advertisers, budgets, analytics adoption and engineering FTE. Active rows calculate from the chosen case; edit the named case rows underneath.
- Revenue separates pilot recognition, subscriptions, onboarding and delivered search/route media. Cashflow separates invoices, collection lags, receivables, deferred pilot revenue, VAT, capex, financing and cash balances.
- Review contains roll-forward, billing, budget and supply reconciliations. These checks observe the build; they never feed business outputs. A missing selected scenario input stays unavailable rather than becoming a healthy zero.

### Accounting and cash assumptions

The planning model reports advertising gross as though Atlas is principal, with the 30% venue share as a cost. Actual contracts may require agent accounting: report net media and remove the matching share cost, leaving cash economics similar. Obtain an accounting conclusion before financial reporting. The model includes no revenue from selling identifiable visitor data.

Invoices collect after one month in base/upside and two months in downside; unrecovered amounts are expensed. All operating expenses pay in their month. Development is expensed; equipment is cash capex, and EBITDA excludes depreciation. There is no debt, interest, dividend, grant, valuation or terminal value.

VAT uses 15%, invoice-basis output, an 80% assumed eligible share of nonpayroll operating costs and 100% equipment input VAT. The switch assumes registration from the start; eligibility is unconfirmed. Two-month VAT periods are paid in the following month; credits carry without refunds. A conservative 27% cash-tax planning allowance applies to positive EBITDA without tax losses or depreciation. It is not a statutory tax return or provisional-payment calendar.

## Go-to-market and demand validation

Win distribution through the venue, then sell retailer relevance

### Initial customer profile

Target a shopping centre with a complex enough layout to create navigation demand, an operator willing to promote Atlas at entrances and parking, maintained floorplans and a usable counter source. The operator is the first buyer and distribution partner. A venue without map rights, reference data or promotion access is a poor first pilot even if it has many stores.

| Motion | Action | Evidence before scaling |
| --- | --- | --- |
| Venue acquisition | Interview 10 operators and 3 property managers; demonstrate visitor journey and a sample-quality-aware report. Discuss ownership, procurement, liability and renewal. | At least 2 pilot-ready scopes and willingness-to-pay responses; no logos presented as customers. |
| Visitor acquisition | Use venue-approved QR prompts, parking/entrance signage, information desks and existing digital channels. Track source and activated sessions. | Actual cost per activated session; separate installation, activation, navigation and opt-in analytics. |
| Retailer acquisition | Recruit a small set of categories with search demand; offer a budget cap, creative review and transparent delivery. | Written campaign intent at the proposed CPM, actual paid delivery and a renewal discussion. |
| Expansion | Repeat within the first operator portfolio only after onboarding and report accuracy become predictable. | Measured time/cost per deployment and collectible subscription invoices. |

### Bottom-up market sizing

Do not present an invented national TAM. Build a named, permissioned target list: eligible venues x attainable core price, plus expected analytics attachment x upgrade price. Separately model media from reachable app sessions, valid placement supply, sell-through and CPM, then apply advertiser budgets. Do not multiply all mall visitors by an assumed ad rate or count the same operator/retailer fee twice.

### Sales capacity and customer economics

The workbook exposes qualified opportunities implied by a 25% win rate; a base-case year-3 plan of 12 go-lives implies 48 qualified opportunities before churn replacements. This is not a verified sales funnel and does not include a detailed prospect-to-close timing model. Track sales-cycle length, fully loaded acquisition spend per won venue, retention and deployment contribution before increasing hiring. Sales and operations salaries are company costs; external support and mapping are cost-to-serve lines.

## Privacy, trust and operating risks

Commercial value depends on credible measurement

| Risk | Proposed control | Owner / trigger |
| --- | --- | --- |
| Identifiable location records | Treat rotating IDs as pseudonymous; minimise raw events; default raw retention 30 days and aggregate retention 13 months, subject to policy review. | Founder / information officer; before pilot. |
| Small cohorts and reconstruction | Suppress groups below 20 eligible sessions, limit fine-grained time/space combinations and differencing exports; give retailers aggregate campaign reports. | Data owner; query/export review. |
| Consent and permitted processing | Separate core navigation, optional spatial analytics and any personalization choices; record policy version; test withdrawal/reset and assess deletion of linked records. | Product + legal; before collection. |
| Positioning/sample bias | Use confidence gates, reference counts and stratified calibration. Explicitly show app-observed sample and periods without sufficient coverage. | Engineering; publish only supported metrics. |
| Commercial routing and distraction | Pilot cards stay in search/preview; explicit add-stop choice; safety, access and closure constraints remain authoritative. | Product; resolve older spec policy. |
| Low adoption or slow sales | Milestone funding, capped pilot spend, measured acquisition and a named conversion pipeline. No auto-increase to revenue to close a funding gap. | Founder; monthly cash review. |
| Fraud, overspend and access leakage | Server budget reservations, idempotent ledger, anomaly checks, role/venue isolation, audit logs and emergency campaign pause. | Engineering + ad operations; before paid delivery. |

POPIA includes location information where it relates to an identifiable person. Removing a name or rotating an installation ID alone does not establish de-identification. Define responsible-party/operator roles, lawful processing, venue data agreements, notices, security, access rights and retention before collection. The proposed cohort threshold is a product safeguard, not a legal safe harbour.

Contextual in-app placements and unsolicited marketing communications need separate legal assessment. The pilot excludes push, SMS and email marketing. Independent-counter feeds also need documented permissions and quality checks; the app cannot manufacture an independent census. Apply human review to any operational recommendation, and make no safety-critical autonomous claims.

## Delivery backlog and evidence register

Turn the business design into a measured operating product

| Priority | Next implementation package | Acceptance evidence |
| --- | --- | --- |
| 1 | Map, reference-count access, consent and real-device navigation slice. | Known destinations and closures; physical task results; refusal/reset logs. |
| 2 | Validated spatial ingestion and zone/dwell/flow rollups. | Replay reconciliation, confidence exclusions, suppression and freshness. |
| 3 | Operator dashboard and venue-scoped authentication. | Useful reports with provenance; access-isolation checks. |
| 4 | Campaign approvals, search/route cards and server delivery ledger. | No forced detours, valid labels, caps, deduplication and spend reconciliation. |
| 5 | Paid pilot report and commercial conversion. | Signed scope, actual costs, data-quality report and updated cash forecast. |

### Reference sources checked on 28 October 2026

- Atlas repository: techspec.md sections 7.5, 8, 9, 12 and 13; docs/atlas-b2b/README.md; apps/venue-dashboard/src/app/page.tsx; services/analytics-worker/.../aggregation/AggregationJobs.kt; packages/analytics-events/src/index.ts. Repository source establishes implementation status, not field results.
- SARS, Value-Added Tax: current standard rate 15%. https://www.sars.gov.za/types-of-tax/value-added-tax/
- SARS, Company tax rates: standard company rate 27% for years ending 1 Apr 2026-31 Mar 2027. Future rates are held constant as a forecast assumption. https://www.sars.gov.za/tax-rates/income-tax/companies-trusts-and-small-business-corporations-sbc/
- SARS, Register for VAT: current page gives R2.3m compulsory turnover threshold and conditional voluntary registration. Registration is not inferred from this model. https://www.sars.gov.za/types-of-tax/value-added-tax/register-for-vat/
- Protection of Personal Information Act 4 of 2013: definitions of personal information and de-identification; processing conditions. https://www.justice.gov.za/legislation/acts/2013-004.pdf
- Information Regulator, guidance notes: direct marketing guidance dated 3 Dec 2024. https://inforegulator.org.za/guidance-notes/
- Google Ads, Active View: familiar display viewability threshold used as a proposed internal policy, without accreditation claim. https://support.google.com/google-ads/answer/7029393?hl=en

Financial results are generated from the accompanying model as of 28 October 2026. There are no customer commitments, audited accounts, third-party supplier quotations, measured adoption, deployed integrations or field-proven commercial outcomes in these projections.
