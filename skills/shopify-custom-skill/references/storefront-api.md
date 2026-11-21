# Storefront API and headless

When Liquid is not enough: which API to use, how to authenticate, how to keep it fast, and what breaks in production.

**Contents:** [Choose the stack](#choose-the-stack) · [Authentication](#authentication) · [Queries](#queries) · [Cart](#cart) · [Localization](#localization) · [Pagination and caching](#pagination-and-caching) · [Rate limits](#rate-limits) · [Hydrogen](#hydrogen) · [Sources](#sources)

## Choose the stack

| Need | Liquid theme | Storefront API + custom front end | Hydrogen |
|------|--------------|-----------------------------------|----------|
| Fastest path to launch | yes | no | no |
| Merchant edits everything in the editor | yes | partial (needs a CMS or metafields) | partial |
| Apps, theme editor, Markets, checkout | built in | built in | built in |
| Full control of routing and rendering | no | yes | yes |
| Sub-second navigations with streaming | no | depends on your app | yes (Remix) |
| Custom checkout UI | Checkout Extensibility | Checkout Extensibility | Checkout Extensibility |
| Team already knows React | no | yes | yes |

Do not choose headless because it sounds modern. A Liquid theme with a well-built section library beats a custom front end that reimplements search, filters, accounts and Markets badly. Choose headless when the experience genuinely requires it (custom routing, heavy interactivity, a design system shared with other properties) and the team can own hosting, caching and SEO.

## Authentication

```text
POST https://{shop}.myshopify.com/api/{version}/graphql.json
X-Shopify-Storefront-Access-Token: {public-token}
Content-Type: application/json
```

- **Public access token**: safe in browser code. It can read published products, collections, pages, blogs, and manage the buyer's own cart. Scope it in the Headless channel or the custom app.
- **Private access token**: server only. Never ship it to a browser, never put it in a theme, never commit it.
- Pin an explicit API version in the URL (`2026-10` at the time of writing; check the current release). Unversioned calls break without warning.
- Customer-scoped operations require a customer access token obtained through the customer account flow, not the public token.

## Queries

```graphql
query ProductPage($handle: String!) {
  product(handle: $handle) {
    id
    title
    handle
    descriptionHtml
    featuredImage { url altText width height }
    priceRange { minVariantPrice { amount currencyCode } }
    variants(first: 50) {
      nodes { id title availableForSale price { amount currencyCode } selectedOptions { name value } }
    }
  }
}
```

Rules:

- Ask for the fields you render. Every extra field costs query cost and payload.
- `descriptionHtml` is **HTML from the merchant**: sanitize it before injecting into the DOM. The API does not sanitize for you.
- Handle `null` on every optional field; a product without an image or a variant without a price is normal.
- Use fragments for repeated shapes (product card, money, image) so the cost is predictable.
- Errors come back in `errors[]` alongside partial data. Check both; do not assume `data` means success.
- Use `first`/`after` cursor pagination; there is no offset pagination.

## Cart

```graphql
mutation CartCreate($lines: [CartLineInput!]) {
  cartCreate(input: { lines: $lines }) {
    cart { id checkoutUrl totalQuantity cost { totalAmount { amount currencyCode } } }
    userErrors { field message }
  }
}
```

- The cart is created server-side and identified by `cart.id`. Persist the id (cookie or storage) and reuse it.
- Mutations: `cartCreate`, `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove`, `cartBuyerIdentityUpdate`, `cartDiscountCodesUpdate`, `cartAttributesUpdate`, `cartNoteUpdate`.
- Always read `userErrors`; a mutation can return HTTP 200 with a rejected line.
- `checkoutUrl` is where you send the buyer to pay. Do not build checkout URLs by hand.
- The cart is the only place where prices are authoritative. Never compute totals client-side.
- A cart id is not a secret, but it is a capability: treat it as opaque and do not expose other buyers' ids.

## Localization

```graphql
query @inContext(country: IT, language: IT) {
  products(first: 10) { nodes { title } }
}
```

- `@inContext` sets country and language for the whole operation. Prices, availability and translated content follow it.
- Country drives currency and market availability; language drives translated fields.
- Keep the buyer's context in a cookie and pass it on every request, including cart mutations, or prices will flip between pages.
- `localization` data (available countries and languages) can be queried with `localization { availableCountries { ... } }`.

## Pagination and caching

- Cursor pagination: request `pageInfo { hasNextPage endCursor }`, then `after: $cursor`.
- Cache product and collection queries at the edge with a short TTL and stale-while-revalidate; cart queries are never cached.
- Cache keys must include country, language and customer segment. A cached price for the wrong market is a legal problem, not a bug.
- Invalidate on webhook (`products/update`, `collections/update`) rather than by very short TTLs.
- Pre-render or stream the above-the-fold product data; do not block the first paint on a GraphQL round trip you could have made at build time.

## Rate limits

- The Storefront API is cost-based: each query has a calculated cost, and the response includes `extensions.cost` with `requestedQueryCost`, `actualQueryCost` and `throttleStatus`.
- On throttle, back off with jitter and reduce the query. Retrying immediately makes it worse.
- Batch independent reads into one operation when the cost is lower than several round trips, but do not build a 5000-field query to avoid three requests.
- The Admin API has its own cost model and is never called from a storefront. If you need Admin data in a storefront, cache it server-side or expose it through an app proxy.

## Hydrogen

- Hydrogen is Shopify's Remix-based headless framework, deployed on Oxygen or any Node host.
- `createStorefrontClient` gives you `storefront.query` and `storefront.mutate` with the token and version configured once.
- Use the framework's cache primitives (`CacheShort`, `CacheLong`, `CacheNone`) per route; cart routes must not be cached.
- SEO is your responsibility: metadata per route, canonical URLs, sitemap, structured data, and real HTML for crawlers.
- Checkout is still Shopify checkout; customization is still Checkout Extensibility.
- Analytics: Web Pixels still work, but you must ensure they load on every route, not just the first.

## Sources

- https://shopify.dev/docs/api/storefront/latest — Storefront API reference (verified on 2026-11-20)
- https://shopify.dev/docs/api/storefront/latest/queries/cart — cart queries and mutations (verified on 2026-11-20)
- https://shopify.dev/docs/api/storefront/latest/mutations/cartCreate — cart creation (verified on 2026-11-20)
- https://shopify.dev/docs/api/usage/limits — cost-based rate limits (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/headless/hydrogen — Hydrogen overview (verified on 2026-11-20)
