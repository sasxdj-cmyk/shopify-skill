# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2026-11-26

### Fixed

- `references/checkout-extensibility.md`: the Function run-target table listed targets that no longer exist. Rewritten against the published API `2026-10` set (8 targets: `cart.transform.run`, `cart.lines.discounts.generate.run`, `cart.delivery-options.discounts.generate.run`, `cart.delivery-options.transform.run`, `cart.payment-methods.transform.run`, `cart.validations.generate.run`, `cart.fulfillment-constraints.generate.run`, `cart.fulfillment-groups.location-rankings.generate.run`).
- `references/checkout-extensibility.md`: the discount chain described the retired Product, Order and Shipping Discount APIs. They are merged into the Discount Function API: `cart.lines.discounts.generate.run` returns `CartLinesDiscountsGenerateRunResult` with `productDiscountsAdd`/`orderDiscountsAdd`, `cart.delivery-options.discounts.generate.run` returns `CartDeliveryOptionsDiscountsGenerateRunResult` with `deliveryDiscountsAdd`; strategies are `FIRST`, `MAXIMUM` and `ALL` (`ALL` only for product), at most one operation per type, and entered codes are checked through `enteredDiscountCodes.rejectable`. `FunctionRunResult` is deprecated.
- `references/security-checklist.md`: `EOL_API_VERSION` no longer claims a 30-day grace window. Shopify supports each API version for at least 12 months and keeps it reachable until the 16th of the month after its anniversary; a silent fall-forward is detected through the `X-Shopify-API-Version` response header.
- `references/compatibility.md`: `npx skills add` installs into the **current project** by default and `-g` is what makes it user-level; Node.js must be 22.20 or newer; the skill folder name must equal the frontmatter `name` (a display label is tolerated by OpenCode but not by stricter loaders).
- `references/i18n-markets.md`: the selector example now matches the real `{% form 'localization' %}` contract — one form per selector, `name="language_code"` and `name="country_code"` with ISO values, guards on `size > 1`, and no `country_option_tags` inside the form (it lists the shipping zones' countries, not the Markets). Added the `localization.available_countries` + `country.currency` rule and the two money-format settings.
- `references/liquid-patterns.md`: the localization form line named the wrong inputs (`language`/`country`); it now names `language_code`/`country_code`. The newsletter example used a `contact` form; email consent is a `{% form 'customer' %}` with `<input type="email" name="contact[email]">`. The `t` example piped `money` onto the filter output instead of its argument; it now formats into a variable first. `PaginationSize` is described as a warning, not a failure.
- `references/theme-architecture.md`: `templates/customers/*` are legacy and deprecated (customer accounts run outside the theme; use `<shopify-account>`), five template types have no JSON form (`gift_card`, `robots.txt`, `agents.md`, `llms.txt`, `llms-full.txt`), a JSON template renders at most 25 sections and each section at most 50 blocks, and `wrapper` accepts only `div`, `main` and `section` with optional id, classes and attributes.
- `assets/section-template.liquid`: the section no longer hardcodes `id="shopify-section-{{ section.id }}"` on its inner element, which duplicated the platform wrapper and nested ids on Section Rendering API replacements. The script reads `data-section-id`, replaces the wrapper node, and re-announces on the new live region. Merchant strings inside the script go through `| json` instead of single quotes.
- `assets/featured-product-card.liquid`: the quick-add is a real `{% form 'product', product %}` instead of a bare `<form>`, and the unused `section_id` parameter is gone.
- `assets/launch-checklist.md`: the variant line now covers the real cases (no image, no description, single default variant, multiple variants) and the account section matches customer accounts instead of the legacy templates.

### Added

- Validator checks `I10` (every `*.run` string is one of the 8 published Function targets and all 8 are documented), `I11` (localization forms use `language_code`/`country_code`), `I12` (`paginate` sizes stay within 1–250) and `I13` (liquid assets do not fake the platform section wrapper id). Proven RED with deliberate probes before landing.
- `scripts/coverage.mjs`: each line of `assets/rubric.md` expressed as probes over the skill's own text, 47/47 covered. It reports coverage, explicitly not a behavioural score, and exists because delegated behavioural runs were unavailable; it is wired into CI.

### Notes

- Total: **56 checks**, `markdownlint` clean, **79/79** cited URLs reachable.
- Behavioural evidence is still missing, and is still not simulated. `docs/tdd-round-1.md` records why.

## [0.1.2] - 2026-11-25

### Fixed

- `references/cli-and-qa.md`: the `theme push` rules were wrong in the way that loses merchant work. `--force` is a hidden flag that only skips the "this does not look like a theme directory" confirmation, not a sync mode; deleting remote files is the **default** behaviour and `--nodelete` is what prevents it; `--unpublished` **creates a new** theme instead of updating one; `--publish` and `--allow-live` are documented; `--strict` is added as the pre-push gate.
- `references/cli-and-qa.md`: the `theme check` flag table is now taken from the CLI source. `--fail-level` accepts `crash`, `error`, `suggestion`, `style`, `warning` and `info`, `--output` accepts `text` and `json` and its value is a format, not a filename, and `-C/--config` accepts both a path and the magic values `theme-check:all`, `theme-check:recommended`, `theme-check:theme-app-extension`.
- `references/cli-and-qa.md`: the Theme Check section states that the reference has 78 checks (79 rows, `MaxFileSize` twice), documents the `ParserBlockingScript` versus `ParserBlockingJavaScript` naming trap explicitly, and explains that the Ruby gem has 45 files of which 44 are checks.
- `references/liquid-patterns.md`: the form types were invented. The published 15 are `activate_customer_password`, `cart`, `contact`, `create_customer`, `currency`, `customer`, `customer_address`, `customer_login`, `guest_login`, `localization`, `new_comment`, `product`, `recover_customer_password`, `reset_customer_password`, `storefront_password`; `customer_register`, `customer_password` and `newsletter` do not exist. Also fixed `{{ form 'localization' }}` to `{% form 'localization' %}`, removed the non-existent `handle` and `camelcase` filters, and made the `structured_data` claim precise (`product` and `article` only).
- `references/theme-architecture.md`: the "Theme Check rules that touch structure" table listed four legacy Ruby-gem names (`SchemaJsonFormat`, `TemplateLength`, `NestedSnippet`, `DefaultLocale`) and `MissingSnippet`, which is not a check in either generation. Replaced with the current rules and their severities, plus the real per-directory file-size limits `MaxFileSize` enforces.
- `SKILL.md`, `references/i18n-markets.md`: the two remaining legacy check names (`SchemaJsonFormat`, `DefaultLocale`) replaced with current ones.

### Added

- Validator check `I8`: a legacy Theme Check name may appear only on a line that frames it as legacy or deprecated, across every reference, asset and `SKILL.md`. It found seven stale mentions that the per-file review had missed.
- Validator check `I9`: every `{% form '<type>' %}` in the skill must be one of the 15 published types.
- `I4` now verifies the **severity** of every documented Theme Check rule, not only the name, against all 78 published checks.
- Per-directory file-size limits table (`assets` 20 MB, `locales` 1.5 MB, `config/settings_schema.json` 512 KB, `templates/*.json` 512 KB, `sections/*.json` 512 KB, the 256 KB directories) and the note that `{% schema %}` bytes do not count toward non-asset limits.

### Notes

- Total: **52 checks**, `markdownlint` clean on 18 files, **67/67** cited URLs reachable.
- The behavioural evidence is unchanged: still no post-skill run, because every delegated attempt failed with the provider quota error before answering. Recorded in `docs/tdd-round-1.md`.

## [0.1.1] - 2026-11-22

### Fixed

- `references/checkout-extensibility.md`: replaced three target names that do not exist (`purchase.checkout.contact.render-before`, `purchase.checkout.delivery-option-item.render-after`, `purchase.checkout.payment-method-item.render-after`) with the published ones, and added the verified plan gate: information, shipping and payment step extensions need a development store or Shopify Plus, as do cart transform price overrides.
- `references/i18n-markets.md`: `hreflang` is now documented accurately (automatic through `content_for_header`, region-qualified versus language-only tags, how to turn it off and emit your own), plus the `endonym_name` / `country_option_tags` distinction.
- `references/storefront-api.md`: the rate-limit section no longer claims cost-based throttling for buyer traffic. Buyer traffic is not rate-limited per minute; bots are, checkout creation is throttled per minute with `200 Throttled`, tokenless access has a complexity limit of 1,000, and a bad request can return `430 Shopify Security Rejection`.
- `references/liquid-patterns.md`: `paginate` accepts 1–250 (Theme Check's `PaginationSize` defaults to 50), `image_url` caps at 5760 px, and the four documented cart 422 bodies are listed, including the case where the cart adds the maximum available quantity and still returns an error.
- `references/cli-and-qa.md`: the Theme Check table now uses the check names and severities published in the current reference, and quarantines the legacy Ruby-gem names (`TemplateLength`, `NestedSnippet`, `ImgLazyLoading`, `DefaultLocale`, `SchemaJsonFormat`, `ParserBlockingJavaScript`, `UnusedSnippet`). The non-existent `--category` flag is replaced by `--list` and `-C`.
- `references/theme-architecture.md`: section schema keys corrected (`limit` is 1 or 2, `max_blocks` caps at 50, `default` is for statically rendered sections), and the setting-type table completed with `inline_richtext`, `text_alignment`, `article_list`, `color_palette`, `number` and the 50-item `limit` on list types.
- `references/legal-and-analytics.md`: the pixel example now uses the declarative `[customer_privacy]` gate and `customerPrivacy.subscribe('visitorConsentCollected')`, and lists the 15 standard events exactly as published.

### Added

- `assets/featured-product-card.liquid`: the product card the canonical section renders, with responsive images, price, sold-out state and quick-add form.
- `scripts/check-links.mjs`: zero-dependency link checker, 58/58 URLs reachable at release time.
- `docs/tdd-round-1.md`: the TDD evidence, including the executable RED/GREEN runs, the discovery check, the behavioural baseline and what remains unverified.
- Validator checks `C5b`, `H1`, `H2`, `I1`–`I7`: backticked paths must exist, Liquid block tags must balance, the asset schema must parse, checkout targets must be real, documented assets must exist, Theme Check names must be current, schema keys and setting types must be real, pixel events must be standard, and all 36 security severities must match the pinned official source. 50 checks total.

### Notes

- All severities and names above were re-verified on 2026-11-20/21 against Shopify's documentation and the `Shopify/cli` app-security-engine source. The validator now fails if the package drifts from those pinned lists.

## [0.1.0] - 2026-11-21

### Added

- `SKILL.md` with the 12-phase workflow, Liquid and section rules, cart rules, security gate, QA gate, rationalization table, red flags and verification gate.
- `references/theme-architecture.md`: directory contract, template types, JSON templates, section schema, setting types, theme blocks, Theme Check structural rules.
- `references/liquid-patterns.md`: objects, tags, filters, escaping matrix, metafields, responsive images, pagination, forms, Cart AJAX and Section Rendering API, localization, performance, accessibility.
- `references/security-checklist.md`: all 36 official Shopify checks with severity, detection, fix and verification, plus quick greps and storefront-specific rules.
- `references/cli-and-qa.md`: Shopify CLI commands, Theme Check rules and thresholds, Core Web Vitals budgets, WCAG 2.2 AA, SEO, launch and rollback.
- `references/storefront-api.md`: Liquid vs Storefront API vs Hydrogen, authentication, queries, cart, localization, caching and cost limits.
- `references/checkout-extensibility.md`: checkout UI extensions, targets, paid options, Shopify Functions, delivery and payment customization, testing.
- `references/i18n-markets.md`: locale files, content translation, Markets, selectors, URLs and SEO, money formatting, verification.
- `references/legal-and-analytics.md`: consent, Web Pixels, analytics hygiene, privacy obligations, consumer law touchpoints.
- `references/compatibility.md`: installation and invocation for Claude Code, Codex, OpenCode, Qwen Code and Hermes Agent, plus troubleshooting.
- `assets/section-template.liquid`: canonical section with schema, blocks, presets, scoped CSS, deferred JS, escaping and accessible quick-add.
- `assets/featured-product-card.liquid`: the product card the section renders, with responsive images, price, sold-out state and quick-add form.
- `assets/launch-checklist.md`: pre-launch checklist across content, code, cart, accounts, Markets, security, performance, accessibility, SEO, analytics, legal and operations.
- `assets/rubric.md`: 0-5 scoring rubric and the five reference scenarios used to test the skill.
- Packaging for five agents: `plugin.json`, `gemini-extension.json`, `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`, `.hermes-plugin/`, and `agents/openai.yaml`.
- `scripts/validate.mjs`: zero-dependency validator covering spec compliance, structure, references, security check coverage, links, manifests and documentation.
- `scripts/check-links.mjs`: zero-dependency link checker for every URL cited in the documentation.
- `docs/tdd-round-1.md`: the TDD evidence, including the executable RED/GREEN runs, the behavioural baseline and what remains unverified.
- CI workflow running the validator, markdownlint and a link check.

### Notes

- The security checklist reflects the 36 checks present in Shopify CLI's `app-security-engine/checks` directory on 2026-11-20.
- Every reference file cites its sources with a verification date.
