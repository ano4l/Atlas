# End-to-end tests

Full-stack scenarios from `techspec.md` §14.4, e.g. detect venue → search → select destination → route preview; start route → receive position updates → reach destination; confidence falls → user corrects position; floor transition; connectivity loss recovery; closure-aware rerouting; sponsored search labelling.

No test runner is wired yet. Recommended: Playwright/Detox once `apps/mobile` and `apps/venue-dashboard` have enough surface area to exercise.
