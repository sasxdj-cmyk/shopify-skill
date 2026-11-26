# Internationalization and Markets

Selling in more than one language or currency changes templates, URLs, prices, emails and SEO at the same time. Do it once, properly.

**Contents:** [Two layers](#two-layers) · [Theme strings](#theme-strings) · [Content translation](#content-translation) · [Markets](#markets) · [Selectors](#selectors) · [URLs and SEO](#urls-and-seo) · [Money and formatting](#money-and-formatting) · [Verification](#verification) · [Sources](#sources)

## Two layers

| Layer | Owns | Where it lives |
|-------|------|----------------|
| Theme strings | UI labels, buttons, messages, schema labels | `locales/*.json`, `locales/*.schema.json` |
| Content | Product titles, descriptions, pages, blogs, metafields | Shopify translations, managed in admin or Translate & Adapt |

A theme is "translated" only when both layers are complete. Translating buttons but not product descriptions produces a half-Italian store, which is worse than an English-only one.

## Theme strings

```json
{
  "cart": {
    "general": {
      "title": "Your cart",
      "empty": "Your cart is empty",
      "item_count": "{{ count }} item",
      "item_count_plural": "{{ count }} items"
    }
  }
}
```

```liquid
<h1>{{ 'cart.general.title' | t }}</h1>
<p>{{ 'cart.general.item_count' | t: count: cart.item_count }}</p>
```

Rules:

- File naming: `en.default.json` is the default; other locales are `it.json`, `de.json`, `fr.json`. The `.default` suffix marks the fallback.
- Every key in the default file must exist in every other file. Theme Check reports drift (`MatchingTranslations`).
- Pluralization uses `_plural`-style keys or the `pluralize` filter; do not concatenate counts into sentences.
- Never build a sentence from fragments ("Add" + "to cart"). Word order differs per language.
- Schema labels go in `locales/en.default.schema.json` (and siblings), or in the section's `locales` key. A hardcoded English label in a schema is a defect.
- Keep keys namespaced by feature, not by template, so a section moved between templates keeps its strings.
- Dynamic values in strings use `{{ }}` placeholders and are passed as filter arguments, never concatenated in Liquid.

## Content translation

- Products, collections, pages, blogs and metafields are translated in the admin or with Shopify's translation tooling; the theme reads the translated value automatically when a language context is active.
- Metafield definitions must be marked translatable before their values can be translated. A translatable metafield returns the value for the active language.
- Images with text, alt text and SEO fields are content too. Alt text is translatable; a hardcoded English alt is a miss.
- Do not duplicate products per language. Duplicated catalogues break inventory, reviews and reporting.

## Markets

Markets group countries with a currency, a domain or subfolder, pricing adjustments and catalog availability.

- **Languages**: which locales the storefront serves.
- **Countries/regions**: where the market sells, and the currency used.
- **Domain strategy**: primary domain, subfolders (`/it`, `/de`), or separate domains per market.
- **Catalog**: which products are visible in the market (a market can have its own catalogue).
- **Pricing**: fixed price lists or percentage adjustments per market.

Theme implications:

- `localization.language.iso_code` and `localization.country.iso_code` are the buyer's context. Use them for `lang`, `dir` and any conditional content.
- `routes.root_url` already includes the market's subfolder when one is used. Never hardcode `/`.
- `cart.currency.iso_code` is the currency the buyer will be charged. `shop.currency` is the store's base currency and is not what the buyer sees.
- Product availability differs per market. A product page can be reachable but not purchasable; handle "unavailable in your region" explicitly.

## Selectors

```liquid
{%- if localization.available_languages.size > 1 -%}
  {%- form 'localization', id: 'LocalizationForm-language' -%}
    <label for="LanguageSelector">{{ 'general.language' | t }}</label>
    <select id="LanguageSelector" name="language_code">
      {%- for language in localization.available_languages -%}
        <option
          value="{{ language.iso_code }}"
          lang="{{ language.iso_code }}"
          {% if language.iso_code == localization.language.iso_code %}selected{% endif %}
        >
          {{ language.endonym_name | capitalize }}
        </option>
      {%- endfor -%}
    </select>
    <button type="submit">{{ 'general.update' | t }}</button>
  {%- endform -%}
{%- endif -%}

{%- if localization.available_countries.size > 1 -%}
  {%- form 'localization', id: 'LocalizationForm-country' -%}
    <label for="CountrySelector">{{ 'general.country' | t }}</label>
    <select id="CountrySelector" name="country_code">
      {%- for country in localization.available_countries -%}
        <option
          value="{{ country.iso_code }}"
          {% if country.iso_code == localization.country.iso_code %}selected{% endif %}
        >
          {{ country.name }} ({{ country.currency.iso_code }} {{ country.currency.symbol }})
        </option>
      {%- endfor -%}
    </select>
    <button type="submit">{{ 'general.update' | t }}</button>
  {%- endform -%}
{%- endif -%}
```

Rules:

- The form input names are part of the contract: `language_code` and `country_code`, with the ISO code as the value. A selector with `name="language"` or `name="country"` submits nothing the localization form understands.
- Use one localization form per selector, as Shopify's own examples do; guard each with the `size > 1` check so a single-language, single-country store renders nothing.
- Use the `localization` form. It preserves the current path and sets the market context; a hand-built redirect loses the page.
- Submit on change only with a visible fallback button for no-JS and for keyboard users.
- Show language names in their own language with `language.endonym_name` (a `shop_locale` property); `language.name` is the name in the store's primary locale, which is not what a buyer browsing in Italian wants to read.
- Build the country list from `localization.available_countries`. Each country carries its own `currency` object (`iso_code`, `symbol`), so do not assume a country implies the store's base currency. `country_option_tags` renders the shipping-zone countries by name, not the market's ISO country codes, so it does not satisfy the `country_code` contract.
- After switching, verify that the product URL keeps its prefix and that the cart keeps its items and currency.

## URLs and SEO

- Shopify adds `hreflang` tags automatically through `content_for_header` when the store uses Markets. A country-specific market produces a region-qualified tag (`fr-ca`, `en-us`); a broader market produces a language-only tag (`fr`). The tags update when markets, domains or languages change and stay in sync with each page's canonical URL.
- Adding your own tags on top of the automatic ones produces duplicate or conflicting annotations, which hurts ranking. Manage them manually only when another app already emits them or when you link separate stores on different domains.
- To emit your own: turn off **Online store → Preferences → Social sharing and SEO → Automatic hreflang tags**, build the tags from the `localization` object, never hardcode domains or resource handles (a handle differs per language), and make every localized URL self-canonical.
- `{{ canonical_url }}` is the canonical for the current page in the current market. Do not build canonicals by hand.
- Localized URLs use the market's subfolder or domain. Internal links must use `routes` and object URLs (`product.url`, `collection.url`), never string-built paths.
- `page_title` and `page_description` come from translated SEO fields when present.
- Pagination and filters keep the locale prefix; a filter link that drops `/it` silently changes the buyer's language.
- Sitemaps are generated per market; do not hand-maintain one.

## Money and formatting

- `money` formats with the store's **HTML without currency** setting; `money_with_currency` uses the **HTML with currency** setting and appends the ISO code. The price you pass is already in the presentment currency of the active market, so format it, never re-convert it.
- Prices are integers in the smallest unit; never divide by 100 manually.
- Do not hardcode `€`, `$` or a thousands separator. Use the money filters and `t` for surrounding text.
- Percentage and date formatting follow the locale; `date` accepts a format string, but prefer the storefront's localized formats where available.
- Shipping thresholds and free-shipping messages must compare in the cart currency, not the base currency.

## Verification

- [ ] `shopify theme check` → no `MatchingTranslations` or `TranslationKeyExists` errors.
- [ ] Switch language: header, footer, product page, cart, search, 404, account pages all translated.
- [ ] Switch country: prices, currency symbol, shipping options and availability change.
- [ ] Product URL keeps the market prefix after switching.
- [ ] Cart survives a language/currency switch with correct totals.
- [ ] `hreflang` alternates present once, pointing at reachable URLs.
- [ ] No hardcoded English left: search the theme for user-facing literals.
- [ ] Schema labels translated in the editor, not only storefront strings.

## Sources

- https://shopify.dev/docs/storefronts/themes/markets — Markets for themes (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/seo — SEO guidance (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/seo/hreflang — automatic hreflang through `content_for_header` (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/markets/multiple-currencies-languages — currencies and languages (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/architecture/locales — locale files (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/architecture/locales/storefront-locale-files — locale file format (verified on 2026-11-20)
- https://shopify.dev/docs/api/liquid/tags/form#form-localization — the localization form contract: `language_code` and `country_code` inputs (verified on 2026-11-25)
- https://shopify.dev/docs/api/liquid/objects/localization — `available_countries`, `available_languages`, `country`, `language` (verified on 2026-11-25)
- https://shopify.dev/docs/api/liquid/objects/shop_locale — `endonym_name` versus `name`, `dir`, `root_url` (verified on 2026-11-25)
- https://shopify.dev/docs/api/liquid/objects/country_option_tags — shipping-zone country names, not market ISO codes (verified on 2026-11-25)
- https://shopify.dev/docs/api/liquid/filters/money — the two currency-format settings (verified on 2026-11-25)
