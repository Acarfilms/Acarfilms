// Builds the SVG cards used by the profile README, in light and dark variants.
// Static cards are rebuilt on every run; the activity card needs GITHUB_TOKEN.
//
//   node scripts/build.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'assets');
const ICONS = JSON.parse(readFileSync(join(here, 'icons.json'), 'utf8')); // simple-icons, 24x24

const LOGIN = 'Acarfilms';
const W = 840;
const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif`;
const SECTION_TOP = 84; // card offset; the heading sits 22px above it
const SPECTRUM = ['#0A84FF', '#5E5CE6', '#BF5AF2', '#FF375F', '#FF9F0A'];

const THEMES = {
  light: { text: '#1D1D1F', muted: '#6E6E73', faint: '#86868B', card: '#F5F5F7', line: '#D2D2D7', accent: '#0071E3', tint: '#E3EEFB', track: '#DCDCE1', button: '#0071E3' },
  dark: { text: '#F5F5F7', muted: '#A1A1A6', faint: '#7D7D82', card: '#161B22', line: '#30363D', accent: '#2997FF', tint: '#132A45', track: '#2A313B', button: '#0A84FF' },
};

const NOW = [
  { icon: 'device', title: 'Apps & web', lines: ['Cross-platform apps with', 'Flutter, and web products', 'with React and Next.js.'] },
  { icon: 'sparkles', title: 'Autonomous AI', lines: ['AI systems and agents that', 'take on real work and run', 'on their own.'] },
  { icon: 'checklist', title: 'Tech leadership', lines: ['Planning, task management', 'and CTO duties that keep', 'projects on track.'] },
];

const STACK = [
  ['Mobile', [['flutter', 'Flutter'], ['dart', 'Dart'], ['react', 'React Native']]],
  ['Web', [['react', 'React'], ['nextdotjs', 'Next.js'], ['typescript', 'TypeScript']]],
  ['Backend & data', [['firebase', 'Firebase'], ['supabase', 'Supabase'], ['mongodb', 'MongoDB']]],
  ['DevOps & workflow', [['docker', 'Docker'], ['git', 'Git'], ['github', 'GitHub']]],
];

// Line icons drawn on a 24x24 grid, in the style of SF Symbols.
const GLYPHS = {
  device: (c) => `<g stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/><path d="M10.5 18.2h3"/></g>`,
  sparkles: (c) => `<g fill="${c}"><path d="M10 3.5c.7 4.6 2 5.9 6.5 6.5-4.5.6-5.8 1.9-6.5 6.5-.7-4.6-2-5.9-6.5-6.5 4.5-.6 5.8-1.9 6.5-6.5z"/><path d="M18 14.5c.3 2 .9 2.6 2.8 2.9-1.9.3-2.5.9-2.8 2.9-.3-2-.9-2.6-2.8-2.9 1.9-.3 2.5-.9 2.8-2.9z"/></g>`,
  checklist: (c) => `<g stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6.5h10M10 12h10M10 17.5h10"/><path d="M3.8 6.6l1.3 1.3 2.4-2.6M3.8 12.1l1.3 1.3 2.4-2.6M3.8 17.6l1.3 1.3 2.4-2.6"/></g>`,
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r = (n) => Math.round(n * 100) / 100;

function svg(height, body, { css = '', width = W } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
<style>
  text { font-family: ${FONT}; }
${css}</style>
${body.trim()}
</svg>
`;
}

function spectrumStops(colors) {
  return colors.map((c, i) => `<stop offset="${r(i / (colors.length - 1))}" stop-color="${c}"/>`).join('');
}

const heading = (t, label) =>
  `<text x="2" y="${SECTION_TOP - 22}" font-size="30" font-weight="700" letter-spacing="-0.6" fill="${t.text}">${esc(label)}</text>`;

function hero(t) {
  const sweep = 420;
  return svg(236, `
<defs>
  <linearGradient id="spectrum" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${sweep}" y2="0" spreadMethod="reflect">
    ${spectrumStops(SPECTRUM)}
    <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="${sweep * 2} 0" dur="14s" repeatCount="indefinite"/>
  </linearGradient>
</defs>
<text x="420" y="44" text-anchor="middle" font-size="14" font-weight="600" letter-spacing="2.4" fill="${t.accent}">FULL-STACK DEVELOPER</text>
<text x="420" y="114" text-anchor="middle" font-size="64" font-weight="700" letter-spacing="-2" fill="${t.text}">Angel Carrascosa.</text>
<text x="420" y="164" text-anchor="middle" font-size="22" font-weight="500" fill="${t.muted}">Mobile apps, web products and autonomous AI systems.</text>
<text x="420" y="200" text-anchor="middle" font-size="22" font-weight="600" fill="url(#spectrum)">Thoughtfully designed. Built to ship.</text>
`);
}

function now(t) {
  const top = SECTION_TOP, gap = 16, h = 206;
  const w = (W - gap * 2) / 3;
  const tiles = NOW.map((tile, i) => {
    const x = i * (w + gap);
    const cx = x + 26 + 22, cy = top + 26 + 22;
    const lines = tile.lines.map((line, j) =>
      `<text x="${r(x + 26)}" y="${top + 132 + j * 22}" font-size="15" fill="${t.muted}">${esc(line)}</text>`).join('\n');
    return `<rect x="${r(x)}" y="${top}" width="${r(w)}" height="${h}" rx="22" fill="${t.card}"/>
<circle cx="${r(cx)}" cy="${cy}" r="22" fill="${t.tint}"/>
<g transform="translate(${r(cx - 12)} ${cy - 12})">${GLYPHS[tile.icon](t.accent)}</g>
<text x="${r(x + 26)}" y="${top + 104}" font-size="19" font-weight="700" letter-spacing="-0.2" fill="${t.text}">${esc(tile.title)}</text>
${lines}`;
  }).join('\n');
  return svg(top + h + 2, `${heading(t, 'Right now.')}\n${tiles}`);
}

function stack(t) {
  const top = SECTION_TOP, pad = 6, rowH = 66;
  const h = STACK.length * rowH + pad * 2;
  const rows = STACK.map(([label, items], i) => {
    const yc = top + pad + rowH / 2 + i * rowH;
    const sep = i ? `<path d="M32 ${top + pad + i * rowH + 0.5}H${W - 32}" stroke="${t.line}"/>\n` : '';
    const cells = items.map(([icon, name], j) => {
      const x = 232 + j * 192;
      return `<path transform="translate(${x} ${yc - 11}) scale(${r(22 / 24)})" d="${ICONS[icon]}" fill="${t.text}"/>
<text x="${x + 34}" y="${yc + 6}" font-size="17" font-weight="500" fill="${t.text}">${esc(name)}</text>`;
    }).join('\n');
    return `${sep}<text x="32" y="${yc + 5}" font-size="15" font-weight="500" fill="${t.muted}">${esc(label)}</text>\n${cells}`;
  }).join('\n');
  return svg(top + h + 2, `${heading(t, 'Stack.')}
<rect x="0" y="${top}" width="${W}" height="${h}" rx="24" fill="${t.card}"/>
${rows}`);
}

function linkedin(t) {
  const w = 300, h = 56;
  return svg(h, `
<rect width="${w}" height="${h}" rx="28" fill="${t.button}"/>
<path transform="translate(48 18) scale(${r(20 / 24)})" d="${ICONS.linkedin}" fill="#FFFFFF"/>
<text x="80" y="34" font-size="17" font-weight="600" fill="#FFFFFF">Connect on LinkedIn</text>
`, { width: w });
}

async function fetchCalendar(token) {
  const query = `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
    totalContributions weeks { contributionDays { date contributionCount } } } } } }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': LOGIN },
    body: JSON.stringify({ query, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GitHub API: ${JSON.stringify(json.errors ?? json)}`);
  return json.data.user.contributionsCollection.contributionCalendar;
}

function summarize(calendar) {
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  let longest = 0, run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // Today is still in progress, so a streak that ended yesterday is still current.
  let i = days.length - 1, current = 0;
  if (days[i]?.contributionCount === 0) i--;
  for (; i >= 0 && days[i].contributionCount > 0; i--) current++;
  return {
    total: calendar.totalContributions,
    activeDays: days.filter((d) => d.contributionCount > 0).length,
    current,
    longest,
    weeks: calendar.weeks.map((w) => ({
      start: w.contributionDays[0].date,
      count: w.contributionDays.reduce((sum, d) => sum + d.contributionCount, 0),
    })),
  };
}

function activity(t, s, updated) {
  const top = SECTION_TOP, h = 270, left = 32, span = W - 64;
  const fmt = (n) => n.toLocaleString('en-US');
  const unit = (n) => (n === 1 ? 'day' : 'days');
  const figures = [
    ['Contributions', fmt(s.total)],
    ['Active days', fmt(s.activeDays)],
    ['Current streak', fmt(s.current), unit(s.current)],
    ['Longest streak', fmt(s.longest), unit(s.longest)],
  ].map(([label, value, suffix], i) => {
    const x = left + i * (span / 4);
    const tail = suffix ? `<tspan dx="6" font-size="18" font-weight="600" letter-spacing="0" fill="${t.muted}">${suffix}</tspan>` : '';
    return `<text x="${r(x)}" y="${top + 64}" font-size="38" font-weight="700" letter-spacing="-1" fill="${t.text}">${value}${tail}</text>
<text x="${r(x)}" y="${top + 92}" font-size="14" fill="${t.muted}">${label}</text>`;
  }).join('\n');

  const base = top + 222, maxH = 74;
  const step = span / s.weeks.length, bw = Math.min(8, step * 0.58);
  const peak = Math.max(1, ...s.weeks.map((w) => w.count));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastMonth = null, lastLabelX = -Infinity;
  const bars = [], labels = [];
  s.weeks.forEach((wk, i) => {
    const x = left + i * step + (step - bw) / 2;
    const bh = wk.count ? 6 + (wk.count / peak) * (maxH - 6) : 4;
    const fill = wk.count ? 'url(#bars)' : t.track;
    bars.push(`<rect x="${r(x)}" y="${r(base - bh)}" width="${r(bw)}" height="${r(bh)}" rx="${r(bw / 2)}" fill="${fill}"/>`);
    const month = new Date(`${wk.start}T00:00:00Z`).getUTCMonth();
    if (lastMonth !== null && month !== lastMonth && x - lastLabelX > 36 && x < W - 60) {
      labels.push(`<text x="${r(x)}" y="${top + 248}" font-size="12" fill="${t.faint}">${months[month]}</text>`);
      lastLabelX = x;
    }
    lastMonth = month;
  });

  return svg(top + h + 2, `
<defs>
  <linearGradient id="bars" gradientUnits="userSpaceOnUse" x1="${left}" y1="0" x2="${W - left}" y2="0">${spectrumStops(SPECTRUM)}</linearGradient>
</defs>
${heading(t, 'Activity.')}
<text x="${W - 2}" y="${SECTION_TOP - 22}" text-anchor="end" font-size="14" fill="${t.faint}">Last 12 months · Updated ${esc(updated)}</text>
<rect x="0" y="${top}" width="${W}" height="${h}" rx="24" fill="${t.card}"/>
${figures}
<path d="M${left} ${top + 118.5}H${W - left}" stroke="${t.line}"/>
${bars.join('\n')}
${labels.join('\n')}
`);
}

function write(name, content) {
  writeFileSync(join(OUT, name), content);
  console.log(`  ${name}`);
}

const cards = { hero, now, stack, linkedin };
for (const [theme, t] of Object.entries(THEMES)) {
  for (const [name, render] of Object.entries(cards)) write(`${name}-${theme}.svg`, render(t));
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.warn('GITHUB_TOKEN is not set; skipping the activity card.');
} else {
  const stats = summarize(await fetchCalendar(token));
  const updated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  for (const [theme, t] of Object.entries(THEMES)) write(`activity-${theme}.svg`, activity(t, stats, updated));
}
