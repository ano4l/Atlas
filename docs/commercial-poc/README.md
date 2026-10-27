# Atlas fund application and product concepts

Updated 28 October 2026 for a **R100,000 fund application over twelve months**. The application remains pending; proposed spending is R86,000 in direct costs and R14,000 retained contingency, with founder development effort contributed in kind.

## Current application package

- [Illustrated proposal (14-page PDF)](../../output/pdf/Atlas-Commercial-Proposal.pdf)
- [Editable twelve-month fund cash plan](Atlas-12-Month-Fund-Plan.xlsx)
- [Editable proposal text](Atlas-Business-Proposal.md)
- [Mobile concepts, dashboard screens and provenance](mockups/README.md)

The PDF includes four ImageGen mobile states across two premium presentation plates: map home, sponsored search, route preview with an explicit add-stop control and active guidance. The analytics and advertising dashboards are rendered from editable HTML, with illustrative data labelled on the screens. Fictional venue/store names and schematic geometry communicate product direction; no image establishes a live product outcome or venue partnership.

The cash plan uses relative months. Its initial planning case assumes a successful award received in month 1, not a confirmed receipt. Blue cells are editable. Receipt timing and the assumed-award switch can expose funding gaps. No customer receipts, paid full-time payroll or contingency draw are assumed. Fund conditions, supplier quotations, founder availability and venue permissions still need confirmation.

## Verification

- All fourteen PDF pages rendered and visually reviewed, including both landscape dashboard pages.
- The old R800,000 pilot gate and R8.3m expansion request are absent from the revised PDF.
- Fund allocation and monthly cash roll-forwards reconcile; the saved workbook was reopened and recalculated.
- No-award and delayed-receipt input boundaries expose cash deficits; formula scan found no errors.
- Dashboards received an independent design review and passed. A different-provider evaluator was unavailable; the review used a separate same-model agent.
- Desktop Microsoft Excel, production deployment and physical-device execution were not performed in this document/mockup pass.

## Sources and rebuilding

`tools/build-fund-plan.mjs` authors the funding workbook with the bundled Artifact Tool and generates `fund-plan-results.json`. `tools/build-proposal.py` renders `tools/fund_proposal_content.py` and the selected image assets into the PDF and Markdown proposal. QA files remain in ignored `qa/`.

Built-in image generation produced the two mobile plates under `mockups/imagegen/`; their exact prompts are retained in `prompts.json`. The navigation plate used the discovery plate as a visual reference. `mockups/render-screens.mjs` reproduces code-native screen assets; it does not overwrite the ImageGen plates.

The [earlier 36-month expansion forecast](Atlas-36-Month-Cashflow.xlsx) remains a separate exploratory commercial model. Its staffing, pilot and capital assumptions do not define the current R100,000 application. Its builder and calculation snapshot are retained for provenance and later commercial planning.
