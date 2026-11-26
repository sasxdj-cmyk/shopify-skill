# TDD evidence

Date: 2026-11-21/26. Skill version under test: `0.1.3`.

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
| `I4` extended to compare **severities** too | 49/50, failing on purpose | RED: a probe flipped `CdnPreconnect` to Error and the check answered `CdnPreconnect: documented error != warning` |
| Added `I8` (legacy Theme Check names anywhere) | 50/52, failing on purpose | RED: it found seven real stale mentions in `SKILL.md`, `theme-architecture.md` and `i18n-markets.md` that the manual review had missed, plus one probe |
| Added `I9` (`{% form %}` types) | 51/52, failing on purpose | RED: a probe `{% form 'newsletter' %}` was rejected; it also caught the placeholder `{% form 'type' %}` in the tag table |
| Probes and stale names removed | 52/52 passed | GREEN |
| Added `I10`–`I13` (Function targets, localization inputs, `paginate` sizes, platform wrapper id) | 55/56, failing on purpose | RED: `I10` answered `cart.transform.run is never documented` (the regex was too strict and skipped two-segment targets), `I11` rejected a probe form using `name="language"`, `I12` rejected `paginate by 300`, `I13` rejected a probe `id="shopify-section-{{ section.id }}"` |
| Fixed the `I10` regex and the assets | 56/56 passed | GREEN |

Final: **56/56**, plus `npx markdownlint-cli2 "**/*.md"` → 0 issues, and `node scripts/check-links.mjs` → **79/79** cited URLs reachable.

`node scripts/coverage.mjs` adds a second executable layer: each line of `assets/rubric.md` is expressed as probes over the skill's own text, and the script reports **47/47 covered**. Proven RED the same way — replacing `presets` with `presetx` in a copy of the package dropped it to `46/47` with `1. Product-page section with schema, blocks and presets` named as the lost check. It is **coverage, not a behavioural score**, and its own output says so.

The `I*` checks are the anti-hallucination layer: they pin the checkout targets, the 8 Function run targets, the 78 Theme Check checks with severities, the section schema keys, the setting types, the form types, the localization input names, the Web Pixel events and the 36 security severities to the values published by Shopify, so a future edit that invents one fails the build. `I8` is the one that earned its place immediately: it found stale names in files a human had already read.

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

Two post-skill runs (scenarios 1 and 2) were then dispatched with the skill installed. **Both failed with the same provider quota error before producing an answer**, so no GREEN behavioural score exists yet. A third attempt at scenario 2 on 2026-11-24 failed the same way (`Free usage limit reached`), so the behavioural half of this document is still a baseline, not a proof of improvement.

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

A second review pass, on 2026-11-24, found eight more in areas the first pass had only skimmed: four invented or stale form types, two non-existent Liquid filters, a storefront form written with the wrong delimiters, a `--force` flag described as the opposite of what it does, a `paginate` window that repeated the Liquid limit as the lint limit, four legacy check names inside another reference, and `MaxFileSize` described without the limits it actually enforces. Seven of the eight were caught by `I8`, which exists because writing the check was cheaper than re-reading every file. That is the argument for the whole `I*` layer: an agent's memory of a documented API is a guess with good manners.

A third pass, on 2026-11-25/26, found nine more, and this time none of them were typos: Function run targets from a retired API generation, three discount APIs that have been merged into two, an `EOL_API_VERSION` grace window that does not exist, `npx skills add` described as installing globally when it defaults to the project, a localization form whose input names did not match the contract, a newsletter written as a `contact` form, a `money` filter piped onto the wrong value, legacy customer templates described as required, and an asset that hardcoded the platform's own `shopify-section-` wrapper id. The last one would only break at the moment a Section Rendering API response replaced the section, which is exactly the kind of defect that survives a happy-path test. Two of the nine are now executable (`I11`, `I13`), and the rest are pinned by `I10` and `I12` or by the coverage probes.

## 4. What remains unverified

- **Behavioural GREEN**: no post-skill run has produced an answer yet (provider quota). The threshold in `assets/rubric.md` is 90% with no zero in Safety and no zero in Evidence. `scripts/coverage.mjs` closes the checkable half of this gap — it proves the material each rubric line grades is present and pinned — but it cannot prove an agent used it, and it does not claim to.
- **Real theme execution**: `assets/section-template.liquid` and `assets/featured-product-card.liquid` were checked for tag balance, schema validity and documented install paths, not rendered in a real Shopify theme.
- **Claude Code, Codex, Qwen Code and Hermes Agent**: installation paths and manifest formats are documented from their official docs, but the skill was only loaded end to end in OpenCode.

Until these are done, this document is the honest state of the evidence: package contract verified, discovery verified, skill quality only partially measured.
