# Legal and analytics

What the theme must do so the merchant can meet its obligations, and how analytics is wired without breaking consent. This page is engineering guidance, not legal advice: for a specific jurisdiction, the merchant needs a lawyer.

**Contents:** [Consent](#consent) · [Web Pixels](#web-pixels) · [Analytics hygiene](#analytics-hygiene) · [Privacy obligations](#privacy-obligations) · [Consumer law touchpoints](#consumer-law-touchpoints) · [Verification](#verification) · [Sources](#sources)

## Consent

- The merchant's cookie banner is usually an app, but the theme must not fire tracking before consent. A hardcoded analytics snippet in `theme.liquid` bypasses the banner and is a compliance defect.
- Shopify exposes the Customer Privacy API in the storefront (`window.Shopify.customerPrivacy`) that reports whether analytics, marketing and preferences processing are allowed, and whether a banner must be shown. Read it before loading non-essential scripts.
- For app pixels the primary gate is declarative: the pixel declares the permissions it needs in `shopify.extension.toml` and Shopify only loads it when the visitor has granted all of them. Consent read inside the pixel is a second line of defence, not the first.
- Consent must be revocable. A banner that can only accept is not compliant in the EU.
- Region-specific behaviour: the same store can require opt-in in the EU and allow opt-out elsewhere. Do not hardcode one model for all markets.

## Web Pixels

A Web Pixel is an app extension that runs in a sandboxed environment and receives standard storefront events.

```toml
# extensions/analytics-pixel/shopify.extension.toml
type = "web_pixel_extension"
name = "Analytics pixel"
runtime_context = "strict"

# Shopify loads this pixel only when every permission declared here is granted.
[customer_privacy]
analytics = true
marketing = false
preferences = false
sale_of_data = "disabled"
```

```js
// extensions/analytics-pixel/src/index.js
import { register } from '@shopify/web-pixels-extension';

register(({ analytics, customerPrivacy, init }) => {
  // Initial snapshot, valid at page render.
  let privacy = init.customerPrivacy;

  // The only consent event: fires when the visitor submits the banner.
  customerPrivacy.subscribe('visitorConsentCollected', (event) => {
    privacy = event.customerPrivacy;
  });

  analytics.subscribe('product_viewed', (event) => {
    if (!privacy.analyticsProcessingAllowed) return;
    const { productVariant } = event.data;
    // Send variant id and price only, never customer identity.
  });
});
```

`init.customerPrivacy` and the event payload share the same shape: `analyticsProcessingAllowed`, `marketingAllowed`, `preferencesProcessingAllowed`, `saleOfDataAllowed`. All four are booleans.

The 15 standard events, as published: `alert_displayed`, `cart_viewed`, `checkout_address_info_submitted`, `checkout_completed`, `checkout_contact_info_submitted`, `checkout_shipping_info_submitted`, `checkout_started`, `collection_viewed`, `page_viewed`, `payment_info_submitted`, `product_added_to_cart`, `product_removed_from_cart`, `product_viewed`, `search_submitted`, `ui_extension_errored`.

Rules:

- Pixels are app extensions, not theme scripts. Do not paste a vendor snippet into `theme.liquid` and call it a pixel integration.
- Pixels run in a sandbox: limited DOM access, no arbitrary globals. Use the provided `analytics`, `browser`, `customerPrivacy`, `init` and `settings`.
- Outbound domains must be configured in the extension's network access settings. A pixel that needs an unapproved domain fails silently in production.
- Subscribe only to the events you use; every subscription costs runtime on the storefront.
- Never send email, phone, full name or address to an analytics endpoint. Send ids and aggregate values.
- Deduplicate: if both a theme script and a pixel fire `purchase`, revenue is double counted.

## Analytics hygiene

- One source of truth per event. Decide whether the theme, the pixel or the app owns each event, and document it.
- Load non-essential tags after consent and after the page is interactive.
- Do not put measurement IDs in Liquid conditionals that leak them into every page's HTML when unnecessary; use app settings.
- Server-side tagging, where used, goes through an app proxy or the app backend, never a token in the theme.
- Test in incognito with consent denied: no vendor requests should fire. Then accept and confirm they do.
- Keep a list of every third-party domain the storefront contacts. It is the basis of the cookie policy and of the CSP discussion.

## Privacy obligations

These are the merchant's obligations; the theme and app must make them possible.

- **Privacy policy page**: reachable from every page (footer), describing data collected, purposes, retention, processors and rights.
- **Cookie policy**: categories (necessary, analytics, marketing, preferences), with the ability to change consent.
- **Data subject requests**: access, deletion, correction, portability. For apps, Shopify sends `customers/data_request`, `customers/redact` and `shop/redact`; an app that ignores them is non-compliant and fails the compliance check.
- **Data minimisation**: collect only what the flow needs. A "phone number" field on a newsletter form is data you must now protect.
- **Retention**: analytics and order data need a documented retention period.
- **Processors**: every app and vendor that touches customer data belongs in the privacy policy.
- **Children and sensitive data**: do not design flows that collect them without an explicit legal basis.

## Consumer law touchpoints

In the EU and UK, and increasingly elsewhere, the storefront must show:

- Total price including tax, and unit price where required.
- Shipping costs before checkout, or a clear statement of how they are calculated.
- Customs, duties and import taxes for cross-border sales, or who pays them.
- The right of withdrawal (14 days in the EU) and how to exercise it, plus the model withdrawal form where required.
- Clear delivery timelines and the trader's identity and contact details.
- Terms of sale, returns policy and, where applicable, warranty information.

Engineering consequences: do not hide costs until the last step, do not pre-tick paid options, do not make cancellation hard to find, and make sure the market's language is actually available on the pages that carry these disclosures.

## Verification

- [ ] Consent denied in a fresh session → zero non-essential vendor requests (check the network panel).
- [ ] Consent accepted → the expected events fire once each.
- [ ] Every analytics event has exactly one owner (theme, pixel or app).
- [ ] Privacy, cookie, terms and returns pages exist and are linked from the footer in every language.
- [ ] Compliance webhooks implemented and tested (`shop/redact`, `customers/data_request`, `customers/redact`).
- [ ] No PII sent to analytics endpoints; inspect a sample payload.
- [ ] Prices, shipping and duties disclosed before the final checkout step.

## Sources

- https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance — privacy law compliance and mandatory webhooks (verified on 2026-11-20)
- https://shopify.dev/docs/apps/build/marketing/pixels — Web Pixels overview (verified on 2026-11-20)
- https://shopify.dev/docs/api/web-pixels-api — Web Pixels API (verified on 2026-11-20)
- https://shopify.dev/docs/api/web-pixels-api/standard-events — the 15 standard events (verified on 2026-11-20)
- https://shopify.dev/docs/api/web-pixels-api/standard-api/init — `init.customerPrivacy` (verified on 2026-11-20)
- https://shopify.dev/docs/api/web-pixels-api/pixel-privacy — declarative privacy settings and `customerPrivacy.subscribe('visitorConsentCollected')` (verified on 2026-11-20)
- https://shopify.dev/docs/api/web-pixels-api/emitting-data — emitting data (verified on 2026-11-20)
- https://shopify.dev/docs/apps/build/security — app security requirements (verified on 2026-11-20)
