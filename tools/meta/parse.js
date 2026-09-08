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

module.exports = { parseQuickInfo, parseFormatInfo };
