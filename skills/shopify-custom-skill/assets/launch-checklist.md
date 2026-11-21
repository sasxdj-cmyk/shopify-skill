# Launch checklist

Tick every line or record why it does not apply. "It looks fine" is not a tick.

## Content and templates

- [ ] Home, product, collection, page, blog, article, cart, search, 404 and password pages render.
- [ ] Every product with no image, no description, no variant and one variant renders correctly.
- [ ] Every collection with zero products renders an empty state, not a broken grid.
- [ ] Every section that declares `enabled_on` renders in each declared template.
- [ ] No lorem ipsum, no placeholder images, no "test" products in navigation.
- [ ] Navigation menus point at live URLs; no 404 links in header, footer or mega menu.
- [ ] Contact details, address and business information are real and reachable.

## Theme and code

- [ ] `shopify theme check --fail-level error` → 0 errors.
- [ ] No `console.log` left in production JavaScript.
- [ ] No commented-out blocks of dead code in shipped sections.
- [ ] All user-facing strings come from `t` keys or section `locales`.
- [ ] Locale files have identical key sets.
- [ ] No absolute paths, no hardcoded store domain, no hardcoded `/` where `routes.root_url` is correct.
- [ ] `content_for_header` untouched.

## Cart and checkout

- [ ] Add to cart from product page, quick add, collection card and search results.
- [ ] Quantity increase/decrease, remove, and remove-to-zero.
- [ ] Empty cart state in drawer and on the cart page.
- [ ] Sold-out variant blocked with a visible message.
- [ ] 422 error from `/cart/add.js` surfaces `description`.
- [ ] Offline or failed request shows an error and leaves the UI consistent.
- [ ] Cart totals, discounts and taxes match the checkout.
- [ ] Cart survives a language and currency switch.
- [ ] Checkout loads with the expected extensions, if any.
- [ ] Paid options are real line items, not attributes.

## Accounts

- [ ] Register, login, logout, password reset.
- [ ] Order history and order detail render for a real order.
- [ ] Address book: add, edit, delete, set default.
- [ ] Account pages translated.

## Markets and localization

- [ ] Every published language renders the full storefront.
- [ ] Every published currency shows correct prices and symbols.
- [ ] Country selector changes shipping availability.
- [ ] Localized URL keeps its prefix through navigation and pagination.
- [ ] `hreflang` alternates present once, pointing at reachable URLs.
- [ ] Duties and import taxes disclosed where applicable.

## Security

- [ ] `references/security-checklist.md` reviewed; zero open `high` findings.
- [ ] No secret, token or `.env` content in the repo or theme assets.
- [ ] Every merchant-editable field tested with `"><img src=x onerror=alert(1)>`.
- [ ] No `innerHTML` fed by settings, metafields, URL or API data.
- [ ] No `<script src>` built from a free-text setting.
- [ ] Forms use the `{% form %}` tag.
- [ ] App proxy and webhook signature verification tested with a tampered request.
- [ ] Compliance webhooks (`shop/redact`, `customers/data_request`, `customers/redact`) implemented.

## Performance

- [ ] LCP ≤ 2.5 s on a mid-range phone over 4G, on the real catalogue.
- [ ] INP ≤ 200 ms; CLS ≤ 0.1.
- [ ] LCP image preloaded, sized and served at display width.
- [ ] No render-blocking third-party script.
- [ ] Fonts limited and `font-display: swap`.
- [ ] Collection pages paginate.
- [ ] Images have `width`, `height`, `srcset`, `sizes` and `loading`.

## Accessibility

- [ ] Keyboard-only pass through header, menu, product form, drawer, filters.
- [ ] `Escape` closes every overlay; focus returns to the trigger.
- [ ] Focus visible on every interactive element.
- [ ] Every input labelled; icon buttons have accessible names.
- [ ] Contrast 4.5:1 body, 3:1 large text and UI.
- [ ] `prefers-reduced-motion` honoured.
- [ ] Usable at 200% zoom and 320 px width.
- [ ] Cart and filter updates announced in an `aria-live` region.

## SEO

- [ ] Unique `page_title` and `page_description` per template type.
- [ ] Canonical URL present and correct on product, collection and paginated pages.
- [ ] One `h1` per page; heading order sane.
- [ ] Product structured data with price, currency and availability, validated.
- [ ] Breadcrumb structured data where breadcrumbs exist.
- [ ] Sitemap reachable; `robots.txt` does not block storefront assets.
- [ ] Filtered collection URLs have a documented indexation decision.

## Analytics and consent

- [ ] Consent denied → zero non-essential vendor requests.
- [ ] Consent accepted → each event fires once.
- [ ] Each event has exactly one owner (theme, pixel or app).
- [ ] No PII in analytics payloads.
- [ ] Purchase/revenue not double counted.

## Legal

- [ ] Privacy policy, cookie policy, terms of sale and returns policy published and linked.
- [ ] Cookie banner allows rejection and change of consent.
- [ ] Right of withdrawal and return process described.
- [ ] Shipping costs and delivery estimates shown before the final step.
- [ ] Trader identity and contact details published.

## Operations

- [ ] Current live theme id recorded.
- [ ] New theme pushed as unpublished and previewed on a real device.
- [ ] Rollback theme id recorded and reachable.
- [ ] Store owner knows how to roll back.
- [ ] Monitoring in place for checkout errors and 5xx after launch.
- [ ] Launch announced with a date and a responsible person.

## Sign-off

| Area | Owner | Date | Evidence |
|------|-------|------|----------|
| Theme and code | | | `theme check` output |
| Cart and checkout | | | test order id |
| Security | | | findings table |
| Performance | | | Lighthouse report |
| Accessibility | | | keyboard pass notes |
| Legal | | | policy URLs |
