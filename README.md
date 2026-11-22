# Shopify Custom Skill

**A production-grade Agent Skill for building, customizing and auditing Shopify themes and storefronts.**

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Validate](https://github.com/sasxdj-cmyk/shopify-skill/actions/workflows/validate.yml/badge.svg)](https://github.com/sasxdj-cmyk/shopify-skill/actions/workflows/validate.yml)
[![skills.sh](https://skills.sh/b/sasxdj-cmyk/shopify-skill)](https://skills.sh/sasxdj-cmyk/shopify-skill)

**Language:** English | [Italiano](#italiano)

---

## Why this skill exists

Most AI answers about Shopify are plausible and wrong in the same three ways: unescaped Liquid, sections that cannot be configured from the theme editor, and `checkout.liquid` advice that has been dead for years.

This skill is written as a gate, not a summary:

- **12-phase workflow** from intake to launch, each phase with exit evidence.
- **Escaping matrix** per sink, so `{{ value }}` is never a guess.
- **The 36 official Shopify security checks**, with severity, detection, fix and verification for each.
- **Theme Check rules and thresholds**, plus the checks no tool replaces.
- **Anti-rationalization table** and a **STOP gate**: no "done" without command output.
- **Five agents, one file**: Claude Code, Codex, OpenCode, Qwen Code, Hermes Agent.

It is not a documentation search tool and not an MCP server. It is the judgment layer you want before an agent touches a theme.

## What it covers

| Area | Included |
|------|----------|
| Architecture | Directory contract, template types, JSON templates, section schema, setting types, theme blocks |
| Liquid | Objects, tags, filters, escaping matrix, responsive images, pagination, forms, metafields |
| Cart | `/cart/add.js`, `change.js`, `update.js`, `clear.js`, Section Rendering API, 422 errors, drawer a11y |
| Markets | Locale files, translated content, currencies, domains, `localization` form, hreflang |
| Checkout | Checkout UI extensions, targets, paid options, Shopify Functions, delivery and payment customization |
| Security | The 36 official checks: XSS, secrets, proxies, webhooks, CSP, tenancy, API versions |
| Quality | Theme Check, Core Web Vitals budgets, WCAG 2.2 AA, SEO, structured data, launch and rollback |
| Headless | Liquid vs Storefront API vs Hydrogen, tokens, cost limits, caching |

## Install

### Any agent (shared directory)

```bash
git clone https://github.com/sasxdj-cmyk/shopify-skill.git
mkdir -p ~/.agents/skills
cp -r shopify-skill/skills/shopify-custom-skill ~/.agents/skills/
```

`~/.agents/skills/` is read by Codex, OpenCode, Qwen Code and Hermes Agent. Claude Code uses `~/.claude/skills/`.

### skills.sh

```bash
npx skills add sasxdj-cmyk/shopify-skill
```

### Claude Code

```bash
mkdir -p ~/.claude/skills
cp -r shopify-skill/skills/shopify-custom-skill ~/.claude/skills/
```

Or as a plugin:

```text
/plugin marketplace add sasxdj-cmyk/shopify-skill
```

### Codex

```bash
mkdir -p ~/.agents/skills
cp -r shopify-skill/skills/shopify-custom-skill ~/.agents/skills/
```

Then `/skills` lists `shopify-custom-skill`. `agents/openai.yaml` supplies the display name and the implicit-invocation policy.

### OpenCode

```bash
mkdir -p ~/.config/opencode/skills
cp -r shopify-skill/skills/shopify-custom-skill ~/.config/opencode/skills/
```

OpenCode also reads `~/.claude/skills/` and `~/.agents/skills/`, so a single install there covers it.

### Qwen Code

```bash
mkdir -p ~/.qwen/skills
cp -r shopify-skill/skills/shopify-custom-skill ~/.qwen/skills/
```

Invoke with `/shopify-custom-skill`, or let the description trigger it.

### Hermes Agent

```bash
mkdir -p ~/.hermes/skills
cp -r shopify-skill/skills/shopify-custom-skill ~/.hermes/skills/
```

Hermes loads it through `skill_view("shopify-custom-skill")`. The repository is also a valid Hermes tap (`.hermes-plugin/plugin.yaml`).

### Project-level install

Copy the same folder into `.claude/skills/`, `.agents/skills/`, `.opencode/skills/`, `.qwen/skills/` or `.hermes/skills/` inside the theme repository, and commit it so the whole team gets the same rules.

## Use it

```text
Build a featured-collection section for this theme with a heading, a collection picker,
columns, and pinned products as blocks. Add presets so the merchant can add it.
```

```text
Review this theme diff for security before I push. Use the official Shopify checks.
```

```text
Make this theme sell in Italy, Germany and the UK with EUR, GBP and USD through Markets.
```

```text
The merchant wants gift wrapping for +€5 and express shipping hidden for fragile items.
Implement it on the current Shopify checkout.
```

The skill answers with code, the reason for each choice, and the command that proves it.

## What's inside

```text
skills/shopify-custom-skill/
├── SKILL.md                        # the workflow, gates and red flags (< 500 lines)
├── agents/openai.yaml              # Codex display name and policy
├── references/
│   ├── theme-architecture.md       # directories, templates, schema, setting types
│   ├── liquid-patterns.md          # objects, filters, escaping, images, cart AJAX
│   ├── security-checklist.md       # 36 checks: severity, detect, fix, verify
│   ├── cli-and-qa.md               # CLI, Theme Check, budgets, launch, rollback
│   ├── storefront-api.md           # Liquid vs Storefront API vs Hydrogen
│   ├── checkout-extensibility.md   # UI extensions, Functions, upsells
│   ├── i18n-markets.md             # locales, Markets, currencies, hreflang
│   ├── legal-and-analytics.md      # consent, Web Pixels, privacy, consumer law
│   └── compatibility.md            # install and troubleshoot per agent
└── assets/
    ├── section-template.liquid     # canonical section: schema, blocks, CSS, JS, a11y
    ├── featured-product-card.liquid # the product card the section renders
    ├── launch-checklist.md         # pre-launch checklist
    └── rubric.md                   # 0-5 scoring rubric for evaluating agents
```

The `SKILL.md` body stays small on purpose: some agents load it whole into the session context. Detail lives one level deep in `references/`, and the body links to every file.

## The 36 security checks

Every check from Shopify's app security engine, with its official severity, adapted to theme, storefront and app-proxy code:

`ACTIVE_UPLOADS_AND_PRIVILEGED_PREVIEWS` · `APP_PROXY_LIQUID_INJECTION` · `APP_PROXY_UNVERIFIED_SIGNATURE` · `COMMITTED_SECRET` · `CREDENTIAL_BROWSER_LEAKAGE` · `CREDENTIAL_LOG_LEAKAGE` · `CROSS_SITE_SCRIPTING` · `CSRF_MISSING_PROTECTION` · `DEPENDENCY_REACHABILITY` · `DEPRECATED_SCRIPT_TAG_SCOPE` · `EOL_API_VERSION` · `EXPIRING_OFFLINE_TOKEN` · `INSECURE_WEBHOOK_URL` · `LIQUID_UNSAFE_RENDER` · `METAFIELD_OFFLINE_TOKEN` · `MISSING_AUTHORIZATION_CHECK` · `MISSING_COMPLIANCE_WEBHOOKS` · `MISSING_EMBEDDED_CSP` · `MISSING_TENANT_ISOLATION` · `OPEN_REDIRECT` · `OVERBROAD_DATA_ACCESS` · `REQUEST_CONTROLLED_ADMIN_CONTEXT` · `REQUEST_DERIVED_SHOP_SCOPE` · `SCOPE_OVER_REQUEST` · `SCRIPT_TAG_URL_INJECTION` · `SESSION_LIFECYCLE_AND_REPLAY` · `SHARED_NAMESPACE_METAFIELD_RENDER` · `SQL_INJECTION` · `SSRF_REQUEST_FORGERY` · `STATIC_FRAME_ANCESTORS` · `TEXT_SETTING_HTML_SMUGGLING` · `THEME_EXTENSION_XSS` · `UNAUTHENTICATED_ENDPOINT` · `UNSAFE_INNERHTML` · `UNSCOPED_SHOP_CONFIG_WRITE` · `WEAK_SHOP_VALIDATION`

Each row in `references/security-checklist.md` gives severity, what to look for, the fix and how to verify it. Any open `high` finding blocks a launch.

## Why the detail holds up

AI answers about Shopify fail on specifics, not on structure. This repository treats every specific as a claim to verify:

- **Every factual statement carries a source URL and the date it was checked.** 61 cited URLs, all reachable, checked by `scripts/check-links.mjs` and by CI.
- **The facts are pinned in the test suite.** Checkout targets, Theme Check names, schema keys, setting types, Web Pixel events and the 36 security severities are compared against the published values; inventing one fails the build.
- **Legacy names are quarantined.** `checkout.liquid`, the Ruby-gem Theme Check names and the old `--category` flag are documented as wrong so an agent does not fall back to them.
- **The release notes record the corrections.** Version 0.1.1 lists six factual defects found during review of 0.1.0, including three extension targets that do not exist. A skill that never corrects itself is not verified, it is untested.

## Validation

The repository ships an executable test suite for the skill itself:

```bash
node scripts/validate.mjs
```

It runs **50 checks**: the spec (`name` equals directory, kebab-case, description starts with "Use when", body under 500 lines), the reference inventory, all 36 security checks with their official severity, every markdown link, every manifest (JSON and YAML), the bilingual README and the CI wiring.

It also pins the facts, so an edit cannot quietly invent one: the 31 checkout extension targets, the current Theme Check names (with the legacy Ruby-gem names quarantined), the section schema keys, the 34 setting types, the 15 Web Pixel events and all 36 security severities must match the values published by Shopify. CI runs it on every push.

```bash
node scripts/check-links.mjs
```

Verifies that every URL cited in the documentation resolves. 61/61 at the time of writing.

The TDD evidence — executable RED/GREEN runs and the behavioural baseline — is recorded in `docs/tdd-round-1.md`, including what remains unverified.

## Compatibility

| Agent | User-level | Project-level | Invoke |
|-------|-----------|---------------|--------|
| Claude Code | `~/.claude/skills/` | `.claude/skills/` | automatic, or name it |
| Codex | `~/.agents/skills/` | `.agents/skills/` | `/skills` |
| OpenCode | `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/` | `.opencode/skills/` | `@shopify-custom-skill` |
| Qwen Code | `~/.qwen/skills/`, `~/.agents/skills/` | `.qwen/skills/` | `/shopify-custom-skill` |
| Hermes Agent | `~/.hermes/skills/`, `.agents/skills/` | `.hermes/skills/` | `skill_view("shopify-custom-skill")` |

Details and troubleshooting: `references/compatibility.md`.

## How this differs from Shopify AI Toolkit

Shopify's official `Shopify-AI-Toolkit` is an MCP server plus docs search: it fetches documentation and validates GraphQL, Liquid and UI extension code against Shopify's API. This skill is complementary: it is the **process and judgment layer** for building and auditing a theme end to end, including the security gate, the QA gate and the launch checklist. Use both if you like; they do not overlap.

## Contributing

Issues and pull requests are welcome. Read `CONTRIBUTING.md`: every factual claim needs a source URL and a verification date, and every change to the skill must be re-tested against the scenarios in `assets/rubric.md`.

## License

MIT. See `LICENSE`.

## Support

The project is free. If it saved you time, you can [buy me a coffee on PayPal](https://paypal.me/SalvaCucca).

---

## Italiano

**Una Agent Skill di livello produttivo per costruire, personalizzare e verificare temi e storefront Shopify.**

La maggior parte delle risposte AI su Shopify sbaglia sempre le stesse tre cose: Liquid non escapato, sezioni che il merchant non può configurare dall'editor, e consigli su `checkout.liquid` che non esiste più.

Questa skill è un cancello, non un riassunto:

- **Workflow in 12 fasi**, ognuna con la prova di uscita.
- **Matrice di escaping** per ogni contesto: HTML, attributi, script, URL.
- **I 36 controlli di sicurezza ufficiali di Shopify**, con severità, rilevamento, correzione e verifica.
- **Regole e soglie di Theme Check**, più i controlli che nessuno strumento sostituisce.
- **Tabella anti-razionalizzazioni** e **gate STOP**: nessun "fatto" senza output di un comando.
- **Cinque agenti, un solo file**: Claude Code, Codex, OpenCode, Qwen Code, Hermes Agent.

### Installazione rapida

```bash
git clone https://github.com/sasxdj-cmyk/shopify-skill.git
mkdir -p ~/.agents/skills
cp -r shopify-skill/skills/shopify-custom-skill ~/.agents/skills/
```

Oppure:

```bash
npx skills add sasxdj-cmyk/shopify-skill
```

Per Claude Code: `~/.claude/skills/`. Per Codex, OpenCode, Qwen Code e Hermes Agent: `~/.agents/skills/` funziona per tutti. Dettagli per singolo agente in `references/compatibility.md`.

### Cosa contiene

Architettura del tema, Liquid, carrello AJAX, Markets e traduzioni, checkout extensibility, sicurezza, performance, accessibilità, SEO, checklist di lancio e rubrica di valutazione. Tutto in inglese dentro la skill (è la lingua di lavoro degli agenti), con README bilingue.

### Perché i dettagli reggono

Le risposte AI su Shopify sbagliano sulle specifiche, non sulla struttura. Qui ogni specifica è una tesi da verificare:

- **Ogni affermazione tecnica ha la sua fonte e la data di verifica.** 61 URL citati, tutti raggiungibili, controllati da `scripts/check-links.mjs` e dalla CI.
- **I fatti sono fissati nei test.** Target delle checkout extension, nomi dei check di Theme Check, chiavi dello schema, tipi di setting, eventi Web Pixel e le 36 severità di sicurezza vengono confrontati con i valori pubblicati da Shopify: inventarne uno fa fallire la build (50 controlli eseguiti da `node scripts/validate.mjs`).
- **I nomi superati sono messi in quarantena.** `checkout.liquid`, i nomi dei check del vecchio gem Ruby e il flag `--category` sono documentati come sbagliati, così un agente non ci ricasca.
- **Le note di rilascio registrano le correzioni.** La 0.1.1 elenca sei difetti fattuali trovati nella 0.1.0, compresi tre target di estensione che non esistono. Una skill che non si corregge mai non è verificata: è solo non testata.

### Licenza

MIT. Se ti è stato utile, puoi [offrirmi un caffè su PayPal](https://paypal.me/SalvaCucca).
