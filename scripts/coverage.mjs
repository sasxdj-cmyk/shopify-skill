#!/usr/bin/env node
/**
 * coverage.mjs - rubric coverage, a deterministic alternative to a
 * behavioural scoring round.
 *
 * Why this exists
 * ---------------
 * The rubric in assets/rubric.md grades an *agent's answer* on five
 * scenarios. Measuring that requires running an agent, and delegated runs
 * are unavailable in the environment this skill is maintained in (they fail
 * with a provider quota error before answering). Inventing a score is not an
 * option, so this script asks the question that *can* be answered offline:
 *
 *   Does the skill still contain the material every rubric check grades?
 *
 * Each check below is one line of the rubric, expressed as probes over the
 * skill's own text. A missing probe means the skill lost the ability to
 * answer that rubric line, even if every file still parses. It is coverage,
 * not quality: it cannot tell you an agent used the material well, and the
 * output says so.
 *
 * Run: node scripts/coverage.mjs
 * Exit code 0 = every rubric check is covered, 1 = at least one is missing.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_DIR = join(ROOT, 'skills', 'shopify-custom-skill');

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(md|liquid)$/.test(entry.name)) continue;
    files.push({ name: full.slice(SKILL_DIR.length + 1).split('\\').join('/'), text: readFileSync(full, 'utf8') });
  }
};
walk(SKILL_DIR);
const corpus = files.map((file) => file.text).join('\n');

/**
 * A check passes only when every probe matches somewhere in the package.
 * Probes are regexes over markdown and liquid, so they survive rewording but
 * fail when a fact is deleted.
 */
const SCENARIOS = [
  {
    title: '1. Product-page section with schema, blocks and presets',
    checks: [
      ['Section schema is valid JSON and validated', [/valid JSON/i, /\bValidSchema\b/]],
      ['presets make the section addable', [/\bpresets\b/]],
      ['blocks carry shopify_attributes', [/shopify_attributes/]],
      ['max_blocks caps the block count', [/max_blocks/]],
      ['Responsive images carry width, height, srcset and sizes', [/image_tag/, /widths:/, /sizes:/]],
      ['Every merchant value is escaped at its sink', [/\bescape\b/, /escape_once/]],
      ['CSS is scoped per section', [/scoped CSS|section-scoped|scoped by you/i]],
      ['No parser-blocking script', [/ParserBlockingScript/]],
    ],
  },
  {
    title: '2. Cart drawer with AJAX and error handling',
    checks: [
      ['Cart endpoints are correct', [/\/cart\/add\.js/, /\/cart\/change\.js/, /\/cart\/update\.js/]],
      ['Section Rendering API is used', [/sections_url/, /Section Rendering API/]],
      ['The 422 body is read and its description shown', [/422/, /description/]],
      ['Totals come from the server response', [/totals from the server|server response/i]],
      ['Superseded requests are aborted', [/AbortController/]],
      ['Focus is moved and trapped, Escape closes', [/focus/i, /Escape/]],
      ['Updates are announced', [/aria-live/]],
      ['The empty state is specified', [/empty cart|empty state/i]],
    ],
  },
  {
    title: '3. Security review of theme code',
    checks: [
      ['An Admin token in a theme is called a breach', [/Admin API token/, /breach/]],
      ['Metafield XSS is named as a check', [/CROSS_SITE_SCRIPTING/]],
      ['Text-setting HTML smuggling is named', [/TEXT_SETTING_HTML_SMUGGLING/]],
      ['Unsafe DOM sinks are named', [/UNSAFE_INNERHTML/]],
      ['strip_html is not treated as a sanitizer', [/is not a sanitizer/]],
      ['A CSP is not claimed for a Liquid theme', [/do not claim you added a CSP/i]],
      ['Findings carry severity, fix and verification', [/severity/i, /VERIFY:/]],
      ['A real secret is never pasted into a report', [/Never paste a real secret/]],
    ],
  },
  {
    title: '4. Multilingual, multi-currency theme with Markets',
    checks: [
      ['Strings go through t keys and locale files', [/\| t\b/, /en\.default\.json/]],
      ['The localization form is used correctly', [/form 'localization'/]],
      ['routes.root_url replaces hardcoded roots', [/routes\.root_url/]],
      ['Currency comes from the buyer context', [/cart\.currency\.iso_code/]],
      ['hreflang is left to Shopify', [/hreflang/, /content_for_header/]],
      ['Schema labels are translated too', [/\.schema\.json/]],
      ['Language names use endonym_name', [/endonym_name/]],
      ['Verification includes the market URL prefix', [/prefix/i]],
    ],
  },
  {
    title: '5. Checkout customization',
    checks: [
      ['checkout.liquid is rejected', [/checkout\.liquid/]],
      ['Checkout UI targets are real', [/purchase\.checkout\.block\.render/]],
      ['Mutations check userErrors', [/applyCartLinesChange/, /applyAttributeChange/, /userErrors/]],
      ['A paid option is a real line item or a Function', [/gift-wrap variant|real product variant/i, /cart\.transform\.run/]],
      ['Delivery customization uses the current target', [/cart\.delivery-options\.transform\.run/]],
      ['The plan gate is stated', [/development store/, /Plus/]],
      ['Testing and rollout steps exist', [/shopify app dev/, /shopify app deploy/]],
      ['Discounts use the merged Discount Function API', [/cart\.lines\.discounts\.generate\.run/]],
    ],
  },
  {
    title: 'Cross-cutting: evidence discipline',
    checks: [
      ['The verification gate names real commands', [/shopify theme check/, /--fail-level error/]],
      ['Output must be pasted, not described', [/paste the output|output pasted|paste the summary/i]],
      ['What could not run must be stated', [/what remains unverified|could not run/i]],
      ['The STOP instruction exists', [/\*\*STOP\*\*/]],
    ],
  },
  {
    title: 'Cross-cutting: maintainability discipline',
    checks: [
      ['SKILL.md stays a router, detail lives in references', [/references\/theme-architecture\.md/]],
      ['Assets have a documented install path', [/snippets\/featured-product-card\.liquid/]],
      ['Sections do not duplicate the platform wrapper id', [/data-section-id/]],
    ],
  },
];

let covered = 0;
let total = 0;
const missing = [];

for (const scenario of SCENARIOS) {
  const rows = [];
  for (const [label, probes] of scenario.checks) {
    total += 1;
    const absent = probes.filter((probe) => !probe.test(corpus));
    if (absent.length === 0) {
      covered += 1;
      rows.push(`  ok      ${label}`);
    } else {
      missing.push(`${scenario.title}: ${label} (missing ${absent.map(String).join(', ')})`);
      rows.push(`  MISSING ${label}`);
    }
  }
  console.log(`\n${scenario.title}`);
  console.log(rows.join('\n'));
}

console.log('');
console.log(`${covered}/${total} rubric checks are covered by the skill content.`);
console.log(`Scanned ${files.length} markdown and liquid files.`);
console.log('');
console.log('This is coverage, not a behavioural score: it proves the material exists,');
console.log('not that an agent used it well. Behavioural runs stay unrecorded until a');
console.log('delegated run can actually answer; see docs/tdd-round-1.md.');

if (missing.length > 0) {
  console.log(`\n${missing.length} rubric check(s) lost their material:`);
  for (const line of missing) console.log(`  - ${line}`);
  process.exit(1);
}
