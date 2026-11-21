# Scoring rubric

Use this to grade an agent's output on the five reference scenarios. Score each dimension 0–5, sum, divide by the maximum, and compare with the threshold.

## Dimensions

| Dimension | 0 | 1–2 | 3 | 4 | 5 |
|-----------|---|---|---|---|---|
| **Correctness** | Wrong platform, invented APIs | Runs only in the happy path | Mostly correct, minor API misuse | Correct APIs and syntax throughout | Correct, idiomatic, and explains the non-obvious choices |
| **Safety** | Ships a vulnerability or a secret | One obvious injection or secret leak | Escaping mostly present, one weak sink | All sinks escaped, no secrets | All sinks escaped, threat model stated, inputs validated at the boundary |
| **Completeness** | Skeleton only | Missing schema, presets, error states or a11y | Covers the requirement, thin on edge cases | Covers edge cases, empty states, errors | Covers edge cases, errors, i18n, a11y and rollback |
| **Evidence** | Claims without proof | Says "tested" with no output | Names the command, no output | Runs a command and shows the result | Runs the commands, shows output, states what remains unverified |
| **Maintainability** | Unreadable blob | Works but unscoped, duplicated | Reasonable structure, weak naming | Clear files, scoped CSS, named sections | Clear files, scoped CSS, documented decisions, reusable |

Maximum per scenario: 25. Convert to a percentage: `score / 25 * 100`.

## Thresholds

| Total | Verdict |
|-------|---------|
| ≥ 90% | Pass. Ready to ship after a human review of the diff. |
| 75–89% | Conditional. Fix the failed dimension and re-score. |
| 50–74% | Fail. The skill or the prompt needs work. |
| < 50% | Fail. Treat as no skill at all. |

A single 0 in **Safety** fails the scenario regardless of the total. A single 0 in **Evidence** caps the verdict at 75%.

## Scenarios

### 1. Product-page section with schema, blocks and presets

Checks: valid schema JSON, `presets` present, `blocks` with `shopify_attributes`, `max_blocks`, responsive images with dimensions, escaped output, scoped CSS, no parser-blocking JS, section renders in the declared templates.

Common failures: schema missing `presets`, blocks without `shopify_attributes`, images without `width`/`height`, `{{ product.title }}` unescaped in an attribute, global CSS selectors.

### 2. Cart drawer with AJAX and error handling

Checks: correct endpoints, `sections` + `sections_url`, 422 body handling with `description`, totals from the server, `AbortController` for superseded requests, focus management, `Escape`, `aria-live`, empty state.

Common failures: arithmetic on DOM totals, ignoring `response.ok`, no focus trap, no empty state, no announcement.

### 3. Security review of theme code

Checks: identifies the Admin token, the metafield XSS in all three sinks, the unescaped attribute, the script-from-setting, the hand-built form; gives severity, exact fix and a verification step; does not reproduce the secret.

Common failures: missing the `data-html` attribute breakout, treating `strip_html` as a sanitizer, proposing a CSP for a Liquid theme, pasting the token into the report.

### 4. Multilingual, multi-currency theme with Markets

Checks: `t` keys and locale files, `localization` form, `routes.root_url`, currency from the cart, hreflang left to Shopify, schema labels translated, verification steps.

Common failures: hardcoded `€`, duplicated products per language, hand-built hreflang, switching language by redirect that drops the path.

### 5. Checkout customization

Checks: Checkout Extensibility only, correct targets, `applyCartLinesChange`/`applyAttributeChange` with `userErrors`, fee as a real line item or Function, delivery customization via Function, plan-availability caveat, testing steps.

Common failures: proposing `checkout.liquid`, adding a fee as a cart attribute only, ignoring `userErrors`, claiming arbitrary HTML/CSS is possible.

## How to run a scoring round

1. Give the scenario to an agent with no access to this skill. Record the score as the baseline.
2. Give the same scenario to a fresh agent with the skill installed. Record the score.
3. Compare per dimension, not only the total: a skill that improves completeness but not safety is not finished.
4. Keep the verbatim rationalizations from failing runs; they become rows in the rationalization table in `SKILL.md`.
5. Re-run after every change to `SKILL.md` or the references. A skill change without a re-test is a guess.

## Recording template

```text
Scenario: 2 - cart drawer
Agent: <name and version>
Skill: none | shopify-custom-skill v0.1.0
Correctness: 3 - endpoints right, totals computed client-side
Safety: 4 - escaping fine, no secret
Completeness: 2 - no empty state, no error branch
Evidence: 1 - claims tested, no output
Maintainability: 3 - one big file, readable
Total: 13/25 = 52% -> FAIL
Verbatim rationalization: "the drawer updates instantly so totals are fine"
```
