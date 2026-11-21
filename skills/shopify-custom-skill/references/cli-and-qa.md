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
- `theme push --unpublished` creates or updates an unpublished theme; it cannot take the store down.
- `theme push --live` publishes immediately. Require an explicit decision and a recorded rollback id.
- `--force` overwrites remote files that do not exist locally (it can delete sections). Use it only when you mean a full sync.
- `--json` makes output machine-readable for CI and for the evidence you paste.
- `theme dev` proxies the real store: logged-in state, apps and checkout behave like production. Use it for cart and account testing, not a static preview.
- `theme check` runs locally and in CI. Fix errors, review warnings, and never suppress a rule globally to make the build green.

## Theme Check

Default configuration thresholds that matter for structure and safety:

| Rule | Default | Meaning |
|------|---------|---------|
| `TemplateLength` | max 600 lines | Split long templates into sections and snippets |
| `NestedSnippet` | max depth 3 | Deeper nesting is unreadable and slow |
| `PaginationSize` | 1–50 | Page size outside the range is rejected |
| `ImgWidthAndHeight` | on | `<img>` needs `width` and `height` |
| `ImgLazyLoading` | on | Below-the-fold images need `loading="lazy"` |
| `AssetPreload` | on | Preload the LCP image and primary font |
| `CdnPreconnect` | on | Preconnect to `cdn.shopify.com` once |
| `ParserBlockingJavaScript` | on | No synchronous scripts in `<head>` |
| `ContentForHeaderModification` | on | `content_for_header` must be untouched |
| `MatchingTranslations` | on | Locale files share the same keys |
| `DefaultLocale` | on | A default locale file exists |
| `ValidSchema` / `SchemaJsonFormat` | on | Section schema is valid JSON with known keys |
| `AppBlockValidTags` | on | App block markup uses allowed tags |
| `RemoteAsset` | on | Flags assets loaded from third-party hosts |
| `DeprecatedFilter` | on | Flags removed Liquid filters |
| `UnusedAssign` / `UndefinedObject` | on | Dead assignments and unknown objects |
| `MissingAsset` / `MissingTemplate` / `MissingSnippet` | on | Referenced files exist |
| `JSONMissingBlock` / `JSONSyntaxError` | on | JSON templates reference existing blocks and parse |
| `TranslationKeyExists` | on | `t` keys exist in the locale files |

Useful invocations:

```bash
shopify theme check --fail-level error          # CI gate: errors fail, warnings report
shopify theme check --output json > check.json  # machine-readable evidence
shopify theme check --category liquid           # one family at a time
```

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
- Shopify emits `hreflang` alternates for published Markets. Inspect the rendered `<head>` before adding your own, and never emit duplicates that disagree.
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
- https://shopify.dev/docs/storefronts/themes/best-practices/performance — performance guidance (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/best-practices/accessibility — accessibility guidance (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/seo — SEO guidance (verified on 2026-11-20)
- https://web.dev/articles/vitals — Core Web Vitals thresholds (verified on 2026-11-20)
- https://www.w3.org/TR/WCAG22/ — WCAG 2.2 (verified on 2026-11-20)
