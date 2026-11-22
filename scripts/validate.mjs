#!/usr/bin/env node
/**
 * validate.mjs - zero-dependency validator for the shopify-custom-skill repo.
 *
 * This is the executable test suite for the skill package. It encodes every
 * rule the skill must satisfy so that regressions fail CI instead of shipping.
 *
 * Run: node scripts/validate.mjs
 * Exit code 0 = all checks pass, 1 = at least one failure.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_NAME = 'shopify-custom-skill';
const SKILL_DIR = join(ROOT, 'skills', SKILL_NAME);
const SKILL_FILE = join(SKILL_DIR, 'SKILL.md');

const results = [];
function check(name, fn) {
  try {
    const detail = fn();
    results.push({ name, ok: true, detail: detail || '' });
  } catch (error) {
    results.push({ name, ok: false, detail: error.message });
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function read(file) {
  assert(existsSync(file), `missing file: ${rel(file)}`);
  return readFileSync(file, 'utf8');
}
function rel(file) {
  return file.slice(ROOT.length + 1).split('\\').join('/');
}
function lines(text) {
  return text.split(/\r?\n/);
}

/* ------------------------------------------------------------------ */
/* Minimal YAML subset parser (maps, nested maps, sequences, scalars)  */
/* ------------------------------------------------------------------ */
function parseYaml(text) {
  const rows = lines(text).filter((line) => line.trim() !== '' && !/^\s*#/.test(line));
  let index = 0;
  function scalar(raw) {
    const value = raw.trim();
    if (value === '' || value === '~' || value === 'null') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^-?\d+$/.test(value)) return Number(value);
    if (/^"(.*)"$/.test(value)) return value.slice(1, -1);
    if (/^'(.*)'$/.test(value)) return value.slice(1, -1);
    return value;
  }
  function block(indent) {
    const map = {};
    let list = null;
    while (index < rows.length) {
      const line = rows[index];
      const currentIndent = line.length - line.trimStart().length;
      if (currentIndent < indent) break;
      if (currentIndent > indent) throw new Error(`bad indentation on line: ${line.trim()}`);
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        if (!list) list = [];
        list.push(scalar(trimmed.slice(2)));
        index += 1;
        continue;
      }
      const match = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(trimmed);
      assert(match, `cannot parse YAML line: ${trimmed}`);
      const key = match[1];
      const rest = match[2];
      index += 1;
      if (rest === '' || rest === '>' || rest === '|') {
        if (rest === '>' || rest === '|') {
          const parts = [];
          while (index < rows.length) {
            const next = rows[index];
            const nextIndent = next.length - next.trimStart().length;
            if (nextIndent <= indent) break;
            parts.push(next.trim());
            index += 1;
          }
          map[key] = parts.join(' ');
        } else if (index < rows.length && rows[index].trimStart().startsWith('- ')) {
          map[key] = [];
          while (index < rows.length && rows[index].trimStart().startsWith('- ')) {
            map[key].push(scalar(rows[index].trim().slice(2)));
            index += 1;
          }
        } else if (index < rows.length && rows[index].length - rows[index].trimStart().length > indent) {
          map[key] = block(rows[index].length - rows[index].trimStart().length);
        } else {
          map[key] = null;
        }
      } else {
        map[key] = scalar(rest);
      }
    }
    return list && Object.keys(map).length === 0 ? list : map;
  }
  const parsed = block(0);
  return parsed;
}

function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  assert(match, 'SKILL.md has no YAML frontmatter block');
  return { data: parseYaml(match[1]), body: text.slice(match[0].length), raw: match[1] };
}

/* ------------------------------------------------------------------ */
/* Expected inventory                                                  */
/* ------------------------------------------------------------------ */
const REFERENCES = [
  'theme-architecture.md',
  'liquid-patterns.md',
  'security-checklist.md',
  'cli-and-qa.md',
  'storefront-api.md',
  'checkout-extensibility.md',
  'i18n-markets.md',
  'legal-and-analytics.md',
  'compatibility.md',
];
const ASSETS = [
  'section-template.liquid',
  'featured-product-card.liquid',
  'launch-checklist.md',
  'rubric.md',
];
const AGENTS = ['Claude Code', 'Codex', 'OpenCode', 'Qwen Code', 'Hermes Agent'];
const SECURITY_CHECKS = [
  'ACTIVE_UPLOADS_AND_PRIVILEGED_PREVIEWS',
  'APP_PROXY_LIQUID_INJECTION',
  'APP_PROXY_UNVERIFIED_SIGNATURE',
  'COMMITTED_SECRET',
  'CREDENTIAL_BROWSER_LEAKAGE',
  'CREDENTIAL_LOG_LEAKAGE',
  'CROSS_SITE_SCRIPTING',
  'CSRF_MISSING_PROTECTION',
  'DEPENDENCY_REACHABILITY',
  'DEPRECATED_SCRIPT_TAG_SCOPE',
  'EOL_API_VERSION',
  'EXPIRING_OFFLINE_TOKEN',
  'INSECURE_WEBHOOK_URL',
  'LIQUID_UNSAFE_RENDER',
  'METAFIELD_OFFLINE_TOKEN',
  'MISSING_AUTHORIZATION_CHECK',
  'MISSING_COMPLIANCE_WEBHOOKS',
  'MISSING_EMBEDDED_CSP',
  'MISSING_TENANT_ISOLATION',
  'OPEN_REDIRECT',
  'OVERBROAD_DATA_ACCESS',
  'REQUEST_CONTROLLED_ADMIN_CONTEXT',
  'REQUEST_DERIVED_SHOP_SCOPE',
  'SCOPE_OVER_REQUEST',
  'SCRIPT_TAG_URL_INJECTION',
  'SESSION_LIFECYCLE_AND_REPLAY',
  'SHARED_NAMESPACE_METAFIELD_RENDER',
  'SQL_INJECTION',
  'SSRF_REQUEST_FORGERY',
  'STATIC_FRAME_ANCESTORS',
  'TEXT_SETTING_HTML_SMUGGLING',
  'THEME_EXTENSION_XSS',
  'UNAUTHENTICATED_ENDPOINT',
  'UNSAFE_INNERHTML',
  'UNSCOPED_SHOP_CONFIG_WRITE',
  'WEAK_SHOP_VALIDATION',
];
const VERSION = '0.1.1';
// Severity published in Shopify/cli at
// packages/app/src/cli/services/app-security-engine/checks/<ID>.md on 2026-11-20.
// A drift here means the checklist teaches the wrong priority.
const SECURITY_SEVERITIES = {
  ACTIVE_UPLOADS_AND_PRIVILEGED_PREVIEWS: 'high',
  APP_PROXY_LIQUID_INJECTION: 'high',
  APP_PROXY_UNVERIFIED_SIGNATURE: 'high',
  COMMITTED_SECRET: 'high',
  CREDENTIAL_BROWSER_LEAKAGE: 'high',
  CREDENTIAL_LOG_LEAKAGE: 'high',
  CROSS_SITE_SCRIPTING: 'high',
  CSRF_MISSING_PROTECTION: 'medium',
  DEPENDENCY_REACHABILITY: 'medium',
  DEPRECATED_SCRIPT_TAG_SCOPE: 'medium',
  EOL_API_VERSION: 'low',
  EXPIRING_OFFLINE_TOKEN: 'medium',
  INSECURE_WEBHOOK_URL: 'high',
  LIQUID_UNSAFE_RENDER: 'medium',
  METAFIELD_OFFLINE_TOKEN: 'high',
  MISSING_AUTHORIZATION_CHECK: 'high',
  MISSING_COMPLIANCE_WEBHOOKS: 'medium',
  MISSING_EMBEDDED_CSP: 'medium',
  MISSING_TENANT_ISOLATION: 'high',
  OPEN_REDIRECT: 'medium',
  OVERBROAD_DATA_ACCESS: 'medium',
  REQUEST_CONTROLLED_ADMIN_CONTEXT: 'high',
  REQUEST_DERIVED_SHOP_SCOPE: 'high',
  SCOPE_OVER_REQUEST: 'high',
  SCRIPT_TAG_URL_INJECTION: 'high',
  SESSION_LIFECYCLE_AND_REPLAY: 'high',
  SHARED_NAMESPACE_METAFIELD_RENDER: 'medium',
  SQL_INJECTION: 'high',
  SSRF_REQUEST_FORGERY: 'high',
  STATIC_FRAME_ANCESTORS: 'high',
  TEXT_SETTING_HTML_SMUGGLING: 'high',
  THEME_EXTENSION_XSS: 'high',
  UNAUTHENTICATED_ENDPOINT: 'high',
  UNSAFE_INNERHTML: 'high',
  UNSCOPED_SHOP_CONFIG_WRITE: 'high',
  WEAK_SHOP_VALIDATION: 'high',
};
// Check names published in https://shopify.dev/docs/storefronts/themes/tools/theme-check/checks
// on 2026-11-20. The current CLI only runs these; the deprecated Ruby gem had a
// different set, which is why a legacy name in the docs is a bug.
const THEME_CHECK_CURRENT = [
  'AppBlockMissingSchema',
  'AppBlockValidTags',
  'AssetPreload',
  'AssetSizeAppBlockCSS',
  'AssetSizeAppBlockJavascript',
  'AssetSizeCSS',
  'AssetSizeJavaScript',
  'BlockIdUsage',
  'CdnPreconnect',
  'ContentForHeaderModification',
  'DeprecateBgsizes',
  'DeprecateLazysizes',
  'DeprecatedFilter',
  'DeprecatedFontsOnSectionsAndBlocks',
  'DeprecatedFontsOnSettingsData',
  'DeprecatedFontsOnSettingsSchema',
  'DeprecatedTag',
  'DuplicateContentForArguments',
  'DuplicateRenderSnippetArguments',
  'EmptyBlockContent',
  'ExcessiveSettingsCount',
  'HardcodedRoutes',
  'ImgWidthAndHeight',
  'JavascriptOncePerFile',
  'JavascriptTagInWrongFile',
  'JSONMissingBlock',
  'JSONMissingSection',
  'JSONSyntaxError',
  'LiquidComplexity',
  'LiquidFreeSettings',
  'LiquidHTMLSyntaxError',
  'LiquidNestingDepth',
  'LiquidSyntaxError',
  'MatchingTranslations',
  'MaxFileSize',
  'MissingAsset',
  'MissingContentForArguments',
  'MissingRenderSnippetArguments',
  'MissingTemplate',
  'OrphanedSnippet',
  'PaginationSize',
  'ParserBlockingScript',
  'RemoteAsset',
  'RequiredLayoutThemeObject',
  'ReservedDocParamNames',
  'SchemaOncePerFile',
  'SchemaPresetsBlockOrder',
  'SchemaPresetsStaticBlocks',
  'SchemaSectionOrBlockOnly',
  'StaticStylesheetAndJavascriptTags',
  'StylesheetOncePerFile',
  'StylesheetTagInWrongFile',
  'TranslationKeyExists',
  'UnclosedHTMLElement',
  'UndefinedObject',
  'UniqueDocParamNames',
  'UniqueStaticBlockId',
  'UnknownFilter',
  'UnrecognizedContentForArguments',
  'UnrecognizedRenderSnippetArguments',
  'UnsupportedDocTag',
  'UnsupportedFilterArguments',
  'UnusedAssign',
  'UnusedDocParam',
  'ValidBlockTarget',
  'ValidContentForArgumentTypes',
  'ValidContentForArguments',
  'ValidDocParamTypes',
  'ValidHTMLTranslation',
  'ValidLocalBlocks',
  'ValidRenderSnippetArgumentTypes',
  'ValidSchema',
  'ValidSchemaName',
  'ValidSchemaTranslations',
  'ValidScopedCSSClass',
  'ValidSettingsKey',
  'ValidStaticBlockType',
  'VariableName',
];
const THEME_CHECK_LEGACY = [
  'DefaultLocale',
  'ImgLazyLoading',
  'NestedSnippet',
  'ParserBlockingJavaScript',
  'SchemaJsonFormat',
  'TemplateLength',
  'UnusedSnippet',
  'MissingSnippet',
];
// Section schema keys and setting types published at
// https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema
// and .../settings/input-settings on 2026-11-20.
const SECTION_SCHEMA_KEYS = [
  'name',
  'tag',
  'class',
  'limit',
  'settings',
  'blocks',
  'max_blocks',
  'presets',
  'default',
  'enabled_on',
  'disabled_on',
  'locales',
];
const SETTING_TYPES = [
  'article',
  'article_list',
  'blog',
  'checkbox',
  'collection',
  'collection_list',
  'color',
  'color_background',
  'color_palette',
  'color_scheme',
  'color_scheme_group',
  'font_picker',
  'header',
  'html',
  'image_picker',
  'inline_richtext',
  'link_list',
  'liquid',
  'metaobject',
  'metaobject_list',
  'number',
  'page',
  'paragraph',
  'product',
  'product_list',
  'radio',
  'range',
  'richtext',
  'select',
  'text',
  'text_alignment',
  'textarea',
  'url',
  'video',
  'video_url',
];
// The 15 standard Web Pixel events published at
// https://shopify.dev/docs/api/web-pixels-api/standard-events on 2026-11-20.
const STANDARD_EVENTS = [
  'alert_displayed',
  'cart_viewed',
  'checkout_address_info_submitted',
  'checkout_completed',
  'checkout_contact_info_submitted',
  'checkout_shipping_info_submitted',
  'checkout_started',
  'collection_viewed',
  'page_viewed',
  'payment_info_submitted',
  'product_added_to_cart',
  'product_removed_from_cart',
  'product_viewed',
  'search_submitted',
  'ui_extension_errored',
];
// Targets present in https://shopify.dev/docs/api/checkout-ui-extensions/latest/targets
// on 2026-11-20. Any target named in the package must appear here, so a
// hallucinated target fails the build instead of shipping.
const CHECKOUT_TARGETS = [
  'purchase.checkout.actions.render-before',
  'purchase.checkout.block.render',
  'purchase.checkout.cart-line-item.render-after',
  'purchase.checkout.cart-line-list.render-after',
  'purchase.checkout.contact.render-after',
  'purchase.checkout.delivery-address.render-after',
  'purchase.checkout.delivery-address.render-before',
  'purchase.checkout.footer.render-after',
  'purchase.checkout.header.render-after',
  'purchase.checkout.payment-method-list.render-after',
  'purchase.checkout.payment-method-list.render-before',
  'purchase.checkout.pickup-location-list.render-after',
  'purchase.checkout.pickup-location-list.render-before',
  'purchase.checkout.pickup-location-option-item.render-after',
  'purchase.checkout.pickup-point-list.render-after',
  'purchase.checkout.pickup-point-list.render-before',
  'purchase.checkout.reductions.render-after',
  'purchase.checkout.reductions.render-before',
  'purchase.checkout.render-after',
  'purchase.checkout.render-before',
  'purchase.checkout.shipping-option-item.details.render',
  'purchase.checkout.shipping-option-item.render-after',
  'purchase.checkout.shipping-option-list.render-after',
  'purchase.checkout.shipping-option-list.render-before',
  'purchase.thank-you.announcement.render',
  'purchase.thank-you.block.render',
  'purchase.thank-you.cart-line-item.render-after',
  'purchase.thank-you.cart-line-list.render-after',
  'purchase.thank-you.customer-information.render-after',
  'purchase.thank-you.footer.render-after',
  'purchase.thank-you.header.render-after',
];

/* ------------------------------------------------------------------ */
/* A. Package structure                                                */
/* ------------------------------------------------------------------ */
check('A1 skill directory exists', () => {
  assert(existsSync(SKILL_DIR) && statSync(SKILL_DIR).isDirectory(), `missing ${rel(SKILL_DIR)}/`);
  return rel(SKILL_DIR);
});
check('A2 SKILL.md exists', () => {
  read(SKILL_FILE);
  return 'skills/shopify-custom-skill/SKILL.md';
});
check('A3 all reference files exist', () => {
  for (const name of REFERENCES) read(join(SKILL_DIR, 'references', name));
  return `${REFERENCES.length} references`;
});
check('A4 all asset files exist', () => {
  for (const name of ASSETS) read(join(SKILL_DIR, 'assets', name));
  return `${ASSETS.length} assets`;
});
check('A5 agents/openai.yaml exists', () => {
  read(join(SKILL_DIR, 'agents', 'openai.yaml'));
  return 'agents/openai.yaml';
});

/* ------------------------------------------------------------------ */
/* B. Frontmatter and spec compliance                                  */
/* ------------------------------------------------------------------ */
let parsed = null;
check('B1 frontmatter parses', () => {
  parsed = frontmatter(read(SKILL_FILE));
  return `keys: ${Object.keys(parsed.data).join(', ')}`;
});
check('B2 name equals directory and matches ^[a-z0-9-]+$', () => {
  const name = parsed?.data?.name;
  assert(name, 'frontmatter has no name');
  assert(name === SKILL_NAME, `name "${name}" must equal directory "${SKILL_NAME}"`);
  assert(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name), `name "${name}" is not lowercase kebab-case`);
  assert(name.length <= 64, 'name is longer than 64 characters');
  return name;
});
check('B3 description starts with "Use when" and is <= 500 chars', () => {
  const description = parsed?.data?.description;
  assert(description, 'frontmatter has no description');
  assert(/^Use when\b/.test(description), 'description must start with "Use when"');
  assert(description.length <= 500, `description is ${description.length} chars (max 500)`);
  assert(!/\n/.test(description), 'description must be a single line');
  return `${description.length} chars`;
});
check('B4 description does not summarize the workflow', () => {
  const description = parsed?.data?.description || '';
  const banned = /workflow|step-by-step|step 1|first .* then|phase 1/i;
  assert(!banned.test(description), 'description leaks process detail; keep triggers only');
  return 'triggers only';
});
check('B5 frontmatter uses portable keys only', () => {
  const allowed = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);
  const extra = Object.keys(parsed?.data || {}).filter((key) => !allowed.has(key));
  assert(extra.length === 0, `non-portable keys: ${extra.join(', ')}`);
  return Object.keys(parsed.data).join(', ');
});
check('B6 license declared as MIT', () => {
  assert(/^MIT$/i.test(String(parsed?.data?.license || '')), 'license must be MIT');
  return 'MIT';
});
check('B7 SKILL.md body under 500 lines', () => {
  const count = lines(parsed?.body || '').length;
  assert(count < 500, `body is ${count} lines (max 499)`);
  return `${count} lines`;
});
check('B8 metadata carries version and verified date', () => {
  const meta = parsed?.data?.metadata || {};
  assert(meta.version, 'metadata.version missing');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(String(meta['verified-on'] || '')), 'metadata.verified-on must be YYYY-MM-DD');
  return `v${meta.version} verified ${meta['verified-on']}`;
});

/* ------------------------------------------------------------------ */
/* C. Body quality                                                     */
/* ------------------------------------------------------------------ */
const REQUIRED_SECTIONS = [
  '## Precedence',
  '## Workflow',
  '## Liquid rules',
  '## Section and block rules',
  '## Cart and AJAX rules',
  '## Security gate',
  '## QA gate',
  '## Red flags',
  '## Verification gate',
];
check('C1 required sections present', () => {
  const body = parsed?.body || '';
  const missing = REQUIRED_SECTIONS.filter((heading) => !body.includes(heading));
  assert(missing.length === 0, `missing sections: ${missing.join(', ')}`);
  return `${REQUIRED_SECTIONS.length} sections`;
});
check('C2 no harness-specific tool invocations', () => {
  const body = parsed?.body || '';
  const banned = [
    'use the skill tool',
    'call the skill tool',
    'dispatch a subagent',
    'use the read tool',
    'use the todo',
    'todowrite',
    'delegate_task',
    'claude code only',
  ];
  const hits = banned.filter((phrase) => body.toLowerCase().includes(phrase));
  assert(hits.length === 0, `tool-specific phrasing: ${hits.join(', ')}`);
  return 'action-oriented language';
});
check('C3 no absolute paths in SKILL.md', () => {
  const body = parsed?.body || '';
  const hits = body.match(/[A-Za-z]:\\|\/Users\/|\/home\/|\/var\/www/);
  assert(!hits, `absolute path found: ${hits && hits[0]}`);
  return 'relative paths only';
});
check('C4 every reference file is linked from SKILL.md', () => {
  const body = parsed?.body || '';
  const missing = REFERENCES.filter((name) => !body.includes(`references/${name}`));
  assert(missing.length === 0, `not linked: ${missing.join(', ')}`);
  return `${REFERENCES.length} linked`;
});
check('C5 markdown links resolve', () => {
  const body = parsed?.body || '';
  const links = [...body.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)].map((m) => m[1]);
  const broken = [];
  for (const link of links) {
    if (/^https?:/.test(link) || link.startsWith('mailto:')) continue;
    assert(!link.includes('\\'), `backslash in link: ${link}`);
    const target = resolve(SKILL_DIR, link);
    if (!existsSync(target)) broken.push(link);
  }
  assert(broken.length === 0, `broken links: ${broken.join(', ')}`);
  return `${links.length} links`;
});
check('C5b referenced skill files exist', () => {
  const body = parsed?.body || '';
  const mentions = [...body.matchAll(/`((?:references|assets|agents)\/[^`\s]+)`/g)].map((m) => m[1]);
  assert(mentions.length > 0, 'SKILL.md references no files by path');
  const broken = mentions.filter((entry) => !existsSync(resolve(SKILL_DIR, entry)));
  assert(broken.length === 0, `missing: ${broken.join(', ')}`);
  return `${mentions.length} paths`;
});
check('C6 verification gate has an explicit STOP', () => {
  const body = parsed?.body || '';
  const section = body.split('## Verification gate')[1] || '';
  assert(/STOP/i.test(section), 'verification gate must contain a STOP condition');
  assert(/theme check|node scripts\/validate/.test(section), 'verification gate must name a command');
  return 'command + STOP';
});
check('C7 rationalization table present', () => {
  const body = parsed?.body || '';
  assert(/\|\s*(Rationalization|Excuse)\s*\|/i.test(body), 'missing rationalization table header');
  const rows = body.split('\n').filter((line) => /^\|\s*"/.test(line));
  assert(rows.length >= 5, `expected >= 5 rationalization rows, found ${rows.length}`);
  return `${rows.length} rows`;
});
check('C8 precedence section names the conflicting instruction files', () => {
  const body = parsed?.body || '';
  const section = body.split('## Precedence')[1] || '';
  for (const file of ['AGENTS.md', 'CLAUDE.md', 'SOUL.md']) {
    assert(section.includes(file), `precedence must mention ${file}`);
  }
  return 'AGENTS.md / CLAUDE.md / SOUL.md';
});
check('C9 no duplicated skill name across the repo', () => {
  const matches = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'SKILL.md') matches.push(full);
    }
  };
  if (existsSync(join(ROOT, 'skills'))) walk(join(ROOT, 'skills'));
  assert(matches.length === 1, `expected exactly one SKILL.md, found ${matches.length}`);
  return rel(matches[0]);
});

/* ------------------------------------------------------------------ */
/* D. Reference files                                                  */
/* ------------------------------------------------------------------ */
check('D1 references stay under 800 lines', () => {
  const sizes = REFERENCES.map((name) => {
    const count = lines(read(join(SKILL_DIR, 'references', name))).length;
    assert(count < 800, `${name} is ${count} lines`);
    return `${name}:${count}`;
  });
  return sizes.join(' ');
});
check('D2 every reference cites sources with a verified date', () => {
  for (const name of REFERENCES) {
    const text = read(join(SKILL_DIR, 'references', name));
    assert(/## Sources/.test(text), `${name} has no "## Sources" section`);
    assert(/https:\/\//.test(text), `${name} has no source URL`);
    assert(/[Vv]erified( on)?\s*:?\s*\d{4}-\d{2}-\d{2}|verifiedOn.*\d{4}-\d{2}-\d{2}/.test(text), `${name} has no verified date`);
  }
  return `${REFERENCES.length} files`;
});
check('D3 security checklist covers all 36 official checks', () => {
  const text = read(join(SKILL_DIR, 'references', 'security-checklist.md'));
  const missing = SECURITY_CHECKS.filter((id) => !text.includes(id));
  assert(missing.length === 0, `missing checks: ${missing.join(', ')}`);
  return `${SECURITY_CHECKS.length} checks`;
});
check('D4 security checklist gives severity and a fix for each check', () => {
  const text = read(join(SKILL_DIR, 'references', 'security-checklist.md'));
  const rows = text.split('\n').filter((line) => SECURITY_CHECKS.some((id) => line.includes(`| ${id} |`)));
  assert(rows.length >= SECURITY_CHECKS.length, `expected ${SECURITY_CHECKS.length} table rows, found ${rows.length}`);
  for (const row of rows) {
    assert(/\|\s*(high|medium|low)\s*\|/i.test(row), `row without severity: ${row.slice(0, 60)}`);
    assert(row.split('|').length >= 6, `row without fix/verify column: ${row.slice(0, 60)}`);
  }
  return `${rows.length} rows with severity`;
});
check('D5 compatibility matrix names all five agents', () => {
  const text = read(join(SKILL_DIR, 'references', 'compatibility.md'));
  const missing = AGENTS.filter((agent) => !text.includes(agent));
  assert(missing.length === 0, `missing agents: ${missing.join(', ')}`);
  return AGENTS.join(', ');
});
check('D6 compatibility matrix lists discovery paths', () => {
  const text = read(join(SKILL_DIR, 'references', 'compatibility.md'));
  for (const fragment of ['.agents/skills', '.claude/skills', '.opencode/skills', '.qwen/skills', '.hermes/skills']) {
    assert(text.includes(fragment), `missing path fragment ${fragment}`);
  }
  return '5 path families';
});

/* ------------------------------------------------------------------ */
/* E. Manifests                                                        */
/* ------------------------------------------------------------------ */
const JSON_MANIFESTS = [
  'plugin.json',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  '.cursor-plugin/plugin.json',
  'gemini-extension.json',
];
check('E1 JSON manifests parse and carry name/version', () => {
  const out = [];
  for (const file of JSON_MANIFESTS) {
    const data = JSON.parse(read(join(ROOT, file)));
    assert(data.name, `${file} has no name`);
    if (file !== '.claude-plugin/marketplace.json') {
      assert(data.version, `${file} has no version`);
      assert(String(data.version) === VERSION, `${file} version ${data.version} != ${VERSION}`);
    }
    out.push(file);
  }
  return `${out.length} manifests`;
});
check('E2 plugin.json points at the skills directory', () => {
  const data = JSON.parse(read(join(ROOT, 'plugin.json')));
  assert(data.skills === './skills/', `plugin.json skills must be "./skills/", got ${data.skills}`);
  assert(Array.isArray(data.keywords) && data.keywords.includes('shopify'), 'plugin.json keywords must include shopify');
  return 'skills: ./skills/';
});
check('E3 claude marketplace exposes a plugin with a local source', () => {
  const data = JSON.parse(read(join(ROOT, '.claude-plugin/marketplace.json')));
  assert(Array.isArray(data.plugins) && data.plugins.length >= 1, 'marketplace.json needs a plugins array');
  const plugin = data.plugins[0];
  assert(plugin.name, 'marketplace plugin needs a name');
  assert(plugin.source, 'marketplace plugin needs a source');
  assert(data.owner && data.owner.name, 'marketplace.json needs owner.name');
  return `${data.plugins.length} plugin(s)`;
});
check('E4 hermes plugin.yaml declares the skill', () => {
  const data = parseYaml(read(join(ROOT, '.hermes-plugin', 'plugin.yaml')));
  assert(data.name, 'plugin.yaml has no name');
  assert(String(data.version) === VERSION, `plugin.yaml version ${data.version} != ${VERSION}`);
  assert(Array.isArray(data.provides_skills), 'plugin.yaml needs provides_skills list');
  assert(data.provides_skills.includes(SKILL_NAME), `provides_skills must include ${SKILL_NAME}`);
  assert(data.homepage, 'plugin.yaml needs homepage');
  return data.provides_skills.join(', ');
});
check('E5 openai.yaml exposes interface and invocation policy', () => {
  const data = parseYaml(read(join(SKILL_DIR, 'agents', 'openai.yaml')));
  const iface = data.interface || {};
  assert(iface.display_name, 'interface.display_name missing');
  assert(iface.short_description, 'interface.short_description missing');
  assert(iface.default_prompt, 'interface.default_prompt missing');
  assert(iface.default_prompt.length <= 200, 'default_prompt should stay short');
  assert(data.policy && typeof data.policy.allow_implicit_invocation === 'boolean', 'policy.allow_implicit_invocation missing');
  return iface.display_name;
});
check('E6 every manifest uses the same skill description keywords', () => {
  const plugin = JSON.parse(read(join(ROOT, 'plugin.json')));
  assert(/shopify/i.test(plugin.description), 'plugin description must mention Shopify');
  const claude = JSON.parse(read(join(ROOT, '.claude-plugin', 'plugin.json')));
  assert(claude.name === plugin.name, 'claude plugin name must match plugin.json');
  return plugin.name;
});

/* ------------------------------------------------------------------ */
/* F. Repository documentation                                         */
/* ------------------------------------------------------------------ */
check('F1 README documents installation for all five agents', () => {
  const text = read(join(ROOT, 'README.md'));
  const missing = AGENTS.filter((agent) => !text.includes(agent));
  assert(missing.length === 0, `README missing agents: ${missing.join(', ')}`);
  assert(text.includes('npx skills add'), 'README must show the skills.sh install command');
  assert(/sasxdj-cmyk\/shopify-skill/.test(text), 'README must reference the repo slug');
  return '5 agents + skills.sh';
});
check('F2 README is bilingual', () => {
  const text = read(join(ROOT, 'README.md'));
  assert(/Italiano/.test(text) && /English/.test(text), 'README needs EN/IT language switch');
  return 'EN + IT';
});
check('F3 LICENSE contains the MIT text', () => {
  const text = read(join(ROOT, 'LICENSE'));
  assert(/MIT License/.test(text), 'LICENSE must be the MIT license');
  assert(/Salvatore Cuccaro/.test(text), 'LICENSE must name the copyright holder');
  return 'MIT';
});
check('F4 CHANGELOG, CONTRIBUTING and SECURITY exist', () => {
  for (const file of ['CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md']) read(join(ROOT, file));
  return '3 docs';
});
check('F5 CHANGELOG starts with the current version', () => {
  const text = read(join(ROOT, 'CHANGELOG.md'));
  const first = text.match(/##\s*\[?(\d+\.\d+\.\d+)/);
  assert(first, 'CHANGELOG has no version heading');
  assert(first[1] === VERSION, `CHANGELOG starts at ${first[1]}, expected ${VERSION}`);
  return `v${first[1]}`;
});

/* ------------------------------------------------------------------ */
/* G. CI                                                               */
/* ------------------------------------------------------------------ */
check('G1 CI workflow runs the validator', () => {
  const text = read(join(ROOT, '.github', 'workflows', 'validate.yml'));
  assert(/node scripts\/validate\.mjs/.test(text), 'workflow must run node scripts/validate.mjs');
  assert(/markdownlint|lychee|link/i.test(text), 'workflow must check docs or links');
  return 'validate.yml';
});

/* ------------------------------------------------------------------ */
/* H. Asset sanity                                                     */
/* ------------------------------------------------------------------ */
check('H1 Liquid block tags are balanced in assets', () => {
  const dir = join(SKILL_DIR, 'assets');
  const files = readdirSync(dir).filter((name) => name.endsWith('.liquid'));
  const pairs = [
    ['if', 'endif'],
    ['unless', 'endunless'],
    ['for', 'endfor'],
    ['case', 'endcase'],
    ['capture', 'endcapture'],
    ['form', 'endform'],
    ['paginate', 'endpaginate'],
    ['schema', 'endschema'],
    ['style', 'endstyle'],
    ['stylesheet', 'endstylesheet'],
    ['javascript', 'endjavascript'],
  ];
  const problems = [];
  for (const file of files) {
    let text = read(join(dir, file));
    text = text.replace(/\{%-?\s*liquid\b[\s\S]*?-?%\}/g, '');
    text = text.replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '');
    for (const [open, close] of pairs) {
      const openCount = (text.match(new RegExp(`\\{%-?\\s*${open}\\b`, 'g')) || []).length;
      const closeCount = (text.match(new RegExp(`\\{%-?\\s*${close}\\b`, 'g')) || []).length;
      if (openCount !== closeCount) problems.push(`${file}: ${open}=${openCount} ${close}=${closeCount}`);
    }
  }
  assert(problems.length === 0, problems.join('; '));
  return `${files.length} liquid assets balanced`;
});
check('H2 section schema in the asset is valid JSON', () => {
  const text = read(join(SKILL_DIR, 'assets', 'section-template.liquid'));
  const match = /\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/.exec(text);
  assert(match, 'no schema block found in section-template.liquid');
  const schema = JSON.parse(match[1]);
  assert(schema.name, 'schema has no name');
  assert(Array.isArray(schema.settings), 'schema has no settings array');
  assert(Array.isArray(schema.presets) && schema.presets.length > 0, 'schema has no presets');
  assert(Array.isArray(schema.blocks), 'schema has no blocks array');
  const ids = schema.settings.map((setting) => setting.id).filter(Boolean);
  assert(new Set(ids).size === ids.length, 'duplicate setting ids in schema');
  for (const setting of schema.settings) {
    assert(setting.label, `setting ${setting.id} has no label`);
  }
  return `${ids.length} settings, ${schema.blocks.length} block type(s)`;
});

/* ------------------------------------------------------------------ */
/* I. Cross-file factual consistency                                   */
/* ------------------------------------------------------------------ */
check('I1 every checkout target is a real target', () => {
  const dir = join(SKILL_DIR, 'references');
  const files = [...readdirSync(dir).filter((n) => n.endsWith('.md')).map((n) => join(dir, n)), SKILL_FILE];
  const known = new Set(CHECKOUT_TARGETS);
  const problems = [];
  for (const file of files) {
    const text = read(file);
    for (const match of text.matchAll(/\bpurchase\.(?:checkout|thank-you)\.[a-z0-9.\-]+[a-z0-9]/g)) {
      const target = match[0].replace(/-$/, '');
      if (!known.has(target)) problems.push(`${target} in ${file.split(/[\\/]/).pop()}`);
    }
  }
  assert(problems.length === 0, `unknown target(s): ${[...new Set(problems)].join(', ')}`);
  return `${known.size} pinned targets`;
});
check('I2 assets named in the docs exist', () => {
  const docs = [join(ROOT, 'README.md'), join(ROOT, 'CHANGELOG.md'), SKILL_FILE];
  const problems = [];
  for (const file of docs) {
    const text = read(file);
    for (const match of text.matchAll(/`(assets\/[a-z0-9\-]+\.(?:liquid|md))`/g)) {
      if (!existsSync(join(SKILL_DIR, match[1]))) problems.push(`${match[1]} in ${file.split(/[\\/]/).pop()}`);
    }
  }
  assert(problems.length === 0, `missing: ${problems.join(', ')}`);
  return `${ASSETS.length} assets pinned`;
});
check('I3 asset docs point at the real install path', () => {
  const text = read(join(SKILL_DIR, 'assets', 'section-template.liquid'));
  assert(/snippets\/featured-product-card\.liquid/.test(text), 'section must document its snippet path');
  const card = read(join(SKILL_DIR, 'assets', 'featured-product-card.liquid'));
  assert(/snippets\/featured-product-card\.liquid/.test(card), 'card must document its own path');
  return 'snippets/featured-product-card.liquid';
});
check('I4 Theme Check names are current, not legacy', () => {
  const file = join(SKILL_DIR, 'references', 'cli-and-qa.md');
  const lines = read(file).split('\n');
  const current = new Set(THEME_CHECK_CURRENT);
  const legacy = new Set(THEME_CHECK_LEGACY);
  const problems = [];
  let counted = 0;
  for (const line of lines) {
    const legacyLine = /^Legacy names to avoid/.test(line);
    const cell = /^\|\s*`([^`]+)`/.exec(line);
    if (cell) {
      for (const name of cell[1].split('/').map((n) => n.trim())) {
        counted += 1;
        if (!current.has(name)) problems.push(`not a current check: ${name}`);
      }
    }
    for (const name of legacy) {
      if (new RegExp(`\\b${name}\\b`).test(line) && !legacyLine) problems.push(`legacy name outside the warning: ${name}`);
    }
  }
  assert(problems.length === 0, problems.join('; '));
  assert(counted >= 20, `only ${counted} check names documented`);
  return `${counted} current checks, ${legacy.size} legacy names quarantined`;
});
check('I5 schema keys and setting types are real', () => {
  const file = join(SKILL_DIR, 'references', 'theme-architecture.md');
  const text = read(file);
  const problems = [];
  const typesSection = text.split('## Setting types')[1] || '';
  const typeNames = [];
  for (const line of typesSection.split('\n')) {
    const cell = /^\|\s*`([a-z_]+)`/.exec(line);
    if (cell) {
      typeNames.push(cell[1]);
      if (!SETTING_TYPES.includes(cell[1])) problems.push(`unknown setting type: ${cell[1]}`);
    }
  }
  const keysSection = text.split('| Key | Required | Meaning |')[1] || '';
  const keyNames = [];
  for (const line of keysSection.split('\n').slice(0, 20)) {
    for (const match of line.matchAll(/`([a-z_]+)`/g)) {
      if (SECTION_SCHEMA_KEYS.includes(match[1])) keyNames.push(match[1]);
    }
  }
  assert(problems.length === 0, problems.join('; '));
  assert(typeNames.length >= 30, `only ${typeNames.length} setting types documented`);
  assert(new Set(keyNames).size >= 8, `only ${new Set(keyNames).size} schema keys documented`);
  return `${typeNames.length} setting types, ${new Set(keyNames).size} schema keys`;
});
check('I6 Web Pixel events are standard events', () => {
  const file = join(SKILL_DIR, 'references', 'legal-and-analytics.md');
  const text = read(file);
  const known = new Set(STANDARD_EVENTS);
  const used = [...text.matchAll(/analytics\.subscribe\(\s*'([a-z_]+)'/g)].map((m) => m[1]);
  const bad = used.filter((name) => !known.has(name));
  assert(used.length > 0, 'no analytics.subscribe call found in the reference');
  assert(bad.length === 0, `not a standard event: ${bad.join(', ')}`);
  const listed = STANDARD_EVENTS.filter((name) => new RegExp(`\`${name}\``).test(text));
  assert(listed.length === STANDARD_EVENTS.length, `only ${listed.length} of ${STANDARD_EVENTS.length} events documented`);
  return `${used.length} subscriptions, ${listed.length} events documented`;
});
check('I7 security severities match the official source', () => {
  const file = join(SKILL_DIR, 'references', 'security-checklist.md');
  const problems = [];
  let seen = 0;
  for (const line of read(file).split('\n')) {
    const cell = /^\|\s*([A-Z][A-Z_]{6,})\s*\|\s*([a-z]+)\s*\|/.exec(line);
    if (!cell) continue;
    seen += 1;
    const [, id, severity] = cell;
    if (!(id in SECURITY_SEVERITIES)) problems.push(`${id} is not an official check id`);
    else if (SECURITY_SEVERITIES[id] !== severity) problems.push(`${id}: ${severity} != ${SECURITY_SEVERITIES[id]}`);
  }
  assert(seen === SECURITY_CHECKS.length, `documented ${seen} rows, expected ${SECURITY_CHECKS.length}`);
  assert(problems.length === 0, problems.join('; '));
  return `${seen} severities match the pinned source`;
});

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */
const failed = results.filter((result) => !result.ok);
const width = Math.max(...results.map((result) => result.name.length));
for (const result of results) {
  const mark = result.ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${result.name.padEnd(width)}  ${result.detail}`);
}
console.log('');
console.log(`${results.length - failed.length}/${results.length} checks passed`);
if (failed.length > 0) {
  console.log(`\n${failed.length} failing check(s).`);
  process.exit(1);
}
console.log('Skill package is valid.');
