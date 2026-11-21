#!/usr/bin/env node
/**
 * check-links.mjs - verify every URL cited in the markdown files.
 *
 * The skill's credibility depends on its sources resolving. CI uses lychee;
 * this script is the local equivalent with zero dependencies, so a contributor
 * can run it before opening a pull request.
 *
 * Run: node scripts/check-links.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TIMEOUT_MS = 20000;
const CONCURRENCY = 6;
const IGNORED = [
  /^https?:\/\/skills\.sh\//, // indexed only after the first release
  /^https?:\/\/img\.shields\.io\//, // badge service, not a source
  /^https?:\/\/github\.com\/sasxdj-cmyk\/shopify-skill/, // this repository itself
  /^https?:\/\/\{/, // template placeholder such as https://{shop}.myshopify.com
  /^https?:\/\/\*/, // wildcard example such as https://*.myshopify.com
  /169\.254\.169\.254/, // SSRF example address, never meant to resolve
  /evil\.example/, // reserved example domain
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function urlsIn(file) {
  const text = readFileSync(file, 'utf8');
  const found = text.match(/https?:\/\/[^\s<>()\]"'`]+/g) || [];
  return found
    .map((url) => url.replace(/[.,;:]+$/, ''))
    .filter((url) => !IGNORED.some((pattern) => pattern.test(url)));
}

const files = walk(ROOT);
const sources = new Map();
for (const file of files) {
  for (const url of urlsIn(file)) {
    if (!sources.has(url)) sources.set(url, new Set());
    sources.get(url).add(file.slice(ROOT.length + 1).split('\\').join('/'));
  }
}

const urls = [...sources.keys()].sort();
console.log(`Checking ${urls.length} unique URLs from ${files.length} markdown files...\n`);

const results = [];
let cursor = 0;

async function worker() {
  while (cursor < urls.length) {
    const url = urls[cursor];
    cursor += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'shopify-custom-skill-link-check' },
        signal: controller.signal,
      });
      results.push({ url, status: response.status, ok: response.status < 400 || response.status === 403 || response.status === 429 });
    } catch (error) {
      results.push({ url, status: 'ERR', ok: false, detail: String(error.message || error).slice(0, 80) });
    } finally {
      clearTimeout(timer);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

results.sort((a, b) => String(a.status).localeCompare(String(b.status)) || a.url.localeCompare(b.url));

const failed = results.filter((result) => !result.ok);
for (const result of results) {
  if (result.ok) continue;
  const where = [...(sources.get(result.url) || [])].join(', ');
  console.log(`FAIL  ${result.status}  ${result.url}`);
  console.log(`      cited in: ${where}${result.detail ? ` (${result.detail})` : ''}`);
}

console.log(`\n${results.length - failed.length}/${results.length} URLs reachable.`);
if (failed.length > 0) process.exit(1);
