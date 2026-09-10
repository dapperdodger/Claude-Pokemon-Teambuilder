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

// --- /ai/topteams and /ai/team-usage -----------------------------------
// Two more championstournaments-only surfaces (see docs/superpowers/specs/
// 2026-09-09-team-level-meta-design.md): concrete tournament teams with
// archetype tags, and six-Pokemon compositions ranked by win rate. Both
// render as pipe tables under their own "## ... Table" heading, reusing
// CORES_HEADER_ROW_RE / CORES_SEPARATOR_ROW_RE below since the header/
// separator shape is identical to the Common Team Cores tables.

// A well-formed "| a | b | c |" row's split('|') is ['', ' a ', ' b ', ' c ',
// '']; the leading/trailing entries are the outer pipes' empty ends, not
// data. Returns null for a line that is not a table row at all.
function splitRowCells(rawLine) {
  const line = rawLine.trim();
  if (!line.startsWith('|')) return null;
  return line.split('|').slice(1, -1).map((c) => c.trim());
}

function splitCommaList(raw) {
  return String(raw || '').split(',').map((s) => s.trim()).filter(Boolean);
}

const TOPTEAMS_HEADING = 'Top Teams Table';
// Observed live 2026-09-10: some Tournament-name cells contain literal,
// un-escaped "|" characters the upstream markdown generator never quoted —
// e.g. "🍋Sitrus-Series🍋|Champions-MC|$50 to First|#75". A naive positional
// split (cells[3] = Tournament) misattributes every column after it for
// exactly those rows. Parsed from BOTH ends instead: Rank/Author/Record are
// always the first three cells and Archetypes/Pokemon are always the last
// two, so whatever is left in the middle — however many extra "|" it
// contains — IS the Tournament name, reassembled with '|'.join.
function parseTopTeams(text) {
  const body = sectionBody(text, TOPTEAMS_HEADING);
  if (body === null) {
    return { teams: [], reason: `no "${TOPTEAMS_HEADING}" section in this page` };
  }
  const teams = [];
  let unparsedCount = 0;
  for (const rawLine of body.split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed.startsWith('|')) continue;
    if (CORES_HEADER_ROW_RE.test(trimmed) || CORES_SEPARATOR_ROW_RE.test(trimmed)) continue;
    const cells = splitRowCells(rawLine);
    if (!cells || cells.length < 6 || !/^\d+$/.test(cells[0])) {
      unparsedCount++;
      continue;
    }
    const archetypesRaw = cells[cells.length - 2];
    teams.push({
      rank: Number(cells[0]),
      author: cells[1],
      record: cells[2],
      tournament: cells.slice(3, cells.length - 2).join('|').trim(),
      archetypes: /^none$/i.test(archetypesRaw) ? [] : splitCommaList(archetypesRaw),
      species: splitCommaList(cells[cells.length - 1]),
    });
  }
  if (unparsedCount > 0) {
    throw new Error(
      `"${TOPTEAMS_HEADING}": ${unparsedCount} row(s) did not match the expected ` +
      `"| Rank | Author | Record | Tournament | Archetypes | Pokemon |" shape — the upstream table ` +
      `format may have changed. Refusing to silently return a shorter team list.`
    );
  }
  return { teams, reason: teams.length ? null : 'no team rows in this section' };
}

const TEAM_USAGE_HEADING = 'Team Usage Table';
// | Rank | Uses | Win Rate | Record | Unique Teams | Pokemon | — Record here
// is "22 - 15 - 0" (space-hyphen-space), never a literal "|", so unlike
// topteams' Tournament column this table needs no both-ends reconstruction.
function parseTeamUsage(text) {
  const body = sectionBody(text, TEAM_USAGE_HEADING);
  if (body === null) {
    return { rows: [], reason: `no "${TEAM_USAGE_HEADING}" section in this page` };
  }
  const rows = [];
  let unparsedCount = 0;
  for (const rawLine of body.split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed.startsWith('|')) continue;
    if (CORES_HEADER_ROW_RE.test(trimmed) || CORES_SEPARATOR_ROW_RE.test(trimmed)) continue;
    const cells = splitRowCells(rawLine);
    if (!cells || cells.length !== 6 || !/^\d+$/.test(cells[0])) {
      unparsedCount++;
      continue;
    }
    rows.push({
      rank: Number(cells[0]),
      usesRaw: cells[1],
      winRateRaw: cells[2],
      recordRaw: cells[3],
      uniqueTeamsRaw: cells[4],
      species: splitCommaList(cells[5]),
    });
  }
  if (unparsedCount > 0) {
    throw new Error(
      `"${TEAM_USAGE_HEADING}": ${unparsedCount} row(s) did not match the expected ` +
      `"| Rank | Uses | Win Rate | Record | Unique Teams | Pokemon |" shape — the upstream table ` +
      `format may have changed. Refusing to silently return a shorter list.`
    );
  }
  return { rows, reason: rows.length ? null : 'no composition rows in this section' };
}

module.exports = {
  parseQuickInfo, parseFormatInfo, sectionBody, parsePercentList, parseUsageTable, parseCores,
  parseTopTeams, parseTeamUsage,
};
