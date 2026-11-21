# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
