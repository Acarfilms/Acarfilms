// Builds the SVG cards used by the profile README.
// Static cards are rebuilt on every run; the activity card needs GITHUB_TOKEN.
//
//   node scripts/build.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'assets');
const ICONS = JSON.parse(readFileSync(join(here, 'icons.json'), 'utf8')); // simple-icons, 24x24
const FONTS = JSON.parse(readFileSync(join(here, 'fonts.json'), 'utf8')); // Inter, see fonts.py

const LOGIN = 'Acarfilms';
const W = 840;
const FALLBACK = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Helvetica, Arial, sans-serif`;

const THEMES = {
  light: { text: '#1D1D1F', muted: '#6E6E73', faint: '#86868B', card: '#F5F5F7', line: '#D2D2D7', accent: '#0071E3', track: '#DCDCE1', tile: '#FFFFFF', tileEdge: '#000000', tileEdgeOpacity: 0.06, tileShadow: 0.1 },
  dark: { text: '#F5F5F7', muted: '#A1A1A6', faint: '#7D7D82', card: '#161B22', line: '#30363D', accent: '#2997FF', track: '#2A313B', tile: '#262C36', tileEdge: '#FFFFFF', tileEdgeOpacity: 0.08, tileShadow: 0.45 },
};

// Brand glyph colors for the app-icon tiles: [light, dark].
const BRAND = {
  flutter: ['#02569B', '#47C5FB'],
  dart: ['#0175C2', '#40C4FF'],
  react: ['#087EA4', '#58C4DC'],
  nextdotjs: ['#000000', '#FFFFFF'],
  typescript: ['#3178C6', '#5A9BE6'],
  firebase: ['#F57C00', '#FFA000'],
  notion: ['#000000', '#FFFFFF'],
  jira: ['#0052CC', '#4C9AFF'],
};

const STACK = [
  ['Mobile', [['flutter', 'Flutter'], ['dart', 'Dart'], ['react', 'React Native']]],
  ['Web', [['react', 'React'], ['nextdotjs', 'Next.js'], ['typescript', 'TypeScript']]],
  ['Backend & data', [['firebase', 'Firebase'], ['supabase', 'Supabase'], ['mongodb', 'MongoDB']]],
  ['DevOps', [['docker', 'Docker'], ['git', 'Git'], ['github', 'GitHub']]],
  ['Planning', [['notion', 'Notion'], ['jira', 'Jira']]],
];

// Line glyphs on a 24x24 grid, in the spirit of SF Symbols.
const GLYPHS = {
  location: (c) => `<path d="M19.6 4.4 4.6 10.6c-.7.3-.6 1.3.1 1.5l6 1.5 1.5 6c.2.7 1.2.8 1.5.1l6.2-15c.2-.4-.2-.8-.3-.3z" fill="${c}"/>`,
  briefcase: (c) => `<g stroke="${c}" stroke-width="1.7" stroke-linejoin="round"><rect x="3.2" y="7.2" width="17.6" height="12.6" rx="2.6"/><path d="M8.8 7.2V5.9c0-1 .8-1.7 1.7-1.7h3c1 0 1.7.8 1.7 1.7v1.3M3.2 12.6h17.6"/></g>`,
  code: (c) => `<g stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7.5 3.5 12 8 16.5M16 7.5l4.5 4.5-4.5 4.5M13.4 5.5l-2.8 13"/></g>`,
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r = (n) => Math.round(n * 100) / 100;

function measure(str, font, size, ls = 0) {
  const adv = FONTS[font].advance;
  return [...str].reduce((w, ch) => w + (adv[ch] ?? 0.6) * size, 0) + ls * (str.length - 1);
}

// <text> in one of the embedded Inter cuts. Unknown options pass straight through as attributes.
function T(str, { font = 'text-400', size, x, y, fill, ls, anchor, ...rest }) {
  const attrs = Object.entries(rest).map(([k, v]) => ` ${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}="${v}"`).join('');
  return `<text class="f-${font}" x="${r(x)}" y="${r(y)}" font-size="${size}"${ls ? ` letter-spacing="${ls}"` : ''}${anchor ? ` text-anchor="${anchor}"` : ''} fill="${fill}"${attrs}>${esc(str)}</text>`;
}

// Embeds only the font cuts the body actually uses.
function svg(width, height, body) {
  const used = Object.keys(FONTS).filter((name) => body.includes(`f-${name}`));
  const faces = used.map((name) => `  @font-face { font-family: 'I-${name}'; src: url(data:font/woff2;base64,${FONTS[name].woff2}) format('woff2'); }
  .f-${name} { font-family: 'I-${name}', ${FALLBACK}; }`).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
<style>
${faces}
</style>
${body.trim()}
</svg>
`;
}

// Section cards get extra room above the heading so sections breathe on the page.
const SECTION_GAP = 28;
const section = (height, body) => svg(W, height + SECTION_GAP, `<g transform="translate(0 ${SECTION_GAP})">${body}</g>`);

const heading = (t, label) => T(label, { font: 'display-700', size: 32, x: 2, y: 38, ls: -0.8, fill: t.text });

/* ---------- Wallpaper and Liquid Glass ---------- */

const WALL_W = 840, WALL_H = 390;

const WALL_DEFS = `
<linearGradient id="wp-sky" x1="0" y1="0" x2=".3" y2="1">
  <stop offset="0" stop-color="#02071C"/><stop offset=".6" stop-color="#071A52"/><stop offset="1" stop-color="#0B2F8A"/>
</linearGradient>
<linearGradient id="wp-wave1" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#1B4FD6"/><stop offset="1" stop-color="#0A1F6B"/>
</linearGradient>
<linearGradient id="wp-wave2" x1="0" y1="0" x2="1" y2=".6">
  <stop offset="0" stop-color="#2E8BFF"/><stop offset=".6" stop-color="#1F5BEA"/><stop offset="1" stop-color="#5B4BE0"/>
</linearGradient>
<linearGradient id="wp-wave3" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#5FD3FF"/><stop offset=".55" stop-color="#3A8DFF"/><stop offset="1" stop-color="#FF8A5C"/>
</linearGradient>
<linearGradient id="wp-wave4" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#2A6BFF"/><stop offset=".6" stop-color="#7A5CFF"/><stop offset="1" stop-color="#FF6F61"/>
</linearGradient>
<linearGradient id="wp-edge" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset=".35" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset=".8" stop-color="#FFFFFF" stop-opacity=".25"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
</linearGradient>
<filter id="wp-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="55"/></filter>
<filter id="wp-lift" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="-10" stdDeviation="14" flood-color="#000A2E" flood-opacity=".6"/></filter>
<filter id="wp-hair" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
<filter id="wp-grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>
  <feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="table" tableValues="0 .09"/></feComponentTransfer>
</filter>`;

// Layered waves over a night sky, lit from the upper right.
const WAVES = [
  ['M0 214C170 168 318 282 520 236S760 150 840 176V390H0Z', 'wp-wave1'],
  ['M0 270C150 226 352 330 556 284S770 214 840 238V390H0Z', 'wp-wave2'],
  ['M0 326C190 286 382 372 600 330S784 286 840 296V390H0Z', 'wp-wave3'],
  ['M300 390C420 352 560 360 680 344S810 322 840 326V390Z', 'wp-wave4'],
];

const WALL = `<g id="wall">
<rect width="${WALL_W}" height="${WALL_H}" fill="url(#wp-sky)"/>
<g filter="url(#wp-glow)">
  <ellipse cx="690" cy="70" rx="250" ry="150" fill="#1E6BFF" opacity=".8"/>
  <ellipse cx="120" cy="360" rx="280" ry="140" fill="#00A3FF" opacity=".45"/>
  <ellipse cx="800" cy="380" rx="200" ry="130" fill="#FF7A45" opacity=".5"/>
</g>
${WAVES.map(([d, fill]) => `<path d="${d}" fill="url(#${fill})" filter="url(#wp-lift)"/>`).join('\n')}
${WAVES.slice(0, 3).map(([d]) => `<path d="${d.split('V')[0]}" stroke="url(#wp-edge)" stroke-width="1.4" filter="url(#wp-hair)"/>`).join('\n')}
<rect width="${WALL_W}" height="${WALL_H}" filter="url(#wp-grain)"/>
</g>`;

const GLASS_DEFS = `
<filter id="glass-frost" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feGaussianBlur stdDeviation="7"/>
  <feColorMatrix type="saturate" values="1.6"/>
  <feComponentTransfer><feFuncR type="linear" slope="1.1" intercept=".04"/><feFuncG type="linear" slope="1.1" intercept=".04"/><feFuncB type="linear" slope="1.1" intercept=".04"/></feComponentTransfer>
</filter>
<filter id="glass-shadow" x="-30%" y="-50%" width="160%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="glass-band" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="text-lift" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000A2E" flood-opacity=".35"/></filter>
<linearGradient id="glass-rim" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset=".3" stop-color="#FFFFFF" stop-opacity=".18"/>
  <stop offset=".7" stop-color="#FFFFFF" stop-opacity=".08"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".6"/>
</linearGradient>
<linearGradient id="glass-sheen" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity=".04"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".1"/>
</linearGradient>`;

// A Liquid Glass panel: magnified, frosted wallpaper behind a tinted pane with a specular rim.
// `view` maps wallpaper coordinates into this SVG (identity for the hero, a crop for buttons).
function glass(id, { x, y, w, h, rx }, { view = '', shadow = 0.35 } = {}) {
  const cx = x + w / 2, cy = y + h / 2;
  const box = `x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${rx}"`;
  return `<rect ${box} fill="#000820" opacity="${shadow}" filter="url(#glass-shadow)" transform="translate(0 8)"/>
<clipPath id="${id}"><rect ${box}/></clipPath>
<g clip-path="url(#${id})">
  <g transform="translate(${r(cx)} ${r(cy)}) scale(1.08) translate(${r(-cx)} ${r(-cy)})"><use href="#wall" xlink:href="#wall" filter="url(#glass-frost)"${view}/></g>
  <rect ${box} fill="#FFFFFF" opacity=".1"/>
  <rect ${box} fill="url(#glass-sheen)"/>
  <rect ${box} stroke="#FFFFFF" stroke-opacity=".3" stroke-width="7" filter="url(#glass-band)"/>
</g>
<rect x="${r(x + 0.6)}" y="${r(y + 0.6)}" width="${r(w - 1.2)}" height="${r(h - 1.2)}" rx="${rx - 0.6}" stroke="url(#glass-rim)" stroke-width="1.2"/>`;
}

/* ---------- Cards ---------- */

function hero() {
  const pillText = 'Full-stack developer';
  const pillW = measure(pillText, 'text-600', 14, 0.2) + 40;
  const pill = { x: (W - pillW) / 2, y: 40, w: pillW, h: 34, rx: 17 };

  const widgets = [
    ['location', 'Based in', 'Toledo, Spain'],
    ['briefcase', 'Leading tech at', 'IABeauty'],
    ['code', 'Focus', 'Apps · Web · AI'],
  ].map(([icon, caption, value], i) => {
    const box = { x: 32 + i * 264, y: 266, w: 248, h: 88, rx: 26 };
    const cy = box.y + box.h / 2;
    return `${glass(`w${i}`, box)}
<circle cx="${box.x + 42}" cy="${cy}" r="20" fill="#FFFFFF" fill-opacity=".16" stroke="#FFFFFF" stroke-opacity=".28"/>
<g transform="translate(${box.x + 30} ${cy - 12})">${GLYPHS[icon]('#FFFFFF')}</g>
<g filter="url(#text-lift)">
${T(caption, { font: 'text-400', size: 13, x: box.x + 76, y: cy - 6, fill: '#FFFFFF', fillOpacity: 0.72 })}
${T(value, { font: 'text-600', size: 19, x: box.x + 76, y: cy + 17, ls: -0.2, fill: '#FFFFFF' })}
</g>`;
  }).join('\n');

  return svg(W, WALL_H, `
<defs>
${WALL_DEFS}
${GLASS_DEFS}
<clipPath id="frame"><rect width="${W}" height="${WALL_H}" rx="32"/></clipPath>
</defs>
<g clip-path="url(#frame)">
${WALL}
${glass('pill', pill)}
${T(pillText, { font: 'text-600', size: 14, x: W / 2, y: pill.y + 22, ls: 0.2, anchor: 'middle', fill: '#FFFFFF' })}
<g filter="url(#text-lift)">
${T('Angel Carrascosa', { font: 'display-700', size: 76, x: W / 2, y: 160, ls: -2.6, anchor: 'middle', fill: '#FFFFFF' })}
${T('Apps, web and AI products — from first idea to production.', { font: 'text-400', size: 19, x: W / 2, y: 204, anchor: 'middle', fill: '#FFFFFF', fillOpacity: 0.8 })}
</g>
${widgets}
</g>`);
}

// iOS-style app icon: continuous-corner tile with the brand glyph.
function appIcon(t, theme, icon, x, y, size) {
  const g = size * 0.5;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r(size * 0.235)}" fill="${t.tile}" filter="url(#tile-shadow)"/>
<rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="${r(size * 0.235 - 0.5)}" stroke="${t.tileEdge}" stroke-opacity="${t.tileEdgeOpacity}"/>
<path transform="translate(${r(x + (size - g) / 2)} ${r(y + (size - g) / 2)}) scale(${r(g / 24)})" d="${ICONS[icon]}" fill="${BRAND[icon][theme === 'light' ? 0 : 1]}"/>`;
}

function expertise(t, theme) {
  const top = 64, gap = 16;
  const tile = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${t.card}"/>`;
  const copy = (x, y, eyebrow, headline, detail, size) => [
    T(eyebrow, { font: 'text-600', size: 15, x, y, fill: t.accent }),
    ...headline.map((line, i) => T(line, { font: 'display-700', size, x, y: y + 46 + i * (size + 6), ls: -0.9, fill: t.text })),
    ...detail.map((line, i) => T(line, { font: 'text-400', size: 16, x, y: y + 46 + (headline.length - 1) * (size + 6) + 44 + i * 23, fill: t.muted })),
  ].join('\n');

  const a = { x: 0, y: top, w: W, h: 250 };
  const icons = ['flutter', 'dart', 'react', 'nextdotjs', 'typescript', 'firebase'];
  const size = 64, igap = 18;
  const gx = W - 44 - (3 * size + 2 * igap), gy = a.y + (a.h - (2 * size + igap)) / 2;
  const grid = icons.map((icon, i) => appIcon(t, theme, icon, gx + (i % 3) * (size + igap), gy + Math.floor(i / 3) * (size + igap), size)).join('\n');

  const half = (W - gap) / 2;
  const b = { x: 0, y: a.y + a.h + gap, w: half, h: 236 };
  const c = { x: half + gap, y: b.y, w: half, h: 236 };

  return section(b.y + b.h + 2, `
<defs><filter id="tile-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000000" flood-opacity="${t.tileShadow}"/></filter></defs>
${heading(t, 'Expertise')}
${tile(a.x, a.y, a.w, a.h)}
${copy(44, a.y + 54, 'Apps & Web', ['Native feel.', 'Web speed.'], ['Cross-platform apps in Flutter and React Native.', 'Fast, modern web with React and Next.js.'], 36)}
${grid}
${tile(b.x, b.y, b.w, b.h)}
${copy(b.x + 36, b.y + 50, 'Autonomous AI', ['Work that', 'runs itself.'], ['AI agents and automations that take', 'real work off the table, end to end.'], 30)}
${tile(c.x, c.y, c.w, c.h)}
${copy(c.x + 36, c.y + 50, 'Leadership', ['From roadmap', 'to release.'], ['Leading tech at IABeauty, with sprints', 'and planning in Notion and Jira.'], 30)}
${appIcon(t, theme, 'notion', c.x + c.w - 36 - 44 * 2 - 10, c.y + 30, 44)}
${appIcon(t, theme, 'jira', c.x + c.w - 36 - 44, c.y + 30, 44)}`);
}

function specs(t) {
  const top = 64, pad = 6, rowH = 62;
  const h = STACK.length * rowH + pad * 2;
  const rows = STACK.map(([label, items], i) => {
    const yc = top + pad + rowH / 2 + i * rowH;
    const sep = i ? `<path d="M32 ${top + pad + i * rowH + 0.5}H${W - 32}" stroke="${t.line}"/>\n` : '';
    const cells = items.map(([icon, name], j) => {
      const x = 232 + j * 192;
      return `<path transform="translate(${x} ${yc - 11}) scale(${r(22 / 24)})" d="${ICONS[icon]}" fill="${t.text}"/>
${T(name, { font: 'text-500', size: 17, x: x + 34, y: yc + 6, fill: t.text })}`;
    }).join('\n');
    return `${sep}${T(label, { font: 'text-500', size: 15, x: 32, y: yc + 5, fill: t.muted })}\n${cells}`;
  }).join('\n');
  return section(top + h + 2, `${heading(t, 'Tech specs')}
<rect x="0" y="${top}" width="${W}" height="${h}" rx="28" fill="${t.card}"/>
${rows}`);
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
  const top = 64, h = 280, left = 36, span = W - 72;
  const fmt = (n) => n.toLocaleString('en-US');
  const unit = (n) => (n === 1 ? 'day' : 'days');
  const figures = [
    ['Contributions', fmt(s.total)],
    ['Active days', fmt(s.activeDays)],
    ['Current streak', fmt(s.current), unit(s.current)],
    ['Longest streak', fmt(s.longest), unit(s.longest)],
  ].map(([label, value, suffix], i) => {
    const x = left + i * (span / 4);
    const tail = suffix ? `<tspan dx="5" class="f-text-500" font-size="17" letter-spacing="0" fill="${t.muted}">${suffix}</tspan>` : '';
    return `<text class="f-display-700" x="${r(x)}" y="${top + 72}" font-size="40" letter-spacing="-1.2" fill="${t.text}">${value}${tail}</text>
${T(label, { font: 'text-500', size: 14, x, y: top + 100, fill: t.muted })}`;
  }).join('\n');

  const base = top + 232, maxH = 80;
  const step = span / s.weeks.length, bw = Math.min(8, step * 0.56);
  const peak = Math.max(1, ...s.weeks.map((w) => w.count));
  const barH = (n) => (n ? 6 + (n / peak) * (maxH - 6) : 4);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastMonth = null, lastLabelX = -Infinity;
  const bars = [], labels = [];
  s.weeks.forEach((wk, i) => {
    const x = left + i * step + (step - bw) / 2;
    const bh = barH(wk.count);
    bars.push(`<rect x="${r(x)}" y="${r(base - bh)}" width="${r(bw)}" height="${r(bh)}" rx="${r(bw / 2)}" fill="${wk.count ? t.accent : t.track}"/>`);
    const month = new Date(`${wk.start}T00:00:00Z`).getUTCMonth();
    if (lastMonth !== null && month !== lastMonth && x - lastLabelX > 36 && x < W - 60) {
      labels.push(T(months[month], { font: 'text-500', size: 12, x, y: top + 256, fill: t.faint }));
      lastLabelX = x;
    }
    lastMonth = month;
  });
  const avg = s.total / s.weeks.length;
  const avgY = r(base - barH(avg));
  const avgLabel = `avg ${Math.round(avg)}/wk`;

  return section(top + h + 2, `
${heading(t, 'Activity')}
${T(`Last 12 months · Updated ${updated}`, { font: 'text-500', size: 14, x: W - 2, y: 38, anchor: 'end', fill: t.faint })}
<rect x="0" y="${top}" width="${W}" height="${h}" rx="28" fill="${t.card}"/>
${figures}
<path d="M${left} ${top + 128.5}H${W - left}" stroke="${t.line}"/>
${bars.join('\n')}
<path d="M${left} ${avgY}H${W - left}" stroke="${t.faint}" stroke-dasharray="3 4" opacity=".7"/>
<rect x="${left}" y="${avgY - 21}" width="${r(measure(avgLabel, 'text-500', 12) + 12)}" height="18" rx="9" fill="${t.card}"/>
${T(avgLabel, { font: 'text-500', size: 12, x: left + 6, y: avgY - 8, fill: t.faint })}
${labels.join('\n')}
`);
}

// Tinted Liquid Glass button; `crop` is the wallpaper region [x, y, w, h] it refracts.
function button(icon, label, crop) {
  const h = 52, iconSize = 20;
  const textW = measure(label, 'text-600', 16);
  const w = Math.round(24 + iconSize + 10 + textW + 12 + 12 + 24);
  const [cx, cy, cw, ch] = crop;
  const sx = w / cw, sy = h / ch;
  const view = ` transform="matrix(${r(sx)} 0 0 ${r(sy)} ${r(-cx * sx)} ${r(-cy * sy)})"`;
  const m = 28;
  return svg(w + m * 2, h + m * 2, `
<defs>
${WALL_DEFS}
${GLASS_DEFS}
${WALL}
</defs>
<g transform="translate(${m} ${m - 4})">
${glass('b', { x: 0, y: 0, w, h, rx: h / 2 }, { view, shadow: 0.18 })}
<g filter="url(#text-lift)">
<path transform="translate(24 ${(h - iconSize) / 2}) scale(${r(iconSize / 24)})" d="${ICONS[icon]}" fill="#FFFFFF"/>
${T(label, { font: 'text-600', size: 16, x: 24 + iconSize + 10, y: h / 2 + 5.5, fill: '#FFFFFF' })}
${T('↗', { font: 'text-600', size: 14, x: w - 24, y: h / 2 + 5, anchor: 'end', fill: '#FFFFFF', fillOpacity: 0.75 })}
</g>
</g>`);
}

function write(name, content) {
  writeFileSync(join(OUT, name), content);
  console.log(`  ${name}  ${(content.length / 1024).toFixed(0)} KB`);
}

write('hero.svg', hero());
write('button-linkedin.svg', button('linkedin', 'LinkedIn', [200, 230, 300, 110]));
write('button-instagram.svg', button('instagram', 'Instagram', [560, 250, 280, 110]));
for (const [theme, t] of Object.entries(THEMES)) {
  write(`expertise-${theme}.svg`, expertise(t, theme));
  write(`specs-${theme}.svg`, specs(t));
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.warn('GITHUB_TOKEN is not set; skipping the activity card.');
} else {
  const stats = summarize(await fetchCalendar(token));
  const updated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  for (const [theme, t] of Object.entries(THEMES)) write(`activity-${theme}.svg`, activity(t, stats, updated));
}
