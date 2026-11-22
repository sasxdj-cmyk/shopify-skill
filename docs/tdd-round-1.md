# TDD evidence — round 1

Date: 2026-11-21/22. Skill version under test: `0.1.1`.

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
| Added `I1`–`I3` (checkout targets, documented assets, snippet path) | 43/46, failing on purpose | RED: the section did not name the real snippet path |
| Fixed the asset header | 46/46 passed | GREEN |
| Added `I4` (Theme Check names must be current) | 46/47, failing on purpose | RED: the reference still carried the legacy Ruby-gem names |
| Added `I5` (schema keys and setting types) | 47/48, failing on purpose | RED: a probe `bogus_type` was rejected |
| Added `I6` (Web Pixel events) and `I7` (security severities) | 48/50, failing on purpose | RED: a probe severity `critical` was rejected with `EOL_API_VERSION: critical != low` |
| Probes removed | 50/50 passed | GREEN |

Final: **50/50**, plus `npx markdownlint-cli2 "**/*.md"` → 0 issues on 18 files, and `node scripts/check-links.mjs` → **58/58** cited URLs reachable.

The `I*` checks are the anti-hallucination layer: they pin the checkout targets, Theme Check names, section schema keys, setting types, Web Pixel events and the 36 security severities to the values published by Shopify, so a future edit that invents one fails the build.

## 2. Discovery

The skill was installed into `~/.config/opencode/skills/shopify-custom-skill` and OpenCode picked it up **in the running session, without a restart**: it appeared in the session's available-skill list with the exact description from the frontmatter. That verifies the path, the name-equals-directory rule and the description budget on a real loader.

## 3. Behavioural scenarios (skill quality)

Five scenarios were dispatched to fresh general-purpose agents with no access to the skill, to record a baseline.

| # | Scenario | Baseline result |
|---|----------|-----------------|
| 1 | Product-page section with schema, blocks, presets | Not captured: provider quota exhausted before the agent answered |
| 2 | Cart drawer with AJAX and error handling | Not captured: provider quota exhausted |
| 3 | Security review of theme code | Captured, scored 20/25 = 80% (see below) |
| 4 | Multilingual, multi-currency theme with Markets | Not captured: provider quota exhausted |
| 5 | Checkout customization | Not captured: provider quota exhausted |

Two post-skill runs (scenarios 1 and 2) were then dispatched with the skill installed. **Both failed with the same provider quota error before producing an answer**, so no GREEN behavioural score exists yet.

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

The review of the references for this release found six factual defects that no model had flagged — three invented checkout targets, cost-based throttling attributed to Storefront API buyer traffic, a wrong `paginate` ceiling, legacy Theme Check names, an imprecise `hreflang` claim and an incomplete setting-type table. That is indirect evidence for the skill's premise: the failure mode is confident, plausible, wrong detail, and it needs a pinned source plus an executable check to catch it.

## 4. What remains unverified

- **Behavioural GREEN**: no post-skill run has produced an answer yet (provider quota). The threshold in `assets/rubric.md` is 90% with no zero in Safety and no zero in Evidence.
- **Real theme execution**: `assets/section-template.liquid` and `assets/featured-product-card.liquid` were checked for tag balance, schema validity and documented install paths, not rendered in a real Shopify theme.
- **Claude Code, Codex, Qwen Code and Hermes Agent**: installation paths and manifest formats are documented from their official docs, but the skill was only loaded end to end in OpenCode.

Until these are done, this document is the honest state of the evidence: package contract verified, discovery verified, skill quality only partially measured.
