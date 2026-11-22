# Theme architecture

The contract between a Shopify theme and the platform. If a file is in the wrong directory, uses the wrong template type, or ships an invalid schema, the theme fails in the editor even when it renders locally.

**Contents:** [Directory contract](#directory-contract) · [Templates](#templates) · [JSON templates](#json-templates) · [Section schema](#section-schema) · [Setting types](#setting-types) · [Blocks](#blocks) · [Theme blocks](#theme-blocks) · [Layout and config](#layout-and-config) · [Locales](#locales) · [Theme Check rules that touch structure](#theme-check-rules-that-touch-structure) · [Sources](#sources)

## Directory contract

```text
theme/
├── assets/            # css, js, images, fonts served from cdn.shopify.com
├── blocks/            # theme blocks (schema-only, reusable inside sections)
├── config/
│   ├── settings_schema.json
│   └── settings_data.json
├── layout/
│   ├── theme.liquid
│   └── password.liquid
├── locales/
│   ├── en.default.json
│   ├── en.default.schema.json
│   └── it.json
├── sections/
├── snippets/
└── templates/
    ├── index.json
    ├── product.json
    ├── collection.json
    ├── list-collections.json
    ├── page.json
    ├── page.contact.json
    ├── blog.json
    ├── article.json
    ├── cart.json
    ├── search.json
    ├── 404.json
    ├── password.json
    └── customers/
        ├── account.liquid
        ├── activate_account.liquid
        ├── addresses.liquid
        ├── login.liquid
        ├── order.liquid
        ├── register.liquid
        └── reset_password.liquid
```

Rules that are enforced by the platform:

- `templates/customers/*` must be **Liquid**, not JSON. Customer pages are not section-based.
- `templates/password.json` and `layout/password.liquid` belong to the password page; do not reuse the main layout for it.
- Asset filenames are referenced through `asset_url`, never by absolute path. `assets/` is a flat namespace (no subdirectories), so keep filenames unique and prefix them by feature: `component-product-card.css`.
- `snippets/` is flat as well. A snippet is included by name without extension: `{% render 'product-card' %}`.
- `config/settings_schema.json` is an array of groups; `config/settings_data.json` holds merchant values. Never edit `settings_data.json` to inject merchant content by hand.

## Templates

| Template | Rendered for | Typical sections |
|----------|--------------|------------------|
| `index` | home page | hero, featured collection, image-with-text |
| `product` | product page | product information, recommendations, collapsible tabs |
| `collection` | collection page | collection banner, product grid, filters |
| `list-collections` | all collections | collection list |
| `page` | generic page | rich text, image with text |
| `blog` | blog index | article list |
| `article` | blog post | article body, comments, related posts |
| `cart` | cart page | cart items, cart summary |
| `search` | search results | search form, results grid |
| `404` | unknown URL | message, links |
| `password` | storefront lock | password form |
| `customers/*` | account area | Liquid only |

Template suffixes create alternatives: `product.sale.json` is reachable from the admin as a template named `sale`, and a product can be assigned to it. Use suffixes for real alternatives (bundle, preorder), not as a workaround for a section that should be configurable.

## JSON templates

A JSON template declares which sections render and in which order:

```json
{
  "sections": {
    "main": {
      "type": "main-product",
      "settings": { "show_vendor": true },
      "blocks": {
        "title": { "type": "title", "settings": {} },
        "price": { "type": "price", "settings": {} }
      },
      "block_order": ["title", "price"]
    },
    "recommendations": {
      "type": "product-recommendations",
      "settings": { "products_to_show": 4 }
    }
  },
  "order": ["main", "recommendations"]
}
```

Optional keys:

- `layout` — the layout file to use, without extension (`"theme"` is the default).
- `wrapper` — the HTML tag that wraps the whole template output, for example `"div"` or `"main"`. Default is no wrapper.

Rules:

- Section ids in `sections` are stable identifiers. Renaming one loses its merchant settings.
- `order` must list every id in `sections`; an id missing from `order` does not render.
- A section that appears twice needs two distinct ids, for example `main` and `main_2`.
- Never store merchant content in the JSON file. Content lives in section settings, blocks, metafields or `settings_data.json`.

## Section schema

`{% schema %}` must be the last thing in the section file and contain valid JSON.

```liquid
{% schema %}
{
  "name": "Featured collection",
  "tag": "section",
  "class": "section-featured-collection",
  "limit": 2,
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Featured" },
    { "type": "collection", "id": "collection", "label": "Collection" },
    { "type": "range", "id": "columns", "label": "Columns", "min": 2, "max": 4, "step": 1, "default": 3 }
  ],
  "blocks": [
    { "type": "product", "name": "Product", "limit": 12, "settings": [] }
  ],
  "max_blocks": 12,
  "presets": [
    {
      "name": "Featured collection",
      "category": "Collection",
      "settings": { "heading": "Featured" },
      "blocks": [{ "type": "product" }]
    }
  ],
  "enabled_on": { "templates": ["index", "collection"] },
  "locales": {
    "it": { "heading": "In evidenza" }
  }
}
{% endschema %}
```

| Key | Required | Meaning |
|-----|----------|---------|
| `name` | yes | Label in the editor |
| `tag` | no | Wrapper element (`div` by default); use `section` for landmarks |
| `class` | no | Class added to the wrapper |
| `limit` | no | Max instances in one template or section group; the documented values are 1 and 2 |
| `settings` | no | Array of setting definitions |
| `blocks` | no | Array of block definitions (`type`, `name`, `limit`, `settings`) |
| `max_blocks` | no | Hard cap on blocks in one instance; 50 is the platform ceiling and static blocks do not count |
| `presets` | no | Makes the section addable from the editor |
| `default` | no | Configuration for a **statically rendered** section, same shape as a preset; not a substitute for `presets` |
| `enabled_on` / `disabled_on` | no | `{ "templates": [...] }` and/or `{ "groups": [...] }`; `enabled_on` needs at least one of the two, and only one of `enabled_on` / `disabled_on` may be used. Both replace the old `templates` attribute |
| `locales` | no | Section-owned strings: `{ "it": { "key": "value" } }`, read with `sections.<file-name>.<key>` |

If `enabled_on` is omitted the section is available everywhere. A section with no `presets` and no `enabled_on` can only be placed by editing JSON by hand. A section with presets should not also be statically rendered: pick `presets` for merchant-addable sections, `default` for statically rendered ones.

## Setting types

| Type | Value | Notes |
|------|-------|-------|
| `text` | string | Single line; render as text, never as HTML |
| `textarea` | string | Multi-line plain text |
| `richtext` | HTML string | Merchant-formatted; render through the rich-text path |
| `inline_richtext` | HTML string | Rich text without block-level elements; same escaping rules as `richtext` |
| `html` | HTML string | Raw HTML from the merchant; treat as trusted-but-dangerous |
| `liquid` | Liquid source | Executed by the platform; restrict to developers |
| `image_picker` | image | Use `image_url` + `image_tag` |
| `url` | URL | Validate scheme before using in `href`/`src` |
| `video` | video | Shopify-hosted video |
| `video_url` | URL | YouTube/Vimeo; use `external_video_tag` |
| `product` | product | |
| `product_list` | array of products | `limit` defaults to 50 and cannot exceed 50 |
| `collection` | collection | |
| `collection_list` | array of collections | `limit` defaults to 50 and cannot exceed 50 |
| `article` | article | |
| `article_list` | array of articles | `limit` defaults to 50 and cannot exceed 50 |
| `blog` | blog | |
| `page` | page | |
| `link_list` | linklist | Navigation menu |
| `metaobject` | metaobject | Single entry |
| `metaobject_list` | array of metaobjects | `limit` defaults to 50 and cannot exceed 50 |
| `color` | color | |
| `color_palette` | palette | Palette of colours with cross-setting references |
| `color_scheme` | color scheme | Pairs with `color_scheme_group` in settings schema |
| `color_background` | color + gradient | |
| `font_picker` | font | Use `font_face` to emit `@font-face` |
| `number` | number | Numeric input |
| `range` | number | `min`, `max`, `step`, `unit` |
| `checkbox` | boolean | |
| `select` | string | `options: [{ "value", "label" }]` |
| `radio` | string | Same options shape |
| `text_alignment` | string | Horizontal alignment selector |
| `header` | — | Visual grouping in the editor |
| `paragraph` | — | Help text in the editor |

Every setting needs a unique `id` within its section or block, and a `label`. A setting without a label is rejected by the editor.

## Blocks

```liquid
{% for block in section.blocks %}
  <div class="card" {{ block.shopify_attributes }}>
    {% case block.type %}
      {% when 'product' %}
        {% assign product = block.settings.product %}
        {% if product %}
          <a href="{{ product.url }}">{{ product.title | escape }}</a>
        {% endif %}
      {% when 'text' %}
        <p>{{ block.settings.text | escape }}</p>
      {% when '@app' %}
        {% render block %}
    {% endcase %}
  </div>
{% endfor %}
```

- `block.shopify_attributes` is mandatory on the block wrapper. Without it the editor cannot select, reorder or delete the block.
- `block.settings` values follow the same escaping rules as section settings.
- `{% when '@app' %}` (or a `type` starting with `shopify://apps/`) is how app blocks render. Use `{% render block %}`.
- Blocks defined in `blocks/` are rendered with `{% content_for 'blocks' %}` instead of a `for` loop (see below).

## Theme blocks

Theme blocks live in `blocks/` and are declared with their own `{% schema %}`. They are composed, not looped:

```liquid
{% content_for 'blocks' %}
```

```liquid
{% content_for 'block', type: 'text', id: 'heading' %}
```

Use theme blocks when a section should accept arbitrary nesting (a "group" section containing text, image and button blocks). Use classic section blocks when the section owns the layout. Do not mix both models in one section without a reason you can write down.

## Layout and config

`layout/theme.liquid` must contain:

- `{{ content_for_header }}` in `<head>`, untouched.
- `{{ content_for_layout }}` where the template renders.
- `{{ 'theme.css' | asset_url | stylesheet_tag }}` or an equivalent preload + stylesheet pair.
- The `{% sections 'header-group' %}` / `{% sections 'footer-group' %}` pattern if the theme uses section groups.

`config/settings_schema.json` groups merchant settings (colors, typography, social links, cart type). `config/settings_data.json` is generated by the editor; commit it, but never hand-edit merchant values into it during a migration.

Section groups (`sections/header-group.json`, `sections/footer-group.json`) let merchants edit the header and footer across templates. Use them for header/footer/announcement bar; do not duplicate those sections per template.

## Locales

- `locales/en.default.json` holds storefront strings; `en.default.schema.json` holds theme-editor strings.
- Every other locale file mirrors the default keys. Missing keys fall back to the default locale, and Theme Check reports the drift (`MatchingTranslations`).
- Theme-editor labels (section names, setting labels, block names) are translated in `*.schema.json`. A section can also carry its own runtime strings in the schema `locales` object, read as `sections.<file-name>.<key>`.
- `t` keys are namespaced by feature: `products.product.add_to_cart`, `cart.general.title`. Flat, feature-prefixed keys survive refactors.

## Theme Check rules that touch structure

| Rule | What it enforces |
|------|------------------|
| `ValidSchema` | Schema is valid JSON with known keys and types |
| `SchemaJsonFormat` | Schema is formatted as valid JSON (no trailing commas, no Liquid) |
| `TemplateLength` | Template files stay under 600 lines |
| `NestedSnippet` | Snippet nesting no deeper than 3 |
| `PaginationSize` | `paginate` uses a page size between 1 and 50 |
| `AppBlockValidTags` | App block markup uses allowed tags |
| `MatchingTranslations` | Locale files have the same keys |
| `DefaultLocale` | A default locale file exists |
| `MissingTemplate` / `MissingSnippet` / `MissingAsset` | Referenced files exist |
| `ContentForHeaderModification` | `content_for_header` is not modified |

## Sources

- https://shopify.dev/docs/storefronts/themes/architecture — directory contract, templates, layouts (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/architecture/templates — template types and suffixes (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates — `sections`, `order`, `layout`, `wrapper` (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema — schema keys, setting types, `enabled_on`, `locales` (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/architecture/blocks — blocks and `shopify_attributes` (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/architecture/locales — locale files (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/architecture/settings — settings schema and data (verified on 2026-11-20)
- https://shopify.dev/docs/storefronts/themes/tools/theme-check/checks — rule list (verified on 2026-11-20)
