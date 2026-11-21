# TDD round 1 — evidence

Date: 2026-11-21. Skill version under test: `0.1.0`.

Two kinds of test were run: the **executable** test suite for the package itself, and the **behavioural** scenarios that measure whether an agent produces better Shopify work with the skill than without it.

## 1. Executable tests (package contract)

`node scripts/validate.mjs` encodes every rule the package must satisfy.

| Run | Result | What it proves |
|-----|--------|----------------|
| First run, empty repository | 5/40 passed | RED: the tests fail for the right reason (missing files), not by accident |
| After `SKILL.md` + references + assets + manifests + docs + CI | 40/40 passed | GREEN |
| Added `C5b` (every backticked path must exist) | 40/41, failing on purpose | RED: a probe path `references/does-not-exist.md` was detected |
| Probe removed | 41/41 passed | GREEN |
| Added `H1` (Liquid block tags balanced) and `H2` (asset schema is valid JSON) | 42/43, failing on purpose | RED: a probe `{% if true %}` without `endif` was detected |
| Probe removed | 43/43 passed | GREEN |

Final: **43/43**, plus `npx markdownlint-cli2 "**/*.md"` → 0 issues on 17 files, and `node scripts/check-links.mjs` → **57/57** cited URLs reachable.

## 2. Behavioural scenarios (skill quality)

Five scenarios were dispatched to fresh general-purpose agents with no access to the skill, to record a baseline.

| # | Scenario | Baseline result |
|---|----------|-----------------|
| 1 | Product-page section with schema, blocks, presets | Not captured: provider quota exhausted before the agent answered |
| 2 | Cart drawer with AJAX and error handling | Not captured: provider quota exhausted |
| 3 | Security review of theme code | Captured, scored 20/25 = 80% (see below) |
| 4 | Multilingual, multi-currency theme with Markets | Not captured: provider quota exhausted |
| 5 | Checkout customization | Not captured: provider quota exhausted |

### Scenario 3 baseline, scored with `assets/rubric.md`

| Dimension | Score | Note |
|-----------|-------|------|
| Correctness | 5 | Found the Admin token, the metafield XSS in all three sinks, the attribute breakout, the script-from-setting, the hand-built form; used `metafield_tag` and `{% form 'customer' %}` correctly |
| Safety | 3 | Fixes are sound, but the report reproduced the leaked token three times, including in a `curl` command, which violates the "never paste a secret into a report" rule the skill enforces |
| Completeness | 4 | Severity, fix and verification present; no mapping to the official check ids, no note that `theme check` does not detect hardcoded secrets until the end |
| Evidence | 4 | Concrete `grep` and `curl` commands with expected output; nothing actually executed |
| Maintainability | 4 | Well organised, but long and repetitive |
| **Total** | **20/25 = 80%** | Conditional, not a pass |

### What this tells us

The baseline is genuinely strong on security review, which is the scenario most represented in public training data. The skill's value is therefore concentrated where models are weakest and where this baseline was not tested: section architecture that survives the theme editor, cart error and focus handling, Markets, and checkout extensibility. Those four scenarios remain unmeasured.

## 3. What remains unverified

- **Behavioural GREEN**: no post-skill run has been recorded yet. The threshold in `assets/rubric.md` is 90% with no zero in Safety and no zero in Evidence.
- **Discovery**: the package has not been installed into an agent's skills directory and observed being triggered by description alone.
- **Real theme execution**: `assets/section-template.liquid` and `assets/featured-product-card.liquid` were checked for tag balance and schema validity, not rendered in a real Shopify theme.

These three items are the next test round. Until they are done, this document is the honest state of the evidence: package contract verified, skill quality not yet proven.
