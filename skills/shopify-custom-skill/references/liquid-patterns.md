# Liquid patterns

Liquid is a template language with no automatic escaping and no type system. Every rule below exists because the alternative breaks in production.

**Contents:** [Objects](#objects) · [Tags](#tags) · [Filters](#filters) · [Escaping matrix](#escaping-matrix) · [Metafields and rich text](#metafields-and-rich-text) · [Responsive images](#responsive-images) · [Pagination](#pagination) · [Forms](#forms) · [Cart and Section Rendering API](#cart-and-section-rendering-api) · [Localization](#localization) · [Performance](#performance) · [Accessibility](#accessibility) · [Sources](#sources)

## Objects

| Object | Available on | Use for |
|--------|--------------|---------|
| `shop` | everywhere | `shop.name`, `shop.url`, `shop.domain`, `shop.currency`, `shop.metafields` |
| `cart` | everywhere | `item_count`, `total_price`, `items`, `currency.iso_code` |
| `customer` | everywhere (nil if guest) | `email`, `first_name`, `id`, `orders_count`, `tags` |
| `product` | product, collection, search | `title`, `handle`, `url`, `description`, `variants`, `options_with_values`, `metafields` |
| `variant` | product | `id`, `title`, `price`, `compare_at_price`, `available`, `sku`, `selected_or_first_available_variant` |
| `collection` | collection, index | `title`, `products`, `all_products_count`, `filters`, `metafields` |
| `page` | page | `title`, `content`, `handle` |
| `blog` / `article` | blog, article | `title`, `articles`, `content`, `excerpt`, `comments` |
| `order` | customers/order | `line_items`, `total_price`, `financial_status` |
| `request` | everywhere | `locale.iso_code`, `path`, `host`, `design_mode`, `page_type` |
| `routes` | everywhere | `root_url`, `cart_url`, `account_url`, `search_url`, `collections_url` |
| `settings` | everywhere | merchant values from `settings_data.json` |
| `section` / `block` | inside a section | `id`, `settings`, `blocks`, `shopify_attributes` |
| `template` | everywhere | `name`, `suffix` |
| `localization` | everywhere | `language`, `country`, `available_languages`, `available_countries` |
| `canonical_url` | everywhere | canonical link target |
| `page_title`, `page_description` | everywhere | SEO output |
| `content_for_header`, `content_for_layout` | layout only | platform output, never modify |
| `all_products` | everywhere | lookup by handle, limited |
| `linklists` | everywhere | navigation menus |
| `metaobjects` | everywhere | access by type |
| `recommendations` | product page | `performed`, `products` |
| `predictive_search` | search | `resources`, `terms` |

Objects that may be `nil` must be guarded. `{{ product.featured_image }}` on a product without an image prints nothing and `product.featured_image.width` raises a Liquid error in strict mode.

## Tags

| Tag | Use | Watch out |
|-----|-----|-----------|
| `{% if %}` / `{% elsif %}` / `{% else %}` / `{% unless %}` | conditionals | no parentheses; chain with `and` / `or` carefully, `and` binds tighter than `or` |
| `{% case %}` / `{% when %}` | multi-branch | `{% when 'a' or 'b' %}` works |
| `{% for %}` | iteration | `forloop.index`, `forloop.first`, `forloop.last`, `limit:`, `offset:`, `reversed` |
| `{% assign %}` | bind a value | one value per tag; no `+=` |
| `{% capture %}` | build a string | costs memory; prefer `assign` with filters |
| `{% render 'snippet', arg: value %}` | include a snippet | isolated scope; arguments are explicit |
| `{% include %}` | **deprecated** | shares scope; do not use in new code |
| `{% section 'name' %}` | render a section | static sections only (header, footer) |
| `{% sections 'header-group' %}` | render a section group | for header/footer groups |
| `{% content_for 'blocks' %}` | render theme blocks | blocks defined in `blocks/` |
| `{% form 'type' %}` | platform form | emits CSRF token and action |
| `{% paginate x by n %}` | pagination | `n` max 50 |
| `{% liquid %}` | multi-statement block | no output; use for setup |
| `{% comment %}` / `{% # inline %}` | comments | `{% # %}` is the inline form |
| `{% raw %}` | literal Liquid | for documentation only |
| `{% schema %}` | section/block schema | last element in the file, valid JSON |
| `{% stylesheet %}` / `{% javascript %}` | section-scoped assets | bundled by the platform, no `src` |
| `{% style %}` | inline CSS block | scoped by you, not by the platform |
| `{% echo %}` | output inside `{% liquid %}` | equivalent to `{{ }}` |

## Filters

**Strings:** `append`, `prepend`, `capitalize`, `downcase`, `upcase`, `strip`, `lstrip`, `rstrip`, `strip_html`, `strip_newlines`, `newline_to_br`, `replace`, `replace_first`, `remove`, `remove_first`, `slice`, `split`, `truncate`, `truncatewords`, `escape`, `escape_once`, `url_encode`, `url_decode`, `base64_encode`, `base64_decode`, `md5`, `sha1`, `sha256`, `hmac_sha256`.

**Numbers:** `plus`, `minus`, `times`, `divided_by`, `modulo`, `abs`, `ceil`, `floor`, `round`, `at_least`, `at_most`.

**Arrays:** `first`, `last`, `size`, `join`, `map`, `where`, `sort`, `sort_natural`, `uniq`, `reverse`, `compact`, `concat`, `slice`, `sum`.

**Money:** `money`, `money_with_currency`, `money_without_currency`, `money_without_trailing_zeros`. Prices are integers in the smallest unit; never divide by 100 by hand.

**Media:** `image_url`, `image_tag`, `asset_url`, `asset_img_url`, `file_url`, `file_img_url`, `global_asset_url`, `shopify_asset_url`, `video_tag`, `external_video_tag`, `media_tag`, `model_viewer_tag`, `placeholder_svg_tag`, `payment_type_svg_tag`, `payment_type_img_url`.

**URLs and HTML:** `link_to`, `link_to_vendor`, `link_to_type`, `link_to_tag`, `link_to_add_tag`, `link_to_remove_tag`, `url_for_type`, `url_for_vendor`, `within`, `stylesheet_tag`, `script_tag`, `img_tag`.

**Text and translation:** `t`, `translate`, `pluralize`, `handleize`, `handle`, `camelcase`, `highlight`.

**Metafields:** `metafield_tag`, `metafield_text`, `weight_with_unit`, `unit_price_with_measurement`.

**Dates:** `date`, `time_tag`.

**Defaults:** `default` (also accepts `allow_false: true`).

**Colors and fonts:** `color_to_rgb`, `color_to_hsl`, `color_to_hex`, `color_extract`, `color_brightness`, `color_modify`, `color_lighten`, `color_darken`, `color_saturate`, `color_desaturate`, `color_mix`, `color_contrast`, `color_difference`, `brightness_difference`, `font_face`, `font_modify`.

**SEO:** `json`, `structured_data` (where available), `canonical_url` as an object.

## Escaping matrix

Liquid does not escape. Decide the sink first.

| Sink | Use | Never |
|------|-----|-------|
| HTML text node | `{{ v \| escape }}` | `{{ v }}` |
| Quoted attribute | `{{ v \| escape }}` | unquoted attribute, `{{ v }}` |
| URL attribute (`href`, `src`) | `{{ v \| escape }}`, and validate the scheme | `javascript:{{ v }}` |
| Query parameter | `{{ v \| url_encode }}` | raw value |
| Inside `<script>` | `{{ v \| json }}` | `{{ v }}`, `'{{ v }}'` |
| Inside `<style>` | `{{ v \| escape }}` or a CSS custom property set from a sanitized value | raw value |
| JSON-LD | `{{ v \| json }}` | string concatenation |
| Rich text metafield | `{{ mf \| metafield_tag }}` | `{{ mf.value }}` |
| Plain metafield | `{{ mf.value \| escape }}` | `{{ mf }}` |
| `data-*` attribute holding JSON | `{{ v \| json \| escape }}` | `{{ v \| json }}` |

Rules:

- `escape` twice is wrong; use `escape_once` when a value may already be escaped.
- `json` output inside an HTML attribute still needs `escape`, because `"` terminates the attribute.
- Never build a URL by concatenating user input. Use `url_encode` for parameters and validate the host for absolute URLs.
- `strip_html` is not a sanitizer: it removes tags but leaves entities and does not prevent attribute injection.
- `{{ v | default: 'x' }}` treats `false` as empty; pass `allow_false: true` when `false` is meaningful.

## Metafields and rich text

```liquid
{%- assign banner = shop.metafields.promo.banner -%}
{%- if banner != blank -%}
  {%- case banner.type -%}
    {%- when 'rich_text_field' -%}
      <div class="promo">{{ banner | metafield_tag }}</div>
    {%- when 'file_reference' -%}
      {{ banner.value | image_url: width: 1200 | image_tag: loading: 'lazy' }}
    {%- else -%}
      <div class="promo">{{ banner.value | escape }}</div>
  {%- endcase -%}
{%- endif -%}
```

- `metafield_tag` renders a metafield according to its type (rich text becomes HTML, files become media tags). Prefer it over manual branching.
- Merchant-writable metafields are **untrusted**: every app with `write_metafields` and the merchant can change them. Never print `.value` unescaped for text types.
- Metaobject entries: `{% assign entry = metaobjects.recipe['handle'] %}` then iterate `entry.fields`.
- List metafields: iterate `mf.value` and escape each item.
- A metafield definition's type determines the safe rendering path. Do not guess the type in the template; if the type can vary, branch on `.type` as above.

## Responsive images

```liquid
{%- assign img = product.featured_image -%}
{%- if img -%}
  {{ img
    | image_url: width: 1600
    | image_tag:
        loading: 'lazy',
        widths: '200,300,400,600,800,1200,1600',
        sizes: '(min-width: 990px) 40vw, 100vw',
        alt: img.alt | escape,
        class: 'product-card__image' }}
{%- endif -%}
```

- `image_url` accepts `width`, `height`, `crop`, `format`. `image_tag` generates `src`, `srcset`, `width`, `height` and `sizes`.
- Always set `width` and `height` (or wrap in a fixed `aspect-ratio`) to avoid layout shift.
- Above the fold: `loading: 'eager'`, `fetchpriority: 'high'`, and a `preload` link for the LCP image only.
- Everything else: `loading: 'lazy'`, and `decoding: 'async'` for large images.
- Alt text comes from `image.alt`; fall back to the product or collection title, escaped. Decorative images use `alt: ''`.
- Do not request a 4000 px image for a 300 px card. Pick `widths` from the actual layout breakpoints.

## Pagination

```liquid
{% paginate collection.products by 24 %}
  {% for product in collection.products %}
    {% render 'product-card', product: product %}
  {% endfor %}

  {% if paginate.pages > 1 %}
    {{ paginate | default_pagination }}
  {% endif %}
{% endpaginate %}
```

- Maximum page size is 50. Theme Check flags anything else (`PaginationSize`).
- `paginate.pages`, `paginate.current_page`, `paginate.items`, `paginate.next`, `paginate.previous` are available inside the block.
- Filtering and sorting must preserve pagination parameters; otherwise page 2 loses the filter.
- For infinite scroll, request the next page over AJAX and append; keep a real `<a href>` for crawlers and no-JS users.

## Forms

```liquid
{%- form 'product', product, id: 'product-form', class: 'product-form' -%}
  <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
  <label for="quantity">Quantity</label>
  <input id="quantity" type="number" name="quantity" value="1" min="1" inputmode="numeric">
  <button type="submit" {% if product.selected_or_first_available_variant.available == false %}disabled{% endif %}>
    {{ 'products.product.add_to_cart' | t }}
  </button>
{%- endform -%}
```

- The `form` tag emits the CSRF token, `form_type`, `utf8` and the correct `action`. Hand-written forms are a defect.
- Available types: `product`, `cart`, `customer`, `customer_login`, `customer_register`, `customer_address`, `customer_password`, `localization`, `contact`, `newsletter` (deprecated alias of `customer`), `storefront_password`.
- `form.errors` and `form.posted_successfully?` drive validation messages. Render them with `aria-live`.
- Disable the submit button only for genuinely unavailable states, and re-enable it on error; a permanently disabled button is a lost sale.
- For AJAX submit, intercept `submit`, post to the form's `action` with `FormData`, and keep the non-JS path working.

## Cart and Section Rendering API

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| Add | POST | `/cart/add.js` | `{ items: [{ id, quantity, properties, selling_plan }] }` |
| Change | POST | `/cart/change.js` | `{ line: 1, quantity: 2 }` or `{ id, quantity }` |
| Update | POST | `/cart/update.js` | `{ updates: { "1234": 2 } }` |
| Read | GET | `/cart.js` | — |
| Clear | POST | `/cart/clear.js` | — |
| Recommendations | GET | `/recommendations/products.json?product_id=…&limit=4` | — |

- Send `sections` (comma-separated section ids) and `sections_url` (usually `location.pathname`) with add/change/update to receive re-rendered HTML in `sections`.
- A failed request returns HTTP 422 with `{ status, message, description }`. Show `description`.
- `quantity: 0` removes a line. A line index is 1-based and changes after removal, so prefer `id`.
- Cart totals are integers in the smallest currency unit. Format with `money`.
- After a successful change, update every dependent UI region from the response: drawer, counter, cart page summary, and any `aria-live` announcement.

## Localization

```liquid
{{ 'cart.general.title' | t }}
{{ 'cart.item_count' | t: count: cart.item_count }}
{{ 'products.price.from' | t: price: product.price | money }}
```

- `t` reads `locales/<locale>.json`. Missing keys fall back to the default locale and are reported by `MatchingTranslations`.
- `localization.language.iso_code` and `localization.country.iso_code` describe the buyer context.
- `{{ form 'localization' }}` with `language` and `country` selects switches the buyer context; it preserves the current path.
- Use `routes.root_url` instead of `'/'` so subfolder markets keep working.

## Performance

- One stylesheet and one deferred script in the layout; per-section assets through `{% stylesheet %}` / `{% javascript %}`.
- No parser-blocking `<script>` in `<head>`; Theme Check flags it (`ParserBlockingJavaScript`).
- Preconnect to `cdn.shopify.com` once (`CdnPreconnect`); preload only the LCP image and the primary font (`AssetPreload`).
- Avoid `capture` in loops; it allocates a string per iteration.
- `for` loops over large collections: paginate, or use `limit:`.
- Third-party scripts: `defer`, `async` only when order does not matter, and never inside a section that renders above the fold.
- Measure with the store's real data, not a demo store: catalogue size changes collection render time.

## Accessibility

- Every interactive element is a `button` or an `a`; no clickable `div`.
- Every input has a `label` (visible or `sr-only`), not just a placeholder.
- Overlays: focus moves in, is trapped, `Escape` closes, focus returns to the trigger, background gets `inert`.
- Announce async results with `aria-live="polite"`; use `role="status"` for cart updates.
- Contrast at least 4.5:1 for body text and 3:1 for large text and UI borders.
- Respect `prefers-reduced-motion` for carousels, parallax and auto-rotating banners.
- Carousels need visible previous/next buttons, keyboard support and a pause control.
- Test at 200% zoom and 320 px width; nothing may clip or scroll horizontally.

## Sources

- https://shopify.dev/docs/api/liquid — objects, tags and filters (verified on 2026-11-20)
- https://shopify.dev/docs/api/liquid/filters/image_url — `image_url` parameters (verified on 2026-11-20)
- https://shopify.dev/docs/api/ajax/reference/cart — Cart AJAX endpoints and error shape (verified on 2026-11-20)
- https://shopify.dev/docs/api/ajax/section-rendering — `sections` and `sections_url` (verified on 2026-11-20)
- https://shopify.dev/docs/api/ajax/reference/product-recommendations — recommendations endpoint (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/best-practices/performance — performance guidance (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/best-practices/accessibility — accessibility guidance (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/architecture/locales/storefront-locale-files — locale file format (verified on 2026-11-20)
