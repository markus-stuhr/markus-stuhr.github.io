import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm';
import { Engine } from './engine.js';

// ---------- Gegner ----------
// Unterhalb von UCI_Elo 1320 schwächen wir über geringe Tiefe + Zufall aus den Top-Zügen.
const LEVELS = [
  { name: 'Einsteiger', elo: '≈ 400', depth: 1, multipv: 5, rnd: 0.6 },
  { name: 'Gelegenheitsspieler', elo: '≈ 700', depth: 2, multipv: 4, rnd: 0.35 },
  { name: 'Hobbyspieler', elo: '≈ 1000', depth: 5, multipv: 3, rnd: 0.15, skill: 3 },
  { name: 'Vereinsspieler', elo: '1350', limit: 1350, movetime: 400 },
  { name: 'Fortgeschritten', elo: '1600', limit: 1600, movetime: 500 },
  { name: 'Experte', elo: '1900', limit: 1900, movetime: 700 },
  { name: 'Meister', elo: '2300', limit: 2300, movetime: 900 },
  { name: 'Stockfish', elo: '3000+', movetime: 1500 },
];

// ---------- Zugbewertung ----------
const CLS = {
  brilliant: { sym: '!!', name: 'Brillant', col: 'var(--brilliant)' },
  great: { sym: '!', name: 'Großartig', col: 'var(--great)' },
  best: { sym: '★', name: 'Bester Zug', col: 'var(--best)' },
  excellent: { sym: '✓', name: 'Exzellent', col: 'var(--excellent)' },
  good: { sym: '✓', name: 'Gut', col: 'var(--good)' },
  book: { sym: '📖', name: 'Buchzug', col: 'var(--book)' },
  inacc: { sym: '?!', name: 'Ungenauigkeit', col: 'var(--inacc)' },
  mistake: { sym: '?', name: 'Fehler', col: 'var(--mistake)' },
  miss: { sym: '✗', name: 'Verpasst', col: 'var(--miss)' },
  blunder: { sym: '??', name: 'Grober Fehler', col: 'var(--blunder)' },
};
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PNAME = { p: 'Bauer', n: 'Springer', b: 'Läufer', r: 'Turm', q: 'Dame', k: 'König' };
const PNAME_ACC = { p: 'den Bauern', n: 'den Springer', b: 'den Läufer', r: 'den Turm', q: 'die Dame', k: 'den König' };
const ANALYSIS = { depth: 14, movetime: 1500, multipv: 2 };

// Gewinnwahrscheinlichkeit für Weiß (Lichess-Formel)
function winW(e) {
  if (!e) return 50;
  if (e.mate != null) return e.mateFor === 'w' ? 100 : 0;
  const cp = Math.max(-1000, Math.min(1000, e.cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}
const winFor = (c, e) => (c === 'w' ? winW(e) : 100 - winW(e));
const moveAcc = (loss) => Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669));

// Engine-Zeile (Sicht des Ziehenden) → Bewertung aus Sicht von Weiß
function toWhite(line, stm) {
  const opp = stm === 'w' ? 'b' : 'w';
  if (line.mate != null) return { mate: Math.abs(line.mate), mateFor: line.mate > 0 ? stm : opp };
  return { cp: stm === 'w' ? line.cp : -line.cp };
}
function fmtEval(e, persp = 'w') {
  if (!e) return '…';
  if (e.mate != null) return (e.mateFor === persp ? '+' : '−') + 'M' + e.mate;
  const v = (persp === 'w' ? e.cp : -e.cp) / 100;
  return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1).replace('.', ',');
}
const fenKey = (fen) => fen.split(' ').slice(0, 4).join(' ');
const uciObj = (u) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
// Deutsche Figurenbuchstaben (S, L, T, D)
const de = (san) => san.replace(/[NBRQ]/g, (x) => ({ N: 'S', B: 'L', R: 'T', Q: 'D' })[x]);
function sanOf(fen, uci) {
  try { return de(new Chess(fen).move(uciObj(uci)).san); } catch { return uci; }
}

// Opfer: die gezogene Figur steht nach dem Zug ungedeckt oder angreifbar durch eine billigere Figur
function isSacrifice(fenBefore, uci) {
  const c = new Chess(fenBefore);
  const mv = c.move(uciObj(uci));
  const piece = mv.promotion || mv.piece;
  if (piece === 'p' || piece === 'k') return false;
  const gained = mv.captured ? VAL[mv.captured] : 0;
  const caps = c.moves({ verbose: true }).filter((m) => m.to === mv.to && m.captured);
  if (!caps.length) return false;
  const cheapest = Math.min(...caps.map((m) => VAL[m.piece] || 0));
  const defended = c.isAttacked(mv.to, mv.color);
  const loss = defended ? VAL[piece] - cheapest : VAL[piece];
  return loss - gained >= 2;
}

// Schlagen einer gleich- oder höherwertigen Figur ist kein „großartiger“ Fund, sondern Pflicht
function obviousCapture(fen, uci) {
  const m = new Chess(fen).move(uciObj(uci));
  return !!m.captured && VAL[m.captured] >= VAL[m.piece];
}

// ---------- Zustand ----------
const $ = (id) => document.getElementById(id);
const boardEl = $('board');
let OPENINGS = {};
fetch('openings.json').then((r) => r.json()).then((j) => { OPENINGS = j; refresh(); });

const analyst = new Engine();
const opponent = new Engine();
let G = null; // aktuelle Partie
let view = 0; // angezeigte Halbzugnummer
let selected = null;
let gen = 0;

function newGame(levelIdx, player) {
  gen++;
  G = {
    level: levelIdx, player, fens: [new Chess().fen()], sans: [], ucis: [], evals: [], cls: [],
    hints: 0, over: false, result: null, reason: '', date: Date.now(), saved: false, thinking: false,
  };
  view = 0; selected = null;
  $('review').hidden = true;
  setFeedback(null, 'Partie läuft', `Du spielst ${player === 'w' ? 'Weiß' : 'Schwarz'} gegen ${LEVELS[levelIdx].name}.`);
  analyse(0);
  refresh();
  if (player === 'b') computerMove();
}

const live = () => $('optLive').checked;
const cur = () => new Chess(G.fens[G.fens.length - 1]);
const n = () => G.sans.length;

function analyse(idx) {
  const g = gen, fen = G.fens[idx];
  const c = new Chess(fen);
  if (c.isGameOver()) {
    G.evals[idx] = c.isCheckmate() ? { mate: 0, mateFor: c.turn() === 'w' ? 'b' : 'w', best: null } : { cp: 0, best: null };
    afterEval(idx);
    return;
  }
  analyst.go(fen, ANALYSIS).then((r) => {
    if (g !== gen || G.fens[idx] !== fen) return;
    const stm = c.turn();
    const e = r.lines[0] ? toWhite(r.lines[0], stm) : { cp: 0 };
    e.best = r.best;
    e.pv = r.lines[0]?.pv || [];
    if (r.lines[1]) e.second = toWhite(r.lines[1], stm);
    G.evals[idx] = e;
    afterEval(idx);
  });
}

function afterEval(idx) {
  if (idx > 0 && G.evals[idx - 1]) classify(idx);
  if (idx < n() && G.evals[idx + 1]) classify(idx + 1);
  if (idx === n() && view === n()) refresh();
  else renderMoves();
  if (G.over) maybeFinish();
}

// Halbzug k führt von Stellung k-1 nach k
function classify(k) {
  const before = G.evals[k - 1], after = G.evals[k];
  const fenB = G.fens[k - 1], uci = G.ucis[k - 1];
  const c = fenB.split(' ')[1];
  const wb = winFor(c, before), wa = winFor(c, after);
  const loss = Math.max(0, wb - wa);
  const isBest = uci === before.best;
  let cls;
  if (k <= 24 && OPENINGS[fenKey(G.fens[k])] && loss < 5) cls = 'book';
  else if ((isBest || loss < 2) && wb < 95 && wa >= 50 && isSacrifice(fenB, uci)) cls = 'brilliant';
  else if (isBest && before.second && wb - winFor(c, before.second) >= 20 && wa >= 40 && !obviousCapture(fenB, uci)) cls = 'great';
  else if (loss >= 10 && loss < 30 && k >= 2 && ['mistake', 'blunder', 'miss'].includes(G.cls[k - 2]?.cls) && wb >= 60) cls = 'miss';
  else if (isBest) cls = 'best';
  else if (loss < 2) cls = 'excellent';
  else if (loss < 10) cls = 'good';
  else if (loss < 20) cls = 'inacc';
  else if (loss < 30) cls = 'mistake';
  else cls = 'blunder';
  const prev = G.cls[k - 1];
  G.cls[k - 1] = { cls, loss, acc: moveAcc(loss) };
  if (!prev && live() && !G.over && c === G.player && k >= n() - 1) showMoveFeedback(k);
}

// ---------- Erklärungen (für Erwachsene) ----------
function explain(k) {
  const info = G.cls[k - 1]; if (!info) return null;
  const before = G.evals[k - 1], after = G.evals[k];
  const fenB = G.fens[k - 1], c = fenB.split(' ')[1];
  const bestSan = before.best ? sanOf(fenB, before.best) : null;
  const evAfter = fmtEval(after, c), evBest = fmtEval(before, c);
  const parts = [];
  const mv = new Chess(fenB).move(uciObj(G.ucis[k - 1]));
  switch (info.cls) {
    case 'book': parts.push(`Theorie: ${(OPENINGS[fenKey(G.fens[k])] || '').replace(/^\w\d\d /, '')}.`); break;
    case 'brilliant': parts.push(`Starkes Opfer: ${PNAME_ACC[mv.promotion || mv.piece]} auf ${mv.to} kann geschlagen werden, die Stellung trägt das aber.`); break;
    case 'great': parts.push(`Der einzige Zug, der die Stellung hält – die Alternativen sind deutlich schwächer (zweitbester: ${fmtEval(before.second, c)}).`); break;
    case 'best': parts.push('Engine-Zug.'); break;
    case 'excellent': parts.push(bestSan ? `Praktisch gleichwertig zum Engine-Zug ${bestSan}.` : 'Sehr präzise.'); break;
    case 'good': parts.push(`Solide. Etwas genauer war ${bestSan} (${evBest}).`); break;
    case 'miss': parts.push(`Der Gegner hatte gerade gepatzt – mit ${bestSan} (${evBest}) hättest du das ausnutzen können.`); break;
    default: parts.push(`Besser war ${bestSan} (${evBest}).`);
  }
  if (['inacc', 'mistake', 'blunder', 'miss'].includes(info.cls)) {
    if (before.mate != null && before.mateFor === c && !(after.mate != null && after.mateFor === c)) parts.push(`Du hattest Matt in ${before.mate}.`);
    if (after.mate != null && after.mateFor !== c) parts.push(`Damit lässt du Matt in ${after.mate} zu.`);
    else if (after.best) {
      const reply = new Chess(G.fens[k]).move(uciObj(after.best));
      if (reply.captured) parts.push(`Antwort ${de(reply.san)} gewinnt ${PNAME_ACC[reply.captured]} auf ${reply.to}.`);
      else parts.push(`Stärkste Antwort: ${de(reply.san)}.`);
    }
  }
  parts.push(`Stellung: ${evAfter}.`);
  return parts.join(' ');
}

function showMoveFeedback(k) {
  const info = G.cls[k - 1]; if (!info) return;
  setFeedback(info.cls, `${de(G.sans[k - 1])} – ${CLS[info.cls].name}`, explain(k));
}

function setFeedback(cls, title, text) {
  const b = $('fbBadge');
  b.textContent = cls ? CLS[cls].sym : '';
  b.style.background = cls ? CLS[cls].col : '';
  $('fbTitle').textContent = title;
  $('fbText').textContent = text || '';
}

// ---------- Züge ----------
async function playMove(uci, byPlayer) {
  const c = cur();
  const mv = c.move(uciObj(uci));
  G.fens.push(c.fen()); G.sans.push(mv.san); G.ucis.push(mv.from + mv.to + (mv.promotion || ''));
  view = n(); selected = null;
  if (byPlayer && live()) setFeedback(null, de(mv.san), 'Wird bewertet …');
  analyse(n());
  checkEnd();
  refresh();
  if (!G.over && c.turn() !== G.player) computerMove();
}

async function computerMove() {
  const g = gen, L = LEVELS[G.level];
  G.thinking = true; refresh();
  const t0 = performance.now();
  const opts = {
    multipv: L.multipv || 1, depth: L.depth, movetime: L.movetime,
    options: { 'UCI_LimitStrength': !!L.limit, 'UCI_Elo': L.limit || 1500, 'Skill Level': L.skill ?? 20 },
  };
  const fen = G.fens[n()];
  const r = await opponent.go(fen, opts);
  if (g !== gen || G.fens[n()] !== fen) return;
  let uci = r.best;
  if (L.rnd && r.lines.length > 1 && Math.random() < L.rnd) uci = r.lines[1 + Math.floor(Math.random() * (r.lines.length - 1))].pv[0];
  const wait = 450 - (performance.now() - t0);
  if (wait > 0) await new Promise((res) => setTimeout(res, wait));
  if (g !== gen || G.fens[n()] !== fen) return;
  G.thinking = false;
  playMove(uci, false);
}

function checkEnd(resign) {
  const c = cur();
  if (resign) { G.over = true; G.result = G.player === 'w' ? '0-1' : '1-0'; G.reason = 'Aufgabe'; }
  else if (c.isCheckmate()) { G.over = true; G.result = c.turn() === 'w' ? '0-1' : '1-0'; G.reason = 'Schachmatt'; }
  else if (c.isDraw() || c.isStalemate() || c.isThreefoldRepetition() || c.isInsufficientMaterial()) {
    G.over = true; G.result = '½-½';
    G.reason = c.isStalemate() ? 'Patt' : c.isThreefoldRepetition() ? 'Stellungswiederholung' : c.isInsufficientMaterial() ? 'Zu wenig Material' : '50-Züge-Regel';
  }
  if (G.over) {
    gen++; // laufende Gegnerzüge verwerfen; Analysen der Partie neu anstoßen
    G.thinking = false;
    for (let i = 0; i <= n(); i++) if (!G.evals[i]) analyse(i);
    const won = (G.result === '1-0' && G.player === 'w') || (G.result === '0-1' && G.player === 'b');
    setFeedback(null, G.result === '½-½' ? 'Remis' : won ? 'Gewonnen!' : 'Verloren', `${G.reason}. Die Auswertung erscheint, sobald alle Züge analysiert sind.`);
    maybeFinish();
  }
}

function maybeFinish() {
  if (G.evals.length < n() + 1 || G.evals.includes(undefined) || G.cls.filter(Boolean).length < n()) { refresh(); return; }
  showReview();
  if (!G.saved && G.level != null) { G.saved = true; saveGame(); }
  refresh();
}

// ---------- Auswertung ----------
function accuracyOf(color) {
  const a = G.cls.filter((x, i) => x && (i % 2 === 0) === (G.fens[0].split(' ')[1] === color)).map((x) => x.acc);
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
}

function showReview() {
  $('review').hidden = false;
  const name = (c) => (G.player == null ? (c === 'w' ? 'Weiß' : 'Schwarz') : c === G.player ? 'Du' : LEVELS[G.level].name);
  $('acc').innerHTML = ['w', 'b'].map((c) => {
    const a = accuracyOf(c);
    return `<div><span>${name(c)} (${c === 'w' ? 'Weiß' : 'Schwarz'})</span><b>${a == null ? '–' : a.toFixed(1).replace('.', ',') + ' %'}</b><span>Genauigkeit</span></div>`;
  }).join('');
  const cnt = { w: {}, b: {} };
  G.cls.forEach((x, i) => { const c = G.fens[i].split(' ')[1]; cnt[c][x.cls] = (cnt[c][x.cls] || 0) + 1; });
  $('counts').innerHTML = Object.entries(CLS).map(([k, v]) =>
    `<tr><td>${cnt.w[k] || 0}</td><td><span class="badge" style="background:${v.col}">${v.sym}</span></td><td>${v.name}</td><td>${cnt.b[k] || 0}</td></tr>`).join('');
  drawChart();
}

function drawChart() {
  const svg = $('chart'), W = 600, H = 140, N = Math.max(1, n());
  const pts = G.evals.map((e, i) => [i / N * W, H - winW(e) / 100 * H]);
  const area = `M0,${H} ` + pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${pts[pts.length - 1][0]},${H} Z`;
  let marks = '';
  G.cls.forEach((x, i) => {
    if (!['blunder', 'mistake', 'brilliant', 'great', 'miss'].includes(x.cls)) return;
    const p = pts[i + 1];
    marks += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${getComputedStyle(document.documentElement).getPropertyValue('--' + x.cls.replace('inacc', 'inacc'))}"/>`;
  });
  svg.innerHTML = `<rect width="${W}" height="${H}" fill="#403d39"/><path d="${area}" fill="#f2f0ea"/>
    <line x1="0" x2="${W}" y1="${H / 2}" y2="${H / 2}" stroke="#888" stroke-dasharray="4 4"/>
    <line id="chartCur" x1="0" x2="0" y1="0" y2="${H}" stroke="#7fa650" stroke-width="2"/>${marks}`;
  updateChartCursor();
}
function updateChartCursor() {
  const l = document.getElementById('chartCur'); if (!l) return;
  const x = view / Math.max(1, n()) * 600; l.setAttribute('x1', x); l.setAttribute('x2', x);
}
$('chart').addEventListener('click', (e) => {
  const r = $('chart').getBoundingClientRect();
  go(Math.round((e.clientX - r.left) / r.width * n()));
});

// ---------- Speichern ----------
// Partien landen lokal (Offline-Puffer) und in der Datenbank auf api.illstyles.de (D1).
// Zugriff nur mit Familien-Token (Header X-Chess-Token), Spielername wählt man im Verlauf.
const STORE = 'chess.games.v1';
const API = (() => { try { return localStorage.getItem('chess.api') || 'https://api.illstyles.de'; } catch { return 'https://api.illstyles.de'; } })();
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };
let token = ls('chess.token') || '';
let playerName = ls('chess.player') || '';
let remote = null; // Partienliste vom Server, null = nicht verbunden

function loadAll() {
  let all; try { all = JSON.parse(localStorage.getItem(STORE)) || []; } catch { all = []; }
  // altes Format (vor der Datenbank): Farbe stand in player, Züge auf oberster Ebene
  return all.map((g) => g.data ? g : {
    id: 'local-' + g.date, player: playerName || 'Spieler', color: g.player, date: g.date, level: g.level, result: g.result,
    reason: g.reason, acc: g.acc, opening: g.opening, moves: g.sans.length, data: { sans: g.sans, evals: g.evals, cls: g.cls },
  });
}
function storeAll(all) { try { localStorage.setItem(STORE, JSON.stringify(all.slice(0, 100))); } catch {} }

async function api(path, opts = {}) {
  const r = await fetch(API + '/chess/' + path, { ...opts, headers: { 'X-Chess-Token': token, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (r.status === 401) throw Object.assign(new Error('unauthorized'), { auth: true });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

function saveGame() {
  const all = loadAll();
  all.unshift({
    id: (crypto.randomUUID?.() || String(Math.random()).slice(2) + Date.now()), player: playerName || 'Spieler', color: G.player,
    date: G.date, level: G.level, result: G.result, reason: G.reason, acc: accuracyOf(G.player), opening: openingName(n()), moves: n(),
    data: { sans: G.sans, evals: G.evals.map(({ cp, mate, mateFor, best, second }) => ({ cp, mate, mateFor, best, second })), cls: G.cls, hints: G.hints },
    synced: false,
  });
  storeAll(all);
  sync();
}

// Ungesendete Partien hochladen, danach Liste vom Server holen
async function sync() {
  if (!token) { renderHistory(); return; }
  const all = loadAll();
  try {
    for (const g of all.filter((x) => !x.synced)) {
      const { synced, ...rec } = g; void synced;
      await api('games', { method: 'POST', body: JSON.stringify(rec) });
      g.synced = true;
    }
    storeAll(all);
    remote = await api('games' + (playerName ? '?player=' + encodeURIComponent(playerName) : ''));
    $('dbState').textContent = 'Datenbank verbunden'; $('dbState').className = 'db ok';
    if (!$('playerSel').dataset.loaded) loadPlayers();
  } catch (e) {
    remote = null;
    $('dbState').textContent = e.auth ? 'Token ungültig' : 'Offline – lokal gespeichert';
    $('dbState').className = 'db err';
  }
  renderHistory();
}

async function loadPlayers() {
  try {
    const list = await api('players');
    fillPlayers(list.map((p) => p.player));
    $('playerSel').dataset.loaded = 1;
  } catch {}
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function renderHistory() {
  const local = loadAll().filter((g) => !playerName || g.player === playerName);
  // Server-Liste plus lokal noch nicht hochgeladene
  const list = remote ? [...local.filter((g) => !g.synced), ...remote] : local;
  const stats = { w: 0, d: 0, l: 0 };
  $('history').innerHTML = list.length ? list.map((g) => {
    const won = (g.result === '1-0' && g.color === 'w') || (g.result === '0-1' && g.color === 'b');
    const res = g.result === '½-½' ? '½' : won ? 'Sieg' : 'Niederlage';
    stats[g.result === '½-½' ? 'd' : won ? 'w' : 'l']++;
    const d = new Date(g.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `<li data-id="${esc(g.id)}"><span><span class="res">${res}</span> vs ${LEVELS[g.level].name} <span class="meta">(${g.color === 'w' ? '♔' : '♚'}, ${Math.ceil(g.moves / 2)} Züge)</span></span><span class="meta">${g.acc != null ? g.acc.toFixed(0) + ' % · ' : ''}${d}${g.synced === false && token ? ' ⏳' : ''}</span></li>`;
  }).join('') : '<li class="meta">Noch keine Partien</li>';
  $('histStats').innerHTML = list.length ? `<div><b>${stats.w}</b><span>Siege</span></div><div><b>${stats.d}</b><span>Remis</span></div><div><b>${stats.l}</b><span>Niederlagen</span></div>` : '';
}

$('history').addEventListener('click', async (e) => {
  const li = e.target.closest('li[data-id]'); if (!li) return;
  const id = li.dataset.id;
  let g = loadAll().find((x) => x.id === id);
  if (!g) { try { g = await api('games/' + encodeURIComponent(id)); } catch { return; } }
  gen++;
  const c = new Chess(); const fens = [c.fen()], ucis = [];
  for (const s of g.data.sans) { const m = c.move(s); fens.push(c.fen()); ucis.push(m.from + m.to + (m.promotion || '')); }
  G = {
    date: g.date, level: g.level, player: g.color, result: g.result, reason: g.reason, sans: g.data.sans, evals: g.data.evals, cls: g.data.cls,
    hints: g.data.hints || 0, fens, ucis, over: true, saved: true, thinking: false,
  };
  view = n(); selected = null;
  $('dlgHistory').close();
  showReview();
  setFeedback(null, `${g.result} – ${g.reason}`, `${g.player} gegen ${LEVELS[g.level].name}. Klicke auf Züge oder die Kurve.`);
  refresh();
});

function fillPlayers(names) {
  names = [...new Set([...names, playerName].filter(Boolean))];
  $('playerSel').innerHTML = (playerName ? '' : '<option value="">– Spieler wählen –</option>')
    + names.map((nm) => `<option${nm === playerName ? ' selected' : ''}>${esc(nm)}</option>`).join('');
}
function setPlayer(v) { playerName = v; ls('chess.player', v); updateChip(); refresh(); sync(); }
function updateChip() { $('playerChip').textContent = $('menuPlayer').textContent = playerName || 'Spieler wählen'; $('histWho').textContent = playerName ? `Partien von ${playerName} – Spieler wechseln über 👤 oben rechts.` : 'Alle Partien – Spieler wählen über 👤 oben rechts.'; }
// Safari mit „Alle Cookies blockieren“ oder privatem Modus speichert evtl. nichts → sichtbar machen
const storageOk = (() => { try { localStorage.setItem('chess.t', 1); localStorage.removeItem('chess.t'); return true; } catch { return false; } })();
$('playerSel').onchange = () => setPlayer($('playerSel').value);
$('btnAddPlayer').onclick = () => { $('newPlayer').hidden = false; $('newPlayerName').value = ''; $('newPlayerName').focus(); };
$('newPlayerCancel').onclick = () => { $('newPlayer').hidden = true; };
$('newPlayer').onsubmit = (e) => {
  e.preventDefault();
  const v = $('newPlayerName').value.trim().slice(0, 40);
  if (!v) return;
  $('newPlayer').hidden = true;
  playerName = v;
  fillPlayers([...$('playerSel').options].map((o) => o.value));
  setPlayer(v);
};
$('btnToken').onclick = () => {
  const t = prompt('Familien-Token für die Partie-Datenbank:', token);
  if (t == null) return;
  token = t.trim(); ls('chess.token', token);
  $('playerSel').dataset.loaded = ''; sync();
};
fillPlayers([]);
updateChip();
if (!storageOk) { $('dbState').textContent = 'Browser speichert nichts (privater Modus / Cookies blockiert?)'; $('dbState').className = 'db err'; }

function pgn() {
  const head = `[Event "markusstuhr.de/chess"]\n[Date "${new Date(G.date).toISOString().slice(0, 10).replace(/-/g, '.')}"]\n[White "${G.player === 'w' ? 'Spieler' : 'Stockfish ' + LEVELS[G.level].name}"]\n[Black "${G.player === 'b' ? 'Spieler' : 'Stockfish ' + LEVELS[G.level].name}"]\n[Result "${(G.result || '*').replace('½-½', '1/2-1/2')}"]\n\n`;
  return head + G.sans.map((s, i) => (i % 2 === 0 ? `${i / 2 + 1}. ` : '') + s + (G.cls[i] ? { brilliant: '!!', great: '!', inacc: '?!', mistake: '?', blunder: '??', miss: '?' }[G.cls[i].cls] || '' : '')).join(' ') + ' ' + (G.result || '*').replace('½-½', '1/2-1/2');
}
$('btnPgn').onclick = () => { navigator.clipboard.writeText(pgn()); $('btnPgn').textContent = 'Kopiert ✓'; setTimeout(() => ($('btnPgn').textContent = 'PGN kopieren'), 1500); };

// ---------- Brett ----------
// Figurensätze aus lila (lichess), Lizenzen siehe Fußzeile
const PIECE_SETS = { tatiana: 'Tatiana', maestro: 'Maestro', staunty: 'Staunty', merida: 'Merida', california: 'California', cardinal: 'Cardinal', alpha: 'Alpha', chessnut: 'Chessnut', cburnett: 'Klassisch' };
let pieceSet = PIECE_SETS[ls('chess.pieces')] ? ls('chess.pieces') : 'tatiana';
$('optPieces').innerHTML = Object.entries(PIECE_SETS).map(([k, v]) => `<option value="${k}"${k === pieceSet ? ' selected' : ''}>${v}</option>`).join('');
$('optPieces').onchange = () => { pieceSet = $('optPieces').value; ls('chess.pieces', pieceSet); render(); };

const squares = {};
function buildBoard() {
  boardEl.innerHTML = '';
  const flip = G?.player === 'b';
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const file = flip ? 7 - f : f, rank = flip ? r : 7 - r;
    const sq = 'abcdefgh'[file] + (rank + 1);
    const d = document.createElement('div');
    d.className = 'sq ' + ((file + rank) % 2 ? 'l' : 'd');
    d.dataset.sq = sq;
    if (r === 7) d.innerHTML += `<span class="coord f">${'abcdefgh'[file]}</span>`;
    if (f === 0) d.innerHTML += `<span class="coord r">${rank + 1}</span>`;
    boardEl.appendChild(d); squares[sq] = d;
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('arrows'); svg.setAttribute('viewBox', '0 0 8 8'); svg.id = 'arrows';
  boardEl.appendChild(svg);
  boardEl.dataset.flip = flip ? 1 : 0;
}

function sqXY(sq) {
  const flip = G?.player === 'b';
  const f = sq.charCodeAt(0) - 97, r = +sq[1] - 1;
  return flip ? [7 - f + 0.5, r + 0.5] : [f + 0.5, 7 - r + 0.5];
}
function drawArrow(uci, color) {
  const [x1, y1] = sqXY(uci.slice(0, 2)), [x2, y2] = sqXY(uci.slice(2, 4));
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1) - 0.1;
  return `<g transform="translate(${x1} ${y1}) rotate(${a * 180 / Math.PI})" opacity=".8">
    <rect x="0" y="-0.09" width="${L - 0.35}" height="0.18" fill="${color}"/>
    <polygon points="${L - 0.4},-0.3 ${L},0 ${L - 0.4},0.3" fill="${color}"/></g>`;
}

function render() {
  if (!G) return;
  if (boardEl.dataset.flip !== String(G.player === 'b' ? 1 : 0) || !boardEl.children.length) buildBoard();
  const c = new Chess(G.fens[view]);
  const lastUci = view > 0 ? G.ucis[view - 1] : null;
  const legal = selected && canMove() ? c.moves({ square: selected, verbose: true }) : [];
  for (const [sq, d] of Object.entries(squares)) {
    d.querySelectorAll('.pc,.mark').forEach((x) => x.remove());
    d.classList.toggle('last', !!lastUci && (lastUci.startsWith(sq) || lastUci.slice(2, 4) === sq));
    d.classList.toggle('sel', sq === selected);
    const t = legal.find((m) => m.to === sq);
    d.classList.toggle('dot', !!t && !t.captured);
    d.classList.toggle('cap', !!t && !!t.captured);
    const p = c.get(sq);
    d.classList.toggle('check', !!p && p.type === 'k' && p.color === c.turn() && c.inCheck());
    if (p) {
      const el = document.createElement('div');
      el.className = 'pc'; el.style.backgroundImage = `url(pieces/${pieceSet}/${p.color}${p.type.toUpperCase()}.svg)`;
      d.appendChild(el);
    }
  }
  // Markierung des zuletzt gezeigten Zugs
  const info = view > 0 ? G.cls[view - 1] : null;
  const showMark = info && (G.over || !live() ? G.over : true);
  if (showMark && lastUci) {
    const m = document.createElement('div');
    m.className = 'mark'; m.textContent = CLS[info.cls].sym; m.style.background = CLS[info.cls].col;
    squares[lastUci.slice(2, 4)].appendChild(m);
  }
  // Pfeile: im Review bei schlechten Zügen den besseren Zug zeigen, sonst Tipp
  let arrows = '';
  if (G.over && info && view > 0 && ['inacc', 'mistake', 'blunder', 'miss', 'good'].includes(info.cls) && G.evals[view - 1]?.best) arrows += drawArrow(G.evals[view - 1].best, '#7fa650');
  if (G.hintShown === view && G.evals[view]?.best) arrows += drawArrow(G.evals[view].best, '#5c8bb0');
  $('arrows').innerHTML = arrows;
}

function canMove() {
  return G && !G.idle && !G.over && G.level != null && view === n() && cur().turn() === G.player && !G.thinking;
}

// Klick- und Ziehsteuerung
let drag = null;
boardEl.addEventListener('pointerdown', (e) => {
  const d = e.target.closest('.sq'); if (!d || !canMove()) return;
  const sq = d.dataset.sq, c = cur(), p = c.get(sq);
  if (selected && selected !== sq && tryMove(selected, sq)) return;
  if (p && p.color === G.player) {
    selected = sq; render();
    const pc = squares[sq].querySelector('.pc');
    const r = boardEl.getBoundingClientRect();
    drag = { from: sq, el: pc, x0: e.clientX, y0: e.clientY, size: r.width / 8, moved: false };
    boardEl.setPointerCapture(e.pointerId);
  } else { selected = null; render(); }
});
boardEl.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (Math.hypot(dx, dy) > 4) drag.moved = true;
  if (drag.moved) { drag.el.classList.add('drag'); drag.el.style.transform = `translate(${dx}px,${dy}px)`; }
});
boardEl.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const dd = drag; drag = null;
  if (!dd.moved) return;
  dd.el.classList.remove('drag'); dd.el.style.transform = '';
  const el = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x.classList?.contains('sq'));
  if (!el || !tryMove(dd.from, el.dataset.sq)) render();
});

function tryMove(from, to) {
  const c = cur();
  const cands = c.moves({ square: from, verbose: true }).filter((m) => m.to === to);
  if (!cands.length) return false;
  if (cands.length > 1 || cands[0].promotion) {
    choosePromotion(G.player).then((p) => playMove(from + to + p, true));
  } else playMove(from + to, true);
  return true;
}
function choosePromotion(color) {
  return new Promise((res) => {
    const box = $('promo'); box.innerHTML = '';
    for (const p of ['q', 'r', 'b', 'n']) {
      const b = document.createElement('button');
      b.style.backgroundImage = `url(pieces/${pieceSet}/${color}${p.toUpperCase()}.svg)`;
      b.title = PNAME[p];
      b.onclick = () => { $('dlgPromo').close(); res(p); };
      box.appendChild(b);
    }
    $('dlgPromo').showModal();
  });
}

// ---------- Anzeige ----------
function openingName(upto) {
  let name = null;
  for (let i = 1; i <= upto; i++) { const o = OPENINGS[fenKey(G.fens[i])]; if (o) name = o; }
  return name;
}

function renderMoves() {
  let h = '';
  const startBlack = G.fens[0].split(' ')[1] === 'b';
  for (let i = 0; i < n(); i++) {
    if (i % 2 === 0) h += `<div class="no">${i / 2 + 1}.</div>`;
    const info = G.cls[i];
    const showSym = info && (G.over || (live() && G.fens[i].split(' ')[1] === G.player));
    const sym = showSym && !['good', 'excellent'].includes(info.cls) ? `<span class="sym" style="color:${CLS[info.cls].col}">${CLS[info.cls].sym}</span>` : '';
    h += `<div class="mv${i + 1 === view ? ' cur' : ''}" data-k="${i + 1}">${de(G.sans[i])}${sym}</div>`;
  }
  void startBlack;
  const box = $('moves'); box.innerHTML = h;
  // nur die Zugliste selbst scrollen, nie die Seite (scrollIntoView ließ mobil die Ansicht springen)
  const curEl = box.querySelector('.cur');
  if (curEl) {
    if (box.scrollWidth > box.clientWidth) box.scrollLeft = curEl.offsetLeft - box.clientWidth / 2;
    else box.scrollTop = curEl.offsetTop - box.offsetTop - box.clientHeight / 2;
  }
  updateChartCursor();
}
$('moves').addEventListener('click', (e) => { const m = e.target.closest('.mv'); if (m) go(+m.dataset.k); });

function renderEval() {
  const bar = $('evalbar'), e = G.evals[view];
  bar.style.visibility = live() || G.over ? 'visible' : 'hidden';
  bar.classList.toggle('flip', G.player === 'b');
  const w = winW(e);
  $('evalfill').style.height = w + '%';
  bar.classList.toggle('adv-b', w < 50);
  $('evaltxt').textContent = e ? fmtEval(e, w < 50 ? 'b' : 'w').replace(/^[+−]/, '') : '…';
}

function renderPlayers() {
  const L = LEVELS[G.level];
  const me = G.player;
  const accMe = G.over ? accuracyOf(me) : null, accOp = G.over ? accuracyOf(me === 'w' ? 'b' : 'w') : null;
  const fmt = (a) => (a != null ? `<span class="acc-mini">${a.toFixed(1).replace('.', ',')} %</span>` : '');
  $('plBottom').innerHTML = `${me === 'w' ? '♔' : '♚'} ${esc(playerName || 'Du')} ${fmt(accMe)}`;
  $('plTop').innerHTML = `${me === 'w' ? '♚' : '♔'} ${L.name} <span class="acc-mini">(${L.elo})</span> ${fmt(accOp)} ${G.thinking ? '<span class="thinking">denkt …</span>' : ''}`;
}

function refresh() {
  if (!G) return;
  render(); renderMoves(); renderEval(); renderPlayers();
  const op = openingName(view);
  $('opening').textContent = op || (view === 0 ? 'Ausgangsstellung' : '');
  $('btnUndo').disabled = G.idle || G.over || G.thinking || n() < 2 || view !== n();
  $('btnHint').disabled = !canMove();
  $('btnResign').disabled = G.idle || G.over;
  if (G.over && view > 0 && G.cls[view - 1]) showMoveFeedbackReview(view);
}
function showMoveFeedbackReview(k) {
  const info = G.cls[k - 1];
  const who = G.fens[k - 1].split(' ')[1] === G.player ? '' : ` (${LEVELS[G.level].name})`;
  setFeedback(info.cls, `${Math.ceil(k / 2)}${k % 2 ? '.' : '…'} ${de(G.sans[k - 1])}${who} – ${CLS[info.cls].name}`, explain(k));
}

function go(k) {
  if (!G) return;
  view = Math.max(0, Math.min(n(), k)); selected = null; refresh();
}
$('nav').addEventListener('click', (e) => {
  const a = e.target.dataset.nav; if (!a || !G) return;
  go({ start: 0, prev: view - 1, next: view + 1, end: n() }[a]);
});
document.addEventListener('keydown', (e) => {
  if (!G || e.target.closest('dialog')) return;
  if (e.key === 'ArrowLeft') go(view - 1);
  if (e.key === 'ArrowRight') go(view + 1);
});

// ---------- Buttons ----------
$('btnHint').onclick = () => {
  if (!G.evals[n()]) { setFeedback(null, 'Tipp', 'Analyse läuft noch …'); return; }
  G.hints++; G.hintShown = n(); render();
  setFeedback(null, 'Tipp', `Engine-Vorschlag: ${sanOf(G.fens[n()], G.evals[n()].best)} (${fmtEval(G.evals[n()], G.player)}).`);
};
$('btnUndo').onclick = () => {
  gen++;
  do { G.fens.pop(); G.sans.pop(); G.ucis.pop(); } while (n() > 0 && cur().turn() !== G.player);
  G.evals.length = n() + 1; G.cls.length = n();
  view = n(); selected = null;
  if (!G.evals[n()]) analyse(n());
  setFeedback(null, 'Zug zurückgenommen', 'Du bist wieder am Zug.');
  refresh();
};
$('btnResign').onclick = () => { if (confirm('Partie aufgeben?')) { checkEnd(true); refresh(); } };
$('optLive').onchange = () => { try { localStorage.setItem('chess.live', $('optLive').checked ? 1 : 0); } catch {} refresh(); };
try { if (localStorage.getItem('chess.live') === '0') $('optLive').checked = false; } catch {}

// Neue Partie
$('levels').innerHTML = LEVELS.map((l, i) => `<label><input type="radio" name="level" value="${i}"><b>${l.name}</b><span>Elo ${l.elo}</span></label>`).join('');
let lastLevel = 2;
try { lastLevel = +(localStorage.getItem('chess.level') ?? 2); } catch {}
$('levels').querySelectorAll('input')[lastLevel].checked = true;
$('btnPlayer').onclick = () => { $('dlgSettings').showModal(); sync(); };
$('btnSettingsClose').onclick = $('btnSettingsX').onclick = () => $('dlgSettings').close();
$('btnHistory').onclick = () => { $('dlgHistory').showModal(); sync(); };
$('btnHistoryClose').onclick = $('btnHistoryX').onclick = () => $('dlgHistory').close();
$('btnNewMobile').onclick = () => $('btnNew').click();
$('btnMenu').onclick = () => $('dlgMenu').showModal();
$('btnMenuX').onclick = () => $('dlgMenu').close();
$('dlgMenu').querySelector('.menu-list').onclick = (e) => {
  const act = e.target.closest('button')?.dataset.act; if (!act) return;
  $('dlgMenu').close();
  ({ new: $('btnNew'), history: $('btnHistory'), player: $('btnPlayer') })[act].click();
};
$('btnNew').onclick = () => $('dlgNew').showModal();
$('dlgNew').addEventListener('close', () => {
  if ($('dlgNew').returnValue !== 'ok') return;
  const f = $('dlgNew').querySelector('form');
  const lvl = +f.level.value;
  let col = f.color.value; if (col === 'r') col = Math.random() < 0.5 ? 'w' : 'b';
  try { localStorage.setItem('chess.level', lvl); } catch {}
  newGame(lvl, col);
});

G = { level: lastLevel, player: 'w', fens: [new Chess().fen()], sans: [], ucis: [], evals: [], cls: [], over: false, thinking: false, idle: true };
refresh();
sync().then(() => { if (G.idle) $('history').querySelector('li[data-id]')?.click(); });
// Mausrad über dem Brettbereich zoomt das Brett zwischen 25 % und Vollbild
let zoom = Math.min(1, Math.max(0.25, +ls('chess.zoom') || 1));
const applyZoom = () => document.querySelector('.board-col').style.setProperty('--zoom', zoom);
applyZoom();
document.querySelector('.board-col').addEventListener('wheel', (e) => {
  if (matchMedia('(max-width: 860px)').matches) return;
  e.preventDefault();
  zoom = Math.min(1, Math.max(0.25, zoom * Math.exp(-e.deltaY * 0.0015)));
  applyZoom(); ls('chess.zoom', zoom.toFixed(3));
}, { passive: false });
window.__chess = { get G() { return G; }, playMove, newGame };
