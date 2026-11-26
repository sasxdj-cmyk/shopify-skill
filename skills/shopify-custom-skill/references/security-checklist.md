# Security checklist

The 36 checks Shopify's own app security engine runs, adapted for theme, storefront and app-proxy code. The canonical source is the `checks/` directory in Shopify's CLI: each file carries `id`, `version` and `severity`. When the CLI changes, that directory wins over this page.

**Contents:** [How to use this](#how-to-use-this) · [Findings format](#findings-format) · [Checks by area](#checks-by-area) · [Quick greps](#quick-greps) · [Storefront-specific rules](#storefront-specific-rules) · [Sources](#sources)

## How to use this

1. Run the checks that apply to the code you touched, not all 36 every time. The area tables tell you which ones a change can break.
2. For every check, record `id`, file:line, why the value is attacker-reachable, severity, fix and verification.
3. Any open `high` finding blocks a launch. `medium` needs a written decision. `low` is tracked.
4. Never paste a real secret, token or customer record into a report, commit message, ticket or chat. Cite the file and the redacted credential kind, and recommend rotation.

Severity comes from Shopify's check definitions, not from taste. Do not downgrade a `high` because the store is small.

## Findings format

```text
CHECK: CROSS_SITE_SCRIPTING
FILE: sections/promo.liquid:12
REACHABLE: shop.metafields.promo.html is merchant-writable and any app with write_metafields can set it
IMPACT: script execution on every storefront page, session and checkout data theft
FIX: render through metafield_tag for rich text; escape for plain text; remove innerHTML
VERIFY: set the metafield to "><img src=x onerror=alert(1)> and confirm it renders literally
```

## Checks by area

### Storefront rendering and XSS

| Check | Severity | Detect | Fix | Verify |
|-------|----------|--------|-----|--------|
| CROSS_SITE_SCRIPTING | high | Liquid output reaching HTML, an attribute or a script without a sink-appropriate filter; reflected values from `request` params; stored values from metafields, settings or app data | Escape at the sink: `escape` for HTML and attributes, `json` for scripts, `url_encode` for query strings; remove `innerHTML` sinks | Inject `"><img src=x onerror=alert(1)>` into every merchant-editable field and confirm it renders literally |
| LIQUID_UNSAFE_RENDER | medium | Liquid in theme app extensions or templates the parser could not analyse, printing values into an active response | Escape every dynamic value; keep static templates static; do not concatenate HTML strings | Render the extension with a payload value and inspect the DOM for injected nodes |
| THEME_EXTENSION_XSS | high | Theme app extension Liquid printing unescaped merchant, customer or app data | Escape at output; validate types; never trust app-injected metafields | Same payload test against the extension's storefront output |
| TEXT_SETTING_HTML_SMUGGLING | high | `text`/`textarea` settings rendered as HTML, or custom JS that trusts a text setting | Render text as text; use `richtext` for formatted content and the documented rich-text path | Put `<b>x</b>` in the setting and confirm it is displayed, not parsed |
| UNSAFE_INNERHTML | high | `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` with data from settings, metafields, URL or API | `textContent`, DOM construction, or a sanitizer with an allowlist; never sanitize with regex | Payload in the source field; confirm no execution and no injected element |
| APP_PROXY_LIQUID_INJECTION | high | Verified app-proxy request values reaching Liquid or HTML response bodies | Escape proxy values at the sink; return inert JSON when the client does not need HTML | Send a proxy request with `<script>` in a parameter and inspect the response body |
| SHARED_NAMESPACE_METAFIELD_RENDER | medium | Rendering metafields or metaobjects from a namespace any installed app can write | Use an app-owned namespace; treat shared-namespace values as untrusted and escape them | Check the namespace owner and the write scopes of installed apps |

### Uploads and active content

| Check | Severity | Detect | Fix | Verify |
|-------|----------|--------|-----|--------|
| ACTIVE_UPLOADS_AND_PRIVILEGED_PREVIEWS | high | Merchant, customer or webhook uploads rendered later as SVG, HTML, XML, PDF, blob or data URLs in a privileged origin | Allowlist extensions and MIME types, serve from a separate origin, force `Content-Disposition: attachment`, sanitize SVG | Upload an SVG containing `<script>` and confirm it cannot execute in the admin or storefront origin |

### Secrets and credentials

| Check | Severity | Detect | Fix | Verify |
|-------|----------|--------|-----|--------|
| COMMITTED_SECRET | high | Admin tokens, API keys, app secrets or `.env` contents in the repo or theme assets | Remove, rotate, load from environment or app config; add a secret scanner to CI | `git log -S` for the value; confirm the rotated credential returns 401 |
| CREDENTIAL_LOG_LEAKAGE | high | Tokens or secrets passed to console, logger, telemetry or error reporting | Redact at the logger boundary; log identifiers, never credentials | Trigger the log path and confirm only redacted values appear |
| CREDENTIAL_BROWSER_LEAKAGE | high | Tokens in Liquid-rendered globals, DOM nodes, `data-` attributes, client bundles or outbound browser requests | Never ship a credential to the storefront; move the call server-side or behind an app proxy | View source and the network panel; grep the bundle for the token prefix |
| METAFIELD_OFFLINE_TOKEN | high | Offline access tokens written into metafields or metaobjects, readable by later unauthenticated renders | Store tokens server-side; metafields hold display data only | Inspect the metafield value in the admin and in the storefront response |

### Authentication, authorization, tenancy

| Check | Severity | Detect | Fix | Verify |
|-------|----------|--------|-----|--------|
| MISSING_AUTHORIZATION_CHECK | high | Route handlers that load or mutate a resource without checking the current user's right to it | Authorize after authentication, on every path, against the authenticated session | Request another shop's or customer's resource id and expect 403/404 |
| UNAUTHENTICATED_ENDPOINT | high | Handlers reaching shop-scoped reads or writes without a verified request on every path | Require a verified session, HMAC or signed token before any data access | Call the endpoint without credentials and confirm rejection |
| MISSING_TENANT_ISOLATION | high | Queries that can read or write another shop's row because the shop filter is missing or client-supplied | Scope every query by the authenticated shop; enforce at the data layer | Swap the shop id in the request and confirm no cross-tenant data |
| REQUEST_DERIVED_SHOP_SCOPE | high | Shop selector taken from params, headers or token-exchange arguments instead of the authenticated installation | Derive the shop from the session or the verified installation record | Forge a shop parameter and confirm the request is rejected |
| REQUEST_CONTROLLED_ADMIN_CONTEXT | high | Request-derived shop selectors reaching `unauthenticated.admin(...)` or `unauthenticated.storefront(...)` | Bind the context to the authenticated shop; never pass request values | Change the selector in the request and confirm the Admin call does not follow it |
| UNSCOPED_SHOP_CONFIG_WRITE | high | Configuration writes whose target shop comes from an untrusted selector | Write only to the authenticated shop; validate the target | Attempt a cross-shop config write and expect rejection |
| WEAK_SHOP_VALIDATION | high | Shop-domain validation that is unanchored, suffix-only or accepts arbitrary hosts | Anchored exact-match against `*.myshopify.com` or the verified custom domain | Submit `evil-myshopify.com` and `shop.myshopify.com.evil.com`; both must fail |
| OVERBROAD_DATA_ACCESS | medium | API responses returning full records where the caller needs a subset | Return only required fields; redact customer PII | Inspect responses for fields the UI never uses |
| SCOPE_OVER_REQUEST | high | OAuth scopes requested but unused, or used beyond the merchant's grant | Request the minimum scopes; remove unused ones; re-consent when expanding | Compare `shopify.app.toml` scopes with actual API usage |
| SESSION_LIFECYCLE_AND_REPLAY | high | Sessions, tokens, signed URLs or state-changing endpoints still usable after they should expire, or replayable | Expire on logout and on privilege change; use nonces and single-use tokens; verify timestamps | Replay a used token and confirm rejection |
| EXPIRING_OFFLINE_TOKEN | medium | Offline tokens without expiry and refresh metadata in session storage | Enable expiring offline tokens and persist `expires`, `refreshToken`, `refreshTokenExpires` | Force expiry and confirm the refresh path works |

### Injection and request forgery

| Check | Severity | Detect | Fix | Verify |
|-------|----------|--------|-----|--------|
| SQL_INJECTION | high | Lower-trust input concatenated into SQL instead of bound parameters | Parameterized queries; allowlist identifiers; never build SQL strings | Send `' OR 1=1 --` and confirm it is treated as data |
| SSRF_REQUEST_FORGERY | high | Server-side HTTP requests to URLs derived from user input | Allowlist hosts and schemes, block link-local and metadata addresses, no redirects to internal hosts | Submit `http://169.254.169.254/` and an internal hostname; both must be rejected |
| OPEN_REDIRECT | medium | Redirect targets built from request input without validation | Allowlist relative paths or known hosts; reject absolute URLs by default | Request `?next=https://evil.example` and confirm no redirect |
| CSRF_MISSING_PROTECTION | medium | State-changing endpoints (POST/PUT/PATCH/DELETE) without CSRF verification | SameSite cookies plus a per-session token; verify origin; never rely on GET for state changes | Post from a foreign origin and expect rejection |

### Webhooks and proxies

| Check | Severity | Detect | Fix | Verify |
|-------|----------|--------|-----|--------|
| APP_PROXY_UNVERIFIED_SIGNATURE | high | Proxy handlers reading `shop`, `logged_in_customer_id` or `path_prefix` without verifying the `signature` parameter | HMAC-SHA256 over the sorted, URL-encoded parameters (excluding `signature`) with the app secret; timing-safe compare | Send a proxy request with a tampered parameter and expect 401 |
| INSECURE_WEBHOOK_URL | high | `http://` destinations, credentials in the URL, or a redirect URI outside the app domain | HTTPS only, no credentials, allowlisted hosts, valid pubsub/EventBridge destinations | Inspect `shopify.app.toml` and the app config for every destination |
| MISSING_COMPLIANCE_WEBHOOKS | medium | Missing `shop/redact`, `customers/data_request` or `customers/redact` in the app config | Declare all three and implement handlers that actually delete or export | Trigger each topic and confirm the handler runs and logs the shop |

### Browser and embedding

| Check | Severity | Detect | Fix | Verify |
|-------|----------|--------|-----|--------|
| MISSING_EMBEDDED_CSP | medium | Embedded app responses without a `frame-ancestors` directive | `frame-ancestors https://*.myshopify.com https://admin.shopify.com` | Inspect the response headers on the embedded route |
| STATIC_FRAME_ANCESTORS | high | Wildcard or static cross-shop `frame-ancestors` such as `*` or a hardcoded single shop | Derive the allowed ancestors from the authenticated shop; never `*` | Load the app from an unlisted shop and confirm the frame is refused |
| DEPRECATED_SCRIPT_TAG_SCOPE | medium | `read_script_tags` / `write_script_tags` scopes or ScriptTag create/update calls | Remove ScriptTag usage; use theme app extensions | Grep scopes and API calls; confirm none remain |
| SCRIPT_TAG_URL_INJECTION | high | ScriptTag URLs derived from user input | Remove ScriptTag; if unavoidable, hardcode the URL | Inspect every ScriptTag creation for dynamic input |

### Dependencies and versions

| Check | Severity | Detect | Fix | Verify |
|-------|----------|--------|-----|--------|
| DEPENDENCY_REACHABILITY | medium | A vulnerable package version present, with a call path that actually reaches the vulnerable behaviour | Upgrade, patch, or prove the path is unreachable and document it | Reproduce the vulnerable call, then confirm it no longer resolves |
| EOL_API_VERSION | low | Pinned API version outside the support window (quarterly releases; each stable version is supported for a minimum of 12 months and stays accessible until the 16th of the month after that anniversary) | Move to a supported version and retest queries | Call the API and confirm `X-Shopify-API-Version` echoes the version you asked for, not a fall-forward |

## Quick greps

Run from the theme root. These find candidates, not conclusions.

```bash
# unescaped output in attributes and scripts
grep -rn --include=*.liquid -E '\{\{[^}]*\}\}' sections snippets layout | grep -v 'escape\|json\|t }}' | head -50

# dangerous DOM sinks
grep -rn --include=*.js -E 'innerHTML|outerHTML|insertAdjacentHTML|document\.write' assets sections snippets

# secrets and token prefixes
grep -rn -E 'shpat_|shpca_|shppa_|shpss_|BEGIN (RSA|EC) PRIVATE KEY' . --include=*.liquid --include=*.js --include=*.json

# inline handlers and javascript: URLs
grep -rn --include=*.liquid -E 'on(click|load|error|mouseover)=|javascript:' .

# script tags built from settings
grep -rn --include=*.liquid -E '<script[^>]+src="\{\{' .

# forms not using the form tag
grep -rn --include=*.liquid -E '<form[^>]+action=' . | grep -v '{%- form\|{% form'

# content_for_header edits
grep -rn --include=*.liquid 'content_for_header' . | grep -v '{{ content_for_header }}'

# API versions
grep -rn -E 'apiVersion|ApiVersion|202[0-9]-[0-9]{2}' .
```

## Storefront-specific rules

These are not separate checks; they are how the checks above apply to a theme.

- A **public Storefront API token** in theme code is expected and safe for public data. An **Admin API token** in theme code is a breach (`COMMITTED_SECRET`, `CREDENTIAL_BROWSER_LEAKAGE`).
- The storefront cannot set arbitrary response headers, so CSP hardening belongs to the app, the proxy or Hydrogen, not to `theme.liquid`. Do not claim you added a CSP to a Liquid theme.
- `{{ content_for_header }}` carries Shopify's own scripts and must never be filtered, deferred or moved.
- Theme app extensions run in the merchant's storefront with the merchant's cookies: they are first-party XSS surface (`THEME_EXTENSION_XSS`, `LIQUID_UNSAFE_RENDER`).
- App blocks render app-provided markup inside the theme. Escape your own values and do not inject app HTML through `innerHTML`.
- Metafields written by multiple apps share a namespace risk (`SHARED_NAMESPACE_METAFIELD_RENDER`). Use `$app:<name>` namespaces for app data.
- Password pages and gift card templates are public too; they need the same escaping.

## Sources

- https://github.com/Shopify/cli/tree/main/packages/app/src/cli/services/app-security-engine/checks — 36 check definitions with `id`, `version`, `severity` (verified on 2026-11-20)
- https://shopify.dev/docs/apps/build/security — app security overview (verified on 2026-11-20)
- https://shopify.dev/docs/apps/build/webhooks — HMAC verification for webhooks (verified on 2026-11-20)
- https://shopify.dev/docs/apps/build/online-store/app-proxies — proxy signature verification (verified on 2026-11-20)
- https://shopify.dev/docs/apps/build/online-store/theme-app-extensions — extension rendering context (verified on 2026-11-20)
- https://shopify.dev/docs/apps/build/authentication-authorization — session and token lifecycle (verified on 2026-11-20)
- https://shopify.dev/docs/api/usage/versioning — 12-month minimum support, nine-month overlap, fall-forward and the `X-Shopify-API-Version` header (verified on 2026-11-25)
