'use strict';
// HTTP via curl, matching how .claude/hooks already shell out. Returns status
// rather than throwing, because what a 404 MEANS depends on the caller.
//
// Freshness note: do not use the page's own "Data Date" — it is a global
// constant (2026-05 on every format, including VGC 2025 Reg I). JSON-LD
// dateModified is page-render time. The ETag is the only real change signal.

const { execFileSync } = require('node:child_process');

const BASE = 'https://www.pikalytics.com';
const SEP = '\n__META_SPLIT__\n';

function get(url, opts = {}) {
  const args = ['-s', '-D', '-', '--max-time', String(opts.timeoutSec || 30), url];
  let raw;
  try {
    raw = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch (err) {
    throw new Error(`curl failed for ${url}: ${err.message}`);
  }
  // Headers are separated from the body by a blank line; a redirect can produce
  // more than one header block, so take the last.
  const parts = raw.split(/\r?\n\r?\n/);
  const body = parts.slice(1).join('\n\n');
  const headers = parts[0];
  const status = Number((headers.match(/^HTTP\/[\d.]+\s+(\d{3})/m) || [])[1] || 0);
  const etag = (headers.match(/^etag:\s*(.+)$/im) || [])[1] || null;
  return { status, text: body, etag: etag ? etag.trim() : null };
}

module.exports = { BASE, SEP, get };
