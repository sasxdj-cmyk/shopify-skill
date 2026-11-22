# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
