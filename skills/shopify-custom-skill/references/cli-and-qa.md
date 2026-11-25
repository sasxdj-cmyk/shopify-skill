# CLI, Theme Check and QA

The commands that produce evidence, the rules that gate a push, and the budgets that decide whether the store is launchable.

**Contents:** [CLI](#cli) · [Theme Check](#theme-check) · [Performance budgets](#performance-budgets) · [Accessibility](#accessibility) · [SEO](#seo) · [Launch and rollback](#launch-and-rollback) · [Sources](#sources)

## CLI

Install once, then work per store.

```bash
npm install -g @shopify/cli@latest
shopify theme init my-theme          # clone the Skeleton theme
shopify theme pull --store <store>   # pull the live theme (asks which one)
shopify theme dev --store <store>    # local server with hot reload
shopify theme check                  # static analysis
shopify theme push --unpublished --json
shopify theme list --store <store>
shopify theme publish --store <store> --theme <id>
shopify theme share --store <store>  # shareable preview link
shopify theme package                # build a .zip for the Theme Store
shopify theme open --store <store>   # open the admin theme editor
shopify theme delete --store <store> --theme <id>
```

Rules:

- `theme pull` before any change, and pull into a git branch. Never edit the live theme in the admin.
- `theme push --unpublished` **creates a new** unpublished theme and pushes to it. To update an existing unpublished theme, pass `--theme <id>`. In a non-interactive environment you must pass one of `--development`, `--live`, `--theme` or `--unpublished`, or the command stops to ask.
- `theme push --publish` uploads and then publishes. Publishing the live theme from CI also needs `--allow-live`, otherwise the CLI refuses.
- Pushing **deletes remote files that do not exist locally**. That is the default behaviour, and it is how a partial checkout wipes sections. `--nodelete` prevents it; use it whenever the local copy is incomplete.
- `--force` is a hidden escape hatch that only skips the "this does not look like a theme directory" confirmation. It is not a sync mode and it does not make a push safe.
- `--strict` makes the push fail unless Theme Check reports zero errors (warnings allowed). Cheaper than finding out after the upload.
- `--json` makes output machine-readable for CI and for the evidence you paste; `push` and `list` support it.
- `theme dev` proxies the real store: logged-in state, apps and checkout behave like production. Use it for cart and account testing, not a static preview.
- `theme check` runs locally and in CI. Fix errors, review warnings, and never suppress a rule globally to make the build green.

## Theme Check

The reference lists 78 checks (79 table rows; `MaxFileSize` appears twice). The table below is the subset worth naming in a review; every name and severity is copied from that page and re-read on 2026-11-24. A rule that is not on the reference does not exist in the current CLI.

| Rule | Severity | Meaning |
|------|----------|---------|
| `ContentForHeaderModification` | Error | `content_for_header` must be untouched |
| `ParserBlockingScript` | Error | `<script>` needs `defer` or `async` |
| `ImgWidthAndHeight` | Error | `<img>` needs `width` and `height` |
| `MissingAsset` | Error | Every `asset_url` target exists |
| `LiquidSyntaxError` / `LiquidHTMLSyntaxError` | Error | Liquid and HTML syntax |
| `UndefinedObject` | Error | Reference to an undefined Liquid object |
| `UnknownFilter` | Error | Reference to an unknown filter |
| `TranslationKeyExists` | Error | `t` key exists in the locale files |
| `ValidSchemaTranslations` | Error | Schema translation keys resolve in the default schema locale |
| `ValidSchemaName` | Error | Schema `name` value is valid |
| `ValidSchema` | Warning | Schema JSON is valid with known keys |
| `MatchingTranslations` | Warning | Locale files share the same keys |
| `PaginationSize` | Warning | Page size between 1 and 50 (configurable) |
| `MaxFileSize` | Error | File under Shopify's size limit |
| `MissingTemplate` | Warning | `render`, `section` and `include` targets exist |
| `OrphanedSnippet` | Warning | Snippet is referenced somewhere |
| `RemoteAsset` | Warning | Asset loaded from a third-party host |
| `AssetPreload` | Warning | Preload through Liquid filters, not HTML attributes |
| `CdnPreconnect` | Warning | No redundant preconnect to Shopify's CDN |
| `LiquidNestingDepth` / `LiquidComplexity` | Warning | Deep nesting or high cyclomatic complexity |
| `ExcessiveSettingsCount` | Warning | Too many top-level settings in a schema |
| `HardcodedRoutes` | Warning | Use the `routes` object instead of literal URLs |
| `BlockIdUsage` | Warning | Block ids used in conditionals |
| `JSONMissingSection` / `JSONMissingBlock` / `JSONSyntaxError` | Error | JSON templates reference existing sections and blocks and parse |
| `UnclosedHTMLElement` | Error | Unclosed element in branching code |
| `JavascriptTagInWrongFile` / `StylesheetTagInWrongFile` | Error | `javascript` / `stylesheet` tags outside section, block and snippet files |
| `StaticStylesheetAndJavascriptTags` | Error | No Liquid inside `{% stylesheet %}` or `{% javascript %}` |
| `SchemaPresetsStaticBlocks` | Error | A preset static block has a matching `{% content_for "block" %}` |
| `RequiredLayoutThemeObject` | Error | `theme.liquid` renders `content_for_header` and `content_for_layout` |
| `DeprecatedTag` | Error | No removed tags |
| `DeprecatedFilter` | Warning | No removed filters |
| `AppBlockValidTags` | Error | App block markup uses allowed tags |

Legacy names to avoid: the deprecated Ruby gem (`Shopify/theme-check`, 45 files under `lib/theme_check/checks/` of which 44 are checks and one is the `TEMPLATE.rb.erb` scaffold) still uses `TemplateLength`, `NestedSnippet`, `ImgLazyLoading`, `DefaultLocale`, `SchemaJsonFormat`, `ParserBlockingJavaScript`, `ParserBlockingScriptTag`, `UnusedSnippet`. None of them is in the current reference, so none is a current rule. The naming trap: the current check is `ParserBlockingScript` even though its documentation slug is `parser-blocking-javascript`, while `ParserBlockingJavaScript` is the legacy name — the two are one character of meaning apart and easy to swap. `MissingSnippet` is not a check in either generation; the current name for a missing render target is `MissingTemplate`.

Useful invocations:

```bash
shopify theme check                              # text output, exit 1 on any error
shopify theme check --fail-level warning         # stricter CI gate
shopify theme check --output json > check.json   # machine-readable evidence
shopify theme check --list                       # active checks with severities
shopify theme check --print                      # the resolved config, to STDOUT
shopify theme check --init                       # write a .theme-check.yml
shopify theme check --auto-correct               # fix what can be fixed automatically
shopify theme check -C theme-check:all           # every check, one-off audit
shopify theme check -C ./audit.theme-check.yml   # or a config file path
```

Flags, as defined by the CLI (verified in `Shopify/cli`, `packages/theme/src/cli/commands/theme/check.ts`, 2026-11-24):

| Flag | Alias | Values |
|------|-------|--------|
| `--fail-level` | | `crash`, `error` (default), `suggestion`, `style`, `warning`, `info` |
| `--output` | `-o` | `text` (default), `json`; writes to STDOUT |
| `--config` | `-C` | a path, **or** a magic config: `theme-check:all`, `theme-check:recommended`, `theme-check:theme-app-extension` |
| `--list` | `-l` | lists active checks |
| `--print` | | prints the active config |
| `--init` | | generates `.theme-check.yml` |
| `--auto-correct` | `-a` | applies correctable fixes |

Two traps:

- `--fail-level` accepts both the documented levels and `crash`/`suggestion`/`style`. Docs listing only three of them are incomplete, not authoritative.
- The configuration example on Shopify's configuration page still uses `TemplateLength`, which is a **legacy Ruby-gem name**. Copying that YAML teaches a check that the current CLI does not run. Generate the file with `--init` instead of copying an example.

Severity in `.theme-check.yml` is `error`, `warning` or `info` (the internal enum is `0`, `1`, `2` in that order). Do not lower a severity to make a build green; fix the code or record a documented exception.

What Theme Check cannot see, and you must test yourself:

- Whether a value is escaped at the right sink (it only catches some patterns).
- Cart behaviour, drawer focus handling, error states.
- Section behaviour in templates it is not enabled for.
- Real Core Web Vitals on the merchant's catalogue.
- Whether a third-party app's block breaks your layout.

## Performance budgets

Measure on a mid-range Android device over 4G, on the real store with real images.

| Metric | Good | Needs work | Poor |
|--------|------|------------|------|
| LCP | ≤ 2.5 s | 2.5–4.0 s | > 4.0 s |
| INP | ≤ 200 ms | 200–500 ms | > 500 ms |
| CLS | ≤ 0.1 | 0.1–0.25 | > 0.25 |

Theme budgets to hold before shipping:

- One render-blocking stylesheet at most; everything else preloaded or deferred.
- No synchronous third-party script. Analytics loads after interaction or with `defer`.
- The LCP image is preloaded, sized, and served at the displayed width, not 3× it.
- Total JavaScript for a product page stays under what the interaction actually needs; split per section.
- Fonts: at most two families, `font-display: swap`, preload the one used above the fold.
- No layout shift from images without dimensions, injected banners, or late-loading fonts.
- Collection pages paginate; they do not render 500 products.

How to measure: Chrome DevTools performance panel with CPU throttling, Lighthouse on the deployed preview, and the store's own analytics for field data. Report the number and the page measured, not "fast".

## Accessibility

Target WCAG 2.2 AA. Minimum per release:

- Keyboard: every control reachable and operable; visible focus ring; no keyboard trap except intentional modals that close on `Escape`.
- Names: every input labelled; every icon-only button has an accessible name.
- Contrast: 4.5:1 body text, 3:1 large text and UI boundaries.
- Motion: `prefers-reduced-motion` disables carousels, parallax and auto-rotation.
- Zoom: usable at 200% and at 320 px width without horizontal scrolling.
- Announcements: cart and filter updates in `aria-live` regions.
- Structure: one `h1` per page, headings in order, landmarks (`header`, `nav`, `main`, `footer`).
- Forms: errors described in text and tied to the field with `aria-describedby`.

Tools: axe DevTools, Lighthouse accessibility, and a keyboard-only pass. Automated tools catch roughly a third of issues; the keyboard pass is not optional.

## SEO

- `{{ page_title }}` and `{{ page_description }}` in `<head>`; unique titles per template, product and collection.
- `{{ canonical_url }}` as the canonical link. Do not hand-build canonicals for paginated or filtered pages.
- Shopify adds `hreflang` tags automatically through `content_for_header` when the store uses Markets. Inspect the rendered `<head>` before adding your own, and never emit duplicates that disagree.
- Product and breadcrumb structured data: check whether the theme already emits it, then add `Product` with `offers` (price, currency, availability) and `BreadcrumbList`. Validate with a structured-data testing tool.
- One `h1` per page, descriptive alt text, crawlable pagination links (`<a href>`), and a sitemap the platform already generates.
- Do not block `cdn.shopify.com` or the storefront's own assets in `robots.txt`.
- Filtered collection URLs: decide and document whether they are indexable; uncontrolled facet URLs create duplicate content.

## Launch and rollback

Before publishing:

- [ ] `shopify theme check --fail-level error` → 0 errors.
- [ ] Unpublished theme previewed on the real store, on a phone.
- [ ] Cart flow, account flow, search, 404 and password page checked.
- [ ] Security checklist reviewed; zero open `high`.
- [ ] Locale files complete; language and currency switch tested.
- [ ] Apps' blocks render in every section that supports them.
- [ ] Analytics and consent fire once, not twice.
- [ ] Current live theme id recorded.

Publish:

```bash
shopify theme list --store <store> --json        # record ids and names
shopify theme publish --store <store> --theme <new-id>
```

Rollback:

```bash
shopify theme publish --store <store> --theme <previous-id>
```

Rollback is a publish, not a restore: keep the previous theme installed until the new one has survived a full business day. Deleting the old theme before that is how a launch becomes an outage.

## Sources

- https://shopify.dev/docs/storefronts/themes/tools/cli — theme commands (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/tools/theme-check — Theme Check usage and configuration (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/tools/theme-check/checks — rule list (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/tools/theme-check/commands — `theme check` flags (verified on 2026-11-24)
- https://github.com/Shopify/cli/blob/main/packages/theme/src/cli/commands/theme/check.ts — the real option lists for `--fail-level`, `--output` and `--config` (verified on 2026-11-24)
- https://shopify.dev/docs/storefronts/themes/best-practices/performance — performance guidance (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/best-practices/accessibility — accessibility guidance (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/seo — SEO guidance (verified on 2026-11-20)
- https://web.dev/articles/vitals — Core Web Vitals thresholds (verified on 2026-11-20)
- https://www.w3.org/TR/WCAG22/ — WCAG 2.2 (verified on 2026-11-20)
