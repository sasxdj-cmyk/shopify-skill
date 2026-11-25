---
name: shopify-custom-skill
description: Use when building, changing, or reviewing a Shopify storefront or theme: sections and blocks, Liquid and JSON templates, cart and AJAX, Markets and locales, checkout extensibility, app integrations, theme security, performance, accessibility, SEO, or launch QA.
license: MIT
metadata:
  author: Salvatore Cuccaro
  version: "0.1.2"
  verified-on: "2026-11-24"
---

# Shopify storefront engineering

Build Shopify themes that survive a real merchant, a real auditor and a real launch. Every rule here is checkable: if you cannot point at a command output, a rendered page or a file diff that proves the rule, the work is not finished.

Three principles:

1. **The merchant owns the content.** Anything a merchant can type, upload or configure is untrusted input. Escape it, validate it, or do not render it.
2. **The theme editor is a contract.** A section that cannot be configured, reordered, translated and previewed from the editor is broken, even when it looks correct in one template.
3. **Prove it, do not claim it.** Every phase ends with evidence: a command, a rendered output, a diff.

## Precedence

If a repository `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules` or a personal `~/.hermes/SOUL.md` contradicts this skill:

- The repository instruction wins for style, formatting, naming, commit conventions and tooling.
- **This skill wins for Shopify correctness and safety**: escaping, schema validity, API endpoints, deprecation status, and the security checks in `references/security-checklist.md`. A style instruction never licenses unescaped merchant data or a deprecated API.
- When both are silent, follow this skill.
- Announce the conflict in one line, then continue. Do not silently pick a side.

## Workflow

Run the phases in order. Skip a phase only by writing why it does not apply. Each phase lists its exit evidence.

**1. Intake.** Collect: store plan (Basic/Shopify/Advanced/Plus), theme in use (Dawn or custom, and its version), markets and currencies, languages, catalogue size, product types with variants, payment and shipping providers, legal jurisdictions, and whether checkout customization or an app is involved. Exit: a written brief with these facts and the open questions.

**2. Information architecture.** List the page types the store needs and map them to templates: `index`, `product`, `collection`, `list-collections`, `page`, `blog`, `article`, `cart`, `search`, `404`, `password`, `customers/*`. Exit: a template table (page type → template file → sections). See `references/theme-architecture.md`.

**3. Data model.** Decide what is native Shopify data and what is metafield or metaobject data. Products and variants own price, SKU, inventory and options; do not encode those in metafields. Reserve metafields for display data the merchant edits. Exit: a field table with namespace, key, type, owner and who edits it.

**4. Scaffold.** Start from the Skeleton theme or Dawn, or pull the live theme before touching it:

```bash
shopify theme init
shopify theme pull --store <store> --theme <id>
```

Never edit a live theme in place. Exit: a local theme directory that `shopify theme dev` serves.

**5. Sections and blocks.** Build every reusable region as a section with a schema, settings, blocks and presets. Exit: each section appears in the editor, can be added, reordered and removed, and renders in every template it declares.

**6. Liquid.** Implement the markup with the rules in "Liquid rules". Exit: no unescaped merchant output, no inline event handlers, no hardcoded user-facing English.

**7. Cart and AJAX.** Wire add/update/remove through the Cart AJAX API and the Section Rendering API. Exit: quantity, price, subtotal and counter update without reload, including after an error.

**8. Account and checkout.** Customer accounts, order templates, and checkout customization through Checkout Extensibility only. Check the plan first: on stores below Plus, information, shipping and payment step extensions and cart transform price overrides do not apply, so say that instead of shipping dead code. Exit: a written statement of which checkout targets or Functions are used, or an explicit "no checkout customization".

**9. Apps and integrations.** Theme app extensions, app blocks, app proxies and webhooks. Exit: each integration has an owner, a documented contract and a failure mode.

**10. Security pass.** Walk all 36 checks in `references/security-checklist.md`. Exit: a table of check → status → evidence. Any `high` finding blocks the launch.

**11. Performance, accessibility, SEO.** Apply the budgets in `references/cli-and-qa.md`. Exit: measured numbers, not adjectives.

**12. QA and launch.** Run the QA gate, preview on a real device, publish, and record the rollback theme id. Exit: the launch checklist in `assets/launch-checklist.md` fully ticked.

## Liquid rules

**Escaping is manual.** Liquid output is not HTML-escaped. Choose the sink, then the filter:

| Sink | Correct | Wrong |
|------|---------|-------|
| HTML text | `{{ value \| escape }}` | `{{ value }}` |
| HTML attribute value | `{{ value \| escape }}` inside quotes | unquoted attribute |
| Already-escaped HTML | `{{ value \| escape_once }}` | double `escape` |
| Inside `<script>` | `{{ value \| json }}` | `{{ value }}` or string interpolation |
| URL query parameter | `{{ value \| url_encode }}` | raw value |
| Rich text metafield | `{{ metafield \| metafield_tag }}` | raw HTML concatenation |
| Image URL | `{{ image \| image_url: width: 800 }}` | hand-built CDN path |

Never place Liquid output in `on*` attributes, `srcdoc`, `javascript:` URLs, `style` with `url()`, or a `<script src>` you did not build from a trusted setting.

**Structure.** Use `render` for snippets (isolated scope, explicit arguments). `include` is deprecated. Keep logic out of templates: compute with `assign` and `capture`, then print once.

**Images.** Always set `width` and `height` (or an aspect-ratio wrapper) to protect CLS, and always provide `srcset`/`sizes`:

```liquid
{{ product.featured_image
  | image_url: width: 1200
  | image_tag:
      loading: 'lazy',
      widths: '300,450,600,900,1200',
      sizes: '(min-width: 990px) 30vw, 90vw',
      alt: product.featured_image.alt | escape }}
```

Above-the-fold hero images use `loading: 'eager'` and `fetchpriority: 'high'`. Decorative images use `alt: ''`; never omit `alt`.

**Pagination.** `{% paginate collection.products by 24 %}` — the maximum page size is 50. Always render the pagination control and keep the URL parameters intact.

**Do not touch `{{ content_for_header }}`.** It is required by Shopify and is a Theme Check error to modify it.

**Forms.** Use the `{% form %}` tag (`'product'`, `'cart'`, `'customer'`, `'customer_login'`, `'customer_address'`, `'localization'`, `'contact'`). It emits the CSRF token and correct action. A hand-written `<form action="/cart/add">` is a defect.

**Money.** Prices are integers in the smallest currency unit. Compare them as integers (`product.compare_at_price > product.price`), and format only at the sink with `money`, `money_with_currency` or `money_without_trailing_zeros`. Never divide by 100 by hand.

**Null safety.** Guard every optional object (`{% if product.featured_image %}`). A theme that throws on a product without an image is broken.

Full object, tag and filter reference: `references/liquid-patterns.md`.

## Section and block rules

- `{% schema %}` must be the last block in the file and contain valid JSON. Broken JSON fails silently in the editor and loudly in Theme Check (`ValidSchema`, `JSONSyntaxError`).
- Declare `name`, and add `presets` for every section a merchant can add. Without a preset the section is invisible in the editor.
- Give every section a stable `class` and scope its CSS to it. Global selectors leak between sections.
- Blocks need `{{ block.shopify_attributes }}` on their wrapper element; without it the editor cannot select or drag them.
- Set `max_blocks` when the design breaks past a count. Set `enabled_on`/`disabled_on` with `templates` or `groups` when a section must not appear everywhere.
- A `text` or `textarea` setting is plain text: render it as text, never as HTML. A `richtext` setting is sanitised by the platform on input: output it as HTML. Rendering a `text` setting as HTML is a smuggling vector (`TEXT_SETTING_HTML_SMUGGLING`).
- Editor labels (section name, setting labels, block names) are translated in `locales/*.schema.json`, not in the section file. Section-owned runtime strings can live in the schema `locales` object and are read as `sections.<file-name>.<key>`. Do not hardcode English labels anywhere.
- Section JavaScript goes in `{% javascript %}` or an asset loaded with `defer`. No parser-blocking script in a section.
- App blocks (`block.type` starting with `shopify://apps/`) must be supported where the merchant expects apps: product page, cart, and the section's `blocks` array. Test with an app block, not only with your own blocks.

A complete, copyable section with schema, settings, blocks, presets, scoped CSS, deferred JS, escaping and accessible markup lives in `assets/section-template.liquid`. Architecture and the full setting-type table: `references/theme-architecture.md`.

## Cart and AJAX rules

Endpoints (all relative, all JSON):

| Action | Endpoint | Notes |
|--------|----------|-------|
| Add | `POST /cart/add.js` | `items[]` with `id`, `quantity`, `properties`, `selling_plan` |
| Change one line | `POST /cart/change.js` | `line` (1-based) or `id`, plus `quantity` |
| Update many | `POST /cart/update.js` | `updates` map keyed by line or variant id |
| Read | `GET /cart.js` | returns the cart object |
| Clear | `POST /cart/clear.js` | |
| Recommended products | `GET /recommendations/products.json` | `product_id`, `limit`, `intent` |

Rules:

1. **Never trust the client.** Re-render totals from the server response, not from arithmetic on the DOM.
2. **Handle 422.** A failed add returns a body with `status`, `message` and `description`. Show `description`; never swallow it. Remember that adding more than the available stock adds the maximum available **and** returns 422, so reconcile the drawer with the response instead of assuming success.
3. **Use the Section Rendering API** instead of hand-patching markup. Send `sections` (comma-separated section ids) and `sections_url` (usually `window.location.pathname`) with the cart request, then replace the returned HTML:

   ```js
   const response = await fetch('/cart/add.js', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
     body: JSON.stringify({ items: [{ id, quantity }], sections, sections_url: location.pathname }),
   });
   if (!response.ok) {
     const error = await response.json();
     showError(error.description || error.message);
     return;
   }
   const { sections: html } = await response.json();
   for (const [id, markup] of Object.entries(html)) {
     const target = document.getElementById(`shopify-section-${id}`);
     if (target) target.outerHTML = markup;
   }
   ```

4. **Abort superseded requests.** Quantity steppers fire fast; keep an `AbortController` per line and cancel the previous request, or the drawer will flicker backwards.
5. **Announce changes.** Update the cart counter, and put the result in an `aria-live="polite"` region so screen readers hear "2 items, €48.00".
6. **Drawer accessibility.** Move focus into the drawer on open, trap it, close on `Escape`, restore focus to the trigger, and mark the rest of the page `inert`. A drawer that traps a keyboard user is a launch blocker.
7. **Empty state.** The drawer, the counter and the cart page must render correctly with zero items.

## Security gate

Run before any launch and after any change that touches metafields, settings, apps, checkout or scripts. The authoritative list is the 36 checks in `references/security-checklist.md`; these are the ones a theme change breaks most often:

| Check | Detect | Fix |
|-------|--------|-----|
| `CROSS_SITE_SCRIPTING` | Liquid output inside HTML, attributes or `<script>` without a sink-appropriate filter | `escape`, `escape_once`, `json`, `url_encode` |
| `LIQUID_UNSAFE_RENDER` | Theme app extension or unparsed Liquid writing merchant data into an active response | Escape at the sink; keep static templates static |
| `TEXT_SETTING_HTML_SMUGGLING` | `text`/`textarea` setting rendered as HTML | Render as text, or use `richtext` with proper rendering |
| `UNSAFE_INNERHTML` | `innerHTML =` with data from settings, metafields or the URL | `textContent`, or a sanitizer with an allowlist |
| `THEME_EXTENSION_XSS` | App-extension Liquid printing unescaped values | Escape every dynamic value |
| `APP_PROXY_UNVERIFIED_SIGNATURE` | Proxy route reading `shop` or `logged_in_customer_id` without HMAC verification | Verify `signature` with the app secret, timing-safe |
| `INSECURE_WEBHOOK_URL` | `http://`, credentials in URL, or a redirect URI outside the app domain | HTTPS only, no credentials, allowlist hosts |
| `COMMITTED_SECRET` | Admin tokens, API secrets, `.env` contents in the repo | Rotate, remove, load from environment |
| `CREDENTIAL_BROWSER_LEAKAGE` | Token in a Liquid-rendered global, DOM node or client bundle | Never ship tokens to the storefront |
| `MISSING_EMBEDDED_CSP` | Embedded app without `frame-ancestors` | `frame-ancestors https://*.myshopify.com https://admin.shopify.com` |
| `MISSING_COMPLIANCE_WEBHOOKS` | Missing `shop/redact`, `customers/data_request`, `customers/redact` | Declare all three |
| `EOL_API_VERSION` | Pinned API version older than 12 months | Move to a supported version |

Rules that are not negotiable:

- A storefront token in theme code is a public Storefront API token **only**; an Admin API token in a theme is a breach. Say it out loud when you find one.
- Webhook payloads are verified with `X-Shopify-Hmac-Sha256` (base64 HMAC-SHA256 of the **raw** body) and a timing-safe compare. Never verify against a re-serialised body.
- App proxy requests are verified with the `signature` query parameter: HMAC-SHA256 over the sorted, URL-encoded parameters (excluding `signature`) using the app secret.
- Report a finding with: check id, file and line, why it is reachable, severity, the fix, and the verification step. Never paste a real secret into a report or a commit message.

## QA gate

Run all of these and paste the output. Full command list, thresholds and budgets: `references/cli-and-qa.md`.

```bash
shopify theme check --fail-level error
shopify theme dev --store <store>
shopify theme push --unpublished --json
```

Manual checks that no tool replaces:

- [ ] Add to cart from product page, quick add, collection card and search result.
- [ ] Variant with one option, two options, no image, sold out, and price on sale.
- [ ] Cart drawer: add, increase, decrease to zero, remove, empty cart, network offline.
- [ ] Keyboard only: tab through header, menu, product form, drawer; `Escape` closes overlays.
- [ ] 320 px width and 200% zoom: no horizontal scroll, no clipped text.
- [ ] Every template renders with an empty collection, a product with no description, and a page with no image.
- [ ] `prefers-reduced-motion` disables carousels and parallax.
- [ ] Language and currency switch, then a product URL keeps its locale prefix.

## Reference map

| File | Read it when |
|------|--------------|
| `references/theme-architecture.md` | Directory contract, template types, JSON templates, section schema and setting types |
| `references/liquid-patterns.md` | Objects, tags, filters, escaping matrix, responsive images, pagination, metafields |
| `references/security-checklist.md` | The 36 official Shopify checks with severity, detection, fix and verification |
| `references/cli-and-qa.md` | CLI commands, Theme Check rules and thresholds, performance/a11y/SEO budgets, launch and rollback |
| `references/storefront-api.md` | Choosing between Liquid and the Storefront API, GraphQL queries, tokens, rate limits |
| `references/checkout-extensibility.md` | Checkout UI extensions, Shopify Functions, upsells, delivery and payment customization |
| `references/i18n-markets.md` | Locale files, Markets, currencies, domains, hreflang |
| `references/legal-and-analytics.md` | Consent, Web Pixels, GDPR/CCPA obligations, policy pages |
| `references/compatibility.md` | Installing this skill in Claude Code, Codex, OpenCode, Qwen Code and Hermes Agent |

## Common mistakes

| Mistake | Consequence | Correct move |
|---------|-------------|--------------|
| Editing the live theme | No diff, no rollback, merchant traffic affected | `theme pull`, branch, `theme push --unpublished` |
| Hardcoding English strings | Untranslatable storefront, failing `MatchingTranslations` | `{{ 'key' \| t }}` and locale files |
| Using `product.description` as trusted HTML | Stored XSS through the admin | Render with the documented rich-text path |
| Fetching cart totals client-side only | Wrong totals after discounts and taxes | Re-render from the server response |
| `{% include %}` | Deprecated, leaks scope | `{% render %}` with explicit arguments |
| One giant `theme.js` for everything | Slow LCP/INP, no code splitting | Per-section `{% javascript %}` or deferred modules |
| Adding `checkout.liquid` | Removed; will not render | Checkout Extensibility |
| Assuming `shop.currency` is the buyer currency | Wrong prices in Markets | `cart.currency.iso_code` / `localization` |

## Rationalization table

| Rationalization | Reality |
|-----------------|---------|
| "It's only a theme, XSS does not matter here." | Storefront XSS steals sessions and payment data and is one of the 36 checks Shopify audits. |
| "The merchant is trusted, so I can render their HTML." | Merchant accounts get phished. Escape anyway; use `richtext` when formatting is needed. |
| "Theme Check passes, so it is correct." | Theme Check does not test behaviour, accessibility, cart errors or escaping at every sink. |
| "I tested it on the home page." | Sections appear in several templates. Test every declared template, plus empty states. |
| "The drawer looks fine with a mouse." | Focus order, `Escape` and `aria-live` are launch requirements, not polish. |
| "I'll add translations later." | Retro-fitting `t` keys after launch means touching every template twice. |
| "The API version still works." | Supported versions expire after 12 months. Pin a current version now. |
| "The client can compute the total." | Discounts, taxes and Markets make client arithmetic wrong. Use the server response. |
| "Presets are optional." | Without a preset the merchant cannot add the section. It is a dead section. |
| "Checkout extensions work on any plan." | Information, shipping and payment step extensions, and cart transform price overrides, need a development store or Plus. Check the plan first. |

## Red flags

STOP and fix before continuing if you catch yourself doing any of these:

- Printing `{{ ... }}` into HTML, an attribute or a script without choosing a filter.
- Writing `innerHTML` with a value that came from a setting, metafield, URL or API.
- Adding a `<script>` tag whose `src` comes from a setting without an allowlist.
- Committing a token, secret or `.env` file.
- Editing `{{ content_for_header }}`.
- Pushing directly to the live theme.
- Reporting "done" without a `shopify theme check` result.
- Declaring checkout customization via `checkout.liquid`.
- Shipping a section with no `presets`, no `max_blocks` where needed, or no `shopify_attributes`.
- Leaving a TODO in a file you claim is finished.

## Verification gate

Do not report work as complete until every line below is true, with output pasted:

- [ ] `shopify theme check` reports 0 errors (paste the summary line).
- [ ] The changed sections render in every template they declare, including empty states.
- [ ] Cart flow verified end to end: add, change, remove, empty, error.
- [ ] Keyboard and screen-reader pass on every overlay you touched.
- [ ] Security gate: 36 checks reviewed, zero `high` findings open.
- [ ] No secret, token or absolute path added.
- [ ] Diff reviewed: only intended files changed.

If a command cannot run (no store access, no CLI), say exactly which command could not run and why, and list what remains unverified. **STOP** — never replace missing output with "should work", "looks correct" or "tested locally" without the command that produced it.

## Sources

Verified on 2026-11-20 against Shopify's developer documentation. Per-topic URLs and dates are listed at the end of each file in `references/`.
