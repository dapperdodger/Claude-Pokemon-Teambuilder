'use strict';
// Parsers for Pikalytics' /ai/* markdown. Pure string -> data; no network, no
// validation, no cleaning. Sentinels ("N/A", "undefined%") are returned exactly
// as they appear, because deciding what a sentinel MEANS is validate.js's job
// and differs by context: "N/A" usage on a ladder format is a fact about the
// upstream, while "N/A" win rate on a Mega page means the wrong entity was asked.

// Quick Info is a two-column markdown table: | **Key** | Value |
function tableField(text, key) {
  const re = new RegExp(`\\|\\s*\\*\\*${key}\\*\\*\\s*\\|\\s*([^|\\n]+?)\\s*\\|`);
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

// Format Information is a bullet list: - **Key**: Value
function bulletField(text, key) {
  const re = new RegExp(`^-\\s*\\*\\*${key}\\*\\*:\\s*(.+)$`, 'm');
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function parseQuickInfo(text) {
  const format = tableField(text, 'Format');
  // "Pokemon Champions ... (`battledataregmbs3`)" -> the backticked code
  const codeMatch = format && format.match(/`([^`]+)`/);
  return {
    format: format ? format.replace(/\s*\(`[^`]+`\)\s*$/, '') : null,
    formatCode: codeMatch ? codeMatch[1] : null,
    game: tableField(text, 'Game'),
    usage: tableField(text, 'Usage'),
    winRate: tableField(text, 'Win Rate'),
    record: tableField(text, 'Record'),
    dataDate: tableField(text, 'Data Date'),
  };
}

function parseFormatInfo(text) {
  const code = bulletField(text, 'Format Code');
  return {
    label: bulletField(text, 'Format'),
    code: code ? code.replace(/`/g, '') : null,
    game: bulletField(text, 'Game'),
    dataDate: bulletField(text, 'Data Date'),
  };
}

// Sections are "## <heading>" followed by "- **Name**: 12.3%" bullets.
function sectionBody(text, heading) {
  const re = new RegExp(`^##\\s+${heading}\\s*$`, 'm');
  const m = text.match(re);
  if (!m) return null;
  const after = text.slice(m.index + m[0].length);
  return after.split(/^##\s+/m)[0];
}

function parsePercentList(text, heading) {
  const body = sectionBody(text, heading);
  if (body === null) return [];
  const out = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^-\s*\*\*(.+?)\*\*:\s*(.+?)\s*$/);
    if (m) out.push({ name: m[1], percentRaw: m[2] });
  }
  return out;
}

// | Rank | Pokemon | Usage % | Win Rate | Record | Web Page | AI Data |
function parseUsageTable(text) {
  const body = sectionBody(text, 'Best 50 Pokemon by Usage');
  if (body === null) return [];
  const out = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*\*\*(.+?)\*\*\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/);
    if (m) {
      out.push({
        rank: Number(m[1]),
        species: m[2],
        usageRaw: m[3],
        winRateRaw: m[4],
        recordRaw: m[5],
      });
    }
  }
  return out;
}

// Common Team Cores: "## Common Team Cores" followed by one "### N-Pokemon
// Cores" subsection per group size, each a 4-column table:
//   | Rank | Core | Teams | Usage |
// Group sizes (today 2, 3, 4) are read off the headings themselves rather
// than hardcoded, so a future 5-Pokemon section is picked up instead of
// silently dropped.
const CORES_HEADING = 'Common Team Cores';
const CORES_GROUP_HEADING_RE = /^###\s+(\d+)-Pokemon Cores\s*$/gm;
const CORES_HEADER_ROW_RE = /^\|\s*Rank\s*\|/i;
const CORES_SEPARATOR_ROW_RE = /^\|[-:\s|]+\|?$/;
const CORES_ROW_RE = /^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/;

// A single "### N-Pokemon Cores" subsection's body. Distinguishes two very
// different kinds of "no rows": a legitimate empty group (no pipe markup at
// all — Pikalytics renders "No curated N-Pokemon core data is available
// yet." prose instead of a table) versus a table whose markup IS present but
// whose data rows don't match the expected shape. The first is a normal,
// reportable absence; the second means the upstream table format changed and
// silently returning [] would read as "no cores" when real data was missed —
// so it throws instead of vanishing the rows.
function parseCoreGroupBody(body, size) {
  const cores = [];
  let unparsedCount = 0;
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('|')) continue;
    if (CORES_HEADER_ROW_RE.test(line) || CORES_SEPARATOR_ROW_RE.test(line)) continue;
    const m = line.match(CORES_ROW_RE);
    if (!m) {
      unparsedCount++;
      continue;
    }
    cores.push({
      rank: Number(m[1]),
      species: m[2].split(',').map((s) => s.trim()).filter(Boolean),
      teamsRaw: m[3].trim(),
      usageRaw: m[4].trim(),
    });
  }
  if (unparsedCount > 0) {
    throw new Error(
      `Common Team Cores: the ${size}-Pokemon Cores table has ${unparsedCount} row(s) that did ` +
      `not match the expected "| Rank | Core | Teams | Usage |" shape — the upstream table format ` +
      `may have changed. Refusing to silently return a shorter core list.`
    );
  }
  return {
    size,
    cores,
    reason: cores.length ? null : 'no curated core data available for this group size yet',
  };
}

function parseCores(text) {
  const body = sectionBody(text, CORES_HEADING);
  if (body === null) {
    return { groups: [], reason: `no "${CORES_HEADING}" section in this page` };
  }
  const headings = [];
  CORES_GROUP_HEADING_RE.lastIndex = 0;
  let m;
  while ((m = CORES_GROUP_HEADING_RE.exec(body))) {
    headings.push({ size: Number(m[1]), matchIndex: m.index, bodyStart: m.index + m[0].length });
  }
  if (!headings.length) {
    return { groups: [], reason: `"${CORES_HEADING}" section has no N-Pokemon Cores subheadings` };
  }
  const groups = headings.map((h, i) => {
    const stop = i + 1 < headings.length ? headings[i + 1].matchIndex : body.length;
    return parseCoreGroupBody(body.slice(h.bodyStart, stop), h.size);
  });
  return { groups, reason: null };
}

module.exports = {
  parseQuickInfo, parseFormatInfo, sectionBody, parsePercentList, parseUsageTable, parseCores,
};
