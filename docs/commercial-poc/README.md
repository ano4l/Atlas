# Atlas commercial proof of concept

Prepared 28 October 2026. This package covers the consumer app, venue spatial analytics and store advertising through sponsored search and route-preview cards.

- [Business proposal and 12-week pilot plan (PDF)](../../output/pdf/Atlas-Commercial-Proposal.pdf)
- [Editable 36-month cashflow model](Atlas-36-Month-Cashflow.xlsx)
- [Editable proposal source](Atlas-Business-Proposal.md)

The workbook opens in the base case and forecasts November 2026-October 2029 in ZAR. Change `Assumptions!E4` to `1` Base, `2` Downside or `3` Upside. Shared inputs and the monthly case rows drive a single revenue, cost and cashflow build. The PDF comparison is a dated snapshot; it does not refresh when the workbook is edited.

The initial pilot funding gate is approximately R800,000. The full base-case funding target is R8.3m, including the pilot, a liquidity buffer and contingency. This is a financing requirement under assumptions, not secured funding. Base-case year-3 revenue is R6.44m; annual EBITDA remains negative. Three consecutive positive recurring-EBITDA months do not occur within the base-case horizon.

## Scope and limitations

Prices, staffing, adoption, budgets, delivery and sales are planning assumptions without signed customers or supplier quotes. The workbook includes collection delays, bad debt, deployment costs, media revenue sharing, payroll, overhead, equipment, VAT timing and a simplified cash-tax allowance. The proposal distinguishes the repository foundation from the unfinished dashboard, analytics and advertising implementation. No application code or production data was changed.

## Verification

- All monthly revenue, earnings, receivables, pilot deferrals, VAT and cash outputs reconciled to independent scalar calculations for all three cases.
- Zero advertisers, zero later-period sessions, missing selected/unselected case inputs and editable pilot recognition length checked.
- Formula-error scan returned no matches; financial roll-forward and media-budget checks reconcile to R0.01 tolerance.
- Exported XLSX reopened and recalculated across all three cases; a later-month driver edit updated revenue correctly.
- All six worksheet views and all 16 PDF pages rendered and visually reviewed.
- Desktop Microsoft Excel execution was not performed; calculation verification used Artifact Tool before and after XLSX export.

## Rebuilding

`tools/build-cashflow.mjs` authors the workbook with `@oai/artifact-tool`, generates `model-results.json` and keeps QA outputs under ignored `qa/`. `tools/build-proposal.py` uses that calculation snapshot to create the editable proposal and PDF. `tools/verify-workbook.mjs` tests a disposable imported copy without changing the saved deliverable.

Use the Codex bundled Node/Python dependencies. A local `tools/node_modules` junction points to the bundled package directory and is ignored. Builders are supporting sources; the requested deliverables are the PDF, workbook and editable proposal.
