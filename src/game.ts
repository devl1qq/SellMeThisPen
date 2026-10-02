import {
  JOBS, SKILLS, JOB_CATS, SLOTS, PERKS, TICKERS, MARKET_UNLOCK, getItem,
  type Req, type JobDef, type SkillDef, type SlotId, type Lang, type ItemDef,
} from './data';
import { t, L, detectLang } from './i18n';
import { usd } from './fmt';
import { storage } from './sdk';
import { ACHIEVEMENTS, ACH, type AchDef } from './achievements';

// ---------- Constants ----------

export const BASE_SPEED = 6; // game days per real second
export const START_AGE = 14;
export const WILL_AGE = 30;
export const BASE_LIFESPAN = 70;
export const TURBO_MULT = 3;
export const BONUS_CAP = 8 * 3600; // max stored Turbo seconds
const SAVE_KEY = 'smtp-save-v1';

export const JOB: Record<string, JobDef> = Object.fromEntries(JOBS.map((j) => [j.id, j]));
export const SKILL: Record<string, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

// ---------- State ----------

export interface Prog { level: number; xp: number; maxLevel: number }
export interface Stock { price: number; hist: number[]; shares: number; cost: number }

export interface State {
  v: number;
  money: number;
  days: number;
  job: string;
  skill: string;
  jobs: Record<string, Prog>;
  skills: Record<string, Prog>;
  unlocked: string[];
  owned: string[];
  active: Record<SlotId, string | null>;
  heat: number;
  rep: number;
  taxEvasion: boolean;
  cd: Record<string, number>;
  bribes: number;
  jail: number;
  stocks: Record<string, Stock>;
  pump: number;
  dayAcc: number;
  gen: number;
  points: number;
  perks: Record<string, number>;
  lifeEarned: number;
  totalEarned: number;
  bonus: number;
  useBonus: boolean;
  paused: boolean;
  autoPromote: boolean;
  autoLearn: boolean;
  lang: Lang;
  lastSave: number;
  eventTimer: number;
  dead: boolean;
  ach: string[]; // dynasty-wide
  stats: Record<string, number>; // dynasty-wide counters for achievements
}

const prog = (): Prog => ({ level: 0, xp: 0, maxLevel: 0 });

function freshStocks(): Record<string, Stock> {
  return Object.fromEntries(TICKERS.map((tk) => [tk.id, { price: tk.start, hist: [tk.start], shares: 0, cost: 0 }]));
}

export function freshState(): State {
  const s: State = {
    v: 1, money: 0, days: START_AGE * 365, job: 'penSeller', skill: 'concentration',
    jobs: Object.fromEntries(JOBS.map((j) => [j.id, prog()])),
    skills: Object.fromEntries(SKILLS.map((k) => [k.id, prog()])),
    unlocked: [], owned: [], active: { housing: 'box', transport: 'feet', water: null, sky: null, staff: null, style: null },
    heat: 0, rep: 0, taxEvasion: false, cd: {}, bribes: 0, jail: 0,
    stocks: freshStocks(), pump: 0, dayAcc: 0,
    gen: 1, points: 0, perks: {}, lifeEarned: 0, totalEarned: 0,
    bonus: 0, useBonus: false, paused: false, autoPromote: true, autoLearn: false,
    lang: detectLang(), lastSave: Date.now(), eventTimer: 150, dead: false,
    ach: [], stats: {},
  };
  resetLife(s);
  return s;
}

/** Reset everything that belongs to a single life; keeps dynasty-level progress. */
function resetLife(s: State) {
  for (const p of [...Object.values(s.jobs), ...Object.values(s.skills)]) {
    p.maxLevel = Math.max(p.maxLevel, p.level);
    p.level = 0;
    p.xp = 0;
  }
  s.money = startMoney(s);
  s.days = START_AGE * 365;
  s.job = 'penSeller';
  s.skill = 'concentration';
  s.unlocked = [];
  s.owned = ['box', 'feet'];
  s.active = { housing: 'box', transport: 'feet', water: null, sky: null, staff: null, style: null };
  s.heat = 0; s.rep = 0; s.taxEvasion = false; s.cd = {}; s.bribes = 0; s.jail = 0;
  s.stocks = freshStocks(); s.pump = 0; s.dayAcc = 0;
  s.lifeEarned = 0; s.dead = false; s.eventTimer = 150;
  checkUnlocks(s, true);
}

const perk = (s: State, id: string) => s.perks[id] ?? 0;
export const startMoney = (s: State) => (perk(s, 'startCapital') ? 50 * Math.pow(4, perk(s, 'startCapital')) : 0);

// ---------- Hooks (set by UI) ----------

export interface AuditInfo { fine: number; jailDays: number }
export const hooks = {
  toast: (_msg: string, _kind?: 'good' | 'bad' | 'info') => {},
  log: (_msg: string) => {},
  audit: (_info: AuditInfo) => {},
  death: () => {},
  event: (_ev: GameEvent) => {},
  achievement: (_a: AchDef) => {},
};

export const stat = (s: State, k: string, n = 1) => { s.stats[k] = (s.stats[k] ?? 0) + n; };

// ---------- Modifiers ----------

export type Mods = Record<string, number>;
export const M = (m: Mods, k: string) => m[k] ?? 1;
export const A = (m: Mods, k: string) => m['add:' + k] ?? 0;

export function computeMods(s: State): Mods {
  const m: Mods = {};
  const mul = (k: string, v: number) => { m[k] = (m[k] ?? 1) * v; };
  const add = (k: string, v: number) => { m['add:' + k] = (m['add:' + k] ?? 0) + v; };
  for (const d of SKILLS) {
    const l = s.skills[d.id].level;
    if (!l) continue;
    if (d.mode === 'mul') mul(d.effect, 1 + l * d.per);
    else if (d.mode === 'div') mul(d.effect, 1 / (1 + l * d.per));
    else add(d.effect, l * d.per);
  }
  for (const slot of SLOTS) {
    const id = s.active[slot.id];
    if (!id) continue;
    for (const e of getItem(id).effects) e.type.startsWith('add:') ? add(e.type.slice(4), e.value) : mul(e.type, e.value);
  }
  mul('xpAll', 1 + 0.15 * perk(s, 'fastLearner'));
  mul('incomeAll', 1 + 0.15 * perk(s, 'silverSpoon'));
  mul('heatDecay', 1 + 0.25 * perk(s, 'cleanRecord'));
  mul('fine', Math.pow(0.9, perk(s, 'cleanRecord')));
  mul('speed', 1 + 0.05 * perk(s, 'timeMaster'));
  add('lifespanYears', 2 * perk(s, 'longevity'));
  for (const id of s.ach) {
    const b = ACH[id]?.bonus;
    if (b) b.type.startsWith('add:') ? add(b.type.slice(4), b.value) : mul(b.type, b.value);
  }
  return m;
}

export const perkValue = (id: string, lvl: number): Record<string, string> => {
  switch (id) {
    case 'startCapital': return { v: usd(lvl ? 50 * Math.pow(4, lvl) : 0) };
    case 'fastLearner': case 'silverSpoon': return { v: (1 + 0.15 * lvl).toFixed(2) };
    case 'longevity': return { v: String(2 * lvl) };
    case 'cleanRecord': return { v: (1 + 0.25 * lvl).toFixed(2), w: Math.pow(0.9, lvl).toFixed(2) };
    case 'timeMaster': return { v: (1 + 0.05 * lvl).toFixed(2) };
    default: return {};
  }
};

// ---------- Derived values ----------

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const CAT_INCOME: Record<string, string> = Object.fromEntries(JOB_CATS.map((c) => [c.id, c.income]));

export function repMult(s: State, cat: string): number {
  if (cat === 'street' || cat === 'office') return clamp(1 + s.rep / 400, 0.4, 2.5);
  if (cat === 'shadow') return s.rep < 0 ? Math.min(4, 1 - s.rep / 300) : 1;
  return 1;
}

export const maxXp = (base: number, lvl: number) => Math.round(base * (lvl + 1) * Math.pow(1.01, lvl));
const legacyMult = (p: Prog) => 1 + p.maxLevel / 10;

export function jobIncome(s: State, m: Mods, d: JobDef): number {
  const lvl = s.jobs[d.id].level;
  return d.income * (1 + Math.log10(lvl + 1)) * M(m, 'incomeAll') * M(m, CAT_INCOME[d.cat]) * repMult(s, d.cat);
}
export function happiness(m: Mods) { return M(m, 'happiness'); }
export function jobXpGain(s: State, m: Mods, d: JobDef): number {
  return 10 * happiness(m) * M(m, 'xpAll') * M(m, 'jobXp') * M(m, 'jobXp:' + d.cat) * legacyMult(s.jobs[d.id]);
}
export function skillXpGain(s: State, m: Mods, d: SkillDef): number {
  return 10 * happiness(m) * M(m, 'xpAll') * M(m, 'skillXp') * legacyMult(s.skills[d.id]);
}
export function lifespanDays(m: Mods): number {
  return (BASE_LIFESPAN * M(m, 'lifespan') + A(m, 'lifespanYears')) * 365;
}
export function expenses(s: State, m: Mods): number {
  let sum = 0;
  for (const slot of SLOTS) { const id = s.active[slot.id]; if (id) sum += getItem(id).upkeep; }
  return sum * M(m, 'expenses') * (s.taxEvasion ? 0.5 : 1);
}
export function income(s: State, m: Mods): number {
  return s.jail > 0 ? 0 : jobIncome(s, m, JOB[s.job]);
}
export const turboOn = (s: State) => s.useBonus && s.bonus > 0;
export function speed(s: State, m: Mods): number {
  return BASE_SPEED * M(m, 'speed') * (turboOn(s) ? TURBO_MULT : 1);
}
export function netWorth(s: State): number {
  let v = s.money;
  for (const tk of TICKERS) v += s.stocks[tk.id].shares * s.stocks[tk.id].price;
  return v;
}
export function wealthTier(s: State): number {
  const nw = netWorth(s);
  return [1e3, 1e5, 1e7, 1e9, 1e12].filter((x) => nw >= x).length;
}
export const marketOpen = (s: State) => s.lifeEarned >= MARKET_UNLOCK || s.unlocked.includes('internBroker');
export const ageYears = (s: State) => s.days / 365;

// ---------- Requirements / unlocks ----------

export function reqMet(s: State, r: Req): boolean {
  if ('job' in r) return s.jobs[r.job].level >= r.level;
  if ('skill' in r) return s.skills[r.skill].level >= r.level;
  if ('repMax' in r) return s.rep <= r.repMax;
  return s.gen >= r.gen;
}

export function checkUnlocks(s: State, silent = false) {
  const fresh: string[] = [];
  for (const d of [...JOBS, ...SKILLS]) {
    if (s.unlocked.includes(d.id)) continue;
    if (d.req.every((r) => reqMet(s, r))) { s.unlocked.push(d.id); fresh.push(L(d.name)); }
  }
  if (!silent && fresh.length) {
    hooks.toast(t('toast.unlocked', { n: fresh.join(', ') }), 'good');
    hooks.log(t('toast.unlocked', { n: fresh.join(', ') }));
  }
}

// ---------- Tick ----------

function addXp(p: Prog, base: number, amount: number): number {
  p.xp += amount;
  let ups = 0;
  let need = maxXp(base, p.level);
  while (p.xp >= need && ups < 100000) {
    p.xp -= need;
    p.level++;
    ups++;
    need = maxXp(base, p.level);
  }
  return ups;
}

function gauss() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function tick(s: State, realDt: number) {
  if (s.dead) return;
  const m = computeMods(s);
  const dt = realDt * speed(s, m);
  if (turboOn(s)) { s.bonus = Math.max(0, s.bonus - realDt * (TURBO_MULT - 1)); s.stats.turbo = 1; }
  s.days += dt;

  const jd = JOB[s.job], sd = SKILL[s.skill];
  if (s.jail <= 0) addXp(s.jobs[s.job], jd.maxXp, jobXpGain(s, m, jd) * dt);
  addXp(s.skills[s.skill], sd.maxXp, skillXpGain(s, m, sd) * dt * (s.jail > 0 ? 0.5 : 1));

  const inc = income(s, m);
  s.money += (inc - expenses(s, m)) * dt;
  s.lifeEarned += inc * dt;
  s.totalEarned += inc * dt;
  if (s.money < 0) repossess(s);

  s.heat = clamp(s.heat - 0.04 * M(m, 'heatDecay') * dt + (s.taxEvasion ? 0.1 * dt : 0), 0, 100);
  for (const k in s.cd) s.cd[k] = Math.max(0, s.cd[k] - dt);
  if (s.jail > 0) {
    s.jail -= dt;
    if (s.jail <= 0) { s.jail = 0; hooks.toast(t('toast.free'), 'good'); }
  }

  s.dayAcc += dt;
  while (s.dayAcc >= 1) { s.dayAcc -= 1; dailyStep(s, m); }

  checkUnlocks(s);
  automate(s, m);
  achTimer -= realDt;
  if (achTimer <= 0) { achTimer = 0.25; checkAchievements(s); }

  if (s.days >= lifespanDays(m)) { s.dead = true; hooks.death(); return; }

  s.eventTimer -= realDt;
  if (s.eventTimer <= 0) {
    s.eventTimer = 120 + Math.random() * 120;
    const ev = pickEvent(s);
    if (ev) hooks.event(ev);
  }
}

let achTimer = 0;

export function checkAchievements(s: State) {
  let maxJob = 0, maxSkill = 0, stockValue = 0;
  for (const k in s.jobs) maxJob = Math.max(maxJob, s.jobs[k].level);
  for (const k in s.skills) maxSkill = Math.max(maxSkill, s.skills[k].level);
  for (const tk of TICKERS) stockValue += s.stocks[tk.id].shares * s.stocks[tk.id].price;
  const ctx = { netWorth: netWorth(s), maxJob, maxSkill, stockValue };
  for (const a of ACHIEVEMENTS) {
    if (s.ach.includes(a.id) || !a.check(s, ctx)) continue;
    s.ach.push(a.id);
    hooks.achievement(a);
  }
}

function repossess(s: State) {
  s.money = 0;
  let changed = false;
  for (const slot of SLOTS) if (s.active[slot.id] !== slot.def) { s.active[slot.id] = slot.def; changed = true; }
  if (changed) { hooks.toast(t('toast.repo'), 'bad'); hooks.log(t('toast.repo')); }
}

function dailyStep(s: State, m: Mods) {
  for (const tk of TICKERS) {
    const st = s.stocks[tk.id];
    let r = tk.drift + tk.vol * gauss() + tk.revert * Math.log(tk.start / st.price);
    if (tk.penny && s.pump > 0 && Math.random() < 0.003 * s.pump) {
      r = Math.log(0.15);
      s.pump = 0;
      if (st.shares > 0) stat(s, 'rugs');
      hooks.toast(t('toast.rug'), 'bad');
      hooks.log(t('toast.rug'));
    }
    st.price = Math.max(0.01, st.price * Math.exp(r));
    st.hist.push(st.price);
    if (st.hist.length > 120) st.hist.shift();
  }
  if (s.pump > 0) s.pump = Math.max(0, s.pump - 0.02);

  if (s.heat > 40 && s.jail <= 0) {
    const p = Math.pow((s.heat - 40) / 60, 2) * 0.004;
    if (Math.random() < p) audit(s, m);
  }
}

export function auditChancePerYear(s: State): number {
  if (s.heat <= 40) return 0;
  const p = Math.pow((s.heat - 40) / 60, 2) * 0.004;
  return 1 - Math.pow(1 - p, 365);
}

function audit(s: State, m: Mods) {
  const heat0 = s.heat;
  const fine = Math.max(0, s.money) * (0.15 + heat0 / 400) * M(m, 'fine');
  s.money -= fine;
  s.heat = Math.max(0, s.heat - 30);
  s.rep -= 5;
  let jailDays = 0;
  if (heat0 >= 80 && Math.random() < 0.5 * M(m, 'fine')) {
    jailDays = 365 * (1 + Math.floor(Math.random() * 3));
    s.jail = jailDays;
    s.taxEvasion = false;
    stat(s, 'jails');
  }
  stat(s, 'audits');
  hooks.audit({ fine, jailDays });
}

function automate(s: State, m: Mods) {
  if (perk(s, 'autoPromote') && s.autoPromote) {
    const cat = JOB[s.job].cat;
    const best = JOBS.filter((j) => j.cat === cat && s.unlocked.includes(j.id)).pop();
    if (best && best.id !== s.job) { s.job = best.id; hooks.log(t('log.job', { n: L(best.name) })); }
  }
  if (perk(s, 'autoLearn') && s.autoLearn) {
    let best = s.skill, bestTime = Infinity;
    for (const d of SKILLS) {
      if (!s.unlocked.includes(d.id)) continue;
      const p = s.skills[d.id];
      const time = (maxXp(d.maxXp, p.level) - p.xp) / skillXpGain(s, m, d);
      if (time < bestTime) { bestTime = time; best = d.id; }
    }
    s.skill = best;
  }
}

// ---------- Player actions ----------

export function chooseJob(s: State, id: string) {
  if (!s.unlocked.includes(id) || s.job === id) return;
  s.job = id;
  hooks.log(t('log.job', { n: L(JOB[id].name) }));
}
export function chooseSkill(s: State, id: string) {
  if (s.unlocked.includes(id)) s.skill = id;
}

export function itemPrice(m: Mods, it: ItemDef) { return it.price * M(m, 'shopPrice'); }

export function buyItem(s: State, id: string): boolean {
  const it = getItem(id);
  if (s.owned.includes(id)) { equip(s, id); return true; }
  const price = itemPrice(computeMods(s), it);
  if (s.money < price) { hooks.toast(t('toast.noMoney'), 'bad'); return false; }
  s.money -= price;
  s.owned.push(id);
  s.active[it.slot] = id;
  hooks.log(t('log.bought', { n: L(it.name) }));
  return true;
}

export function equip(s: State, id: string) {
  if (!s.owned.includes(id)) return;
  const it = getItem(id);
  const slot = SLOTS.find((x) => x.id === it.slot)!;
  s.active[it.slot] = s.active[it.slot] === id && slot.def === null ? null : id;
}

// Schemes

export const COOLDOWN = { lie: 30, honest: 45, bribe: 60 };
export const refIncome = (s: State, m: Mods) => Math.max(50, jobIncome(s, m, JOB[s.job]));
export function lieChance(s: State, m: Mods) {
  return clamp(0.5 + A(m, 'lieChance') + s.skills.charisma.level * 0.001 - Math.max(0, s.heat - 50) * 0.003, 0.05, 0.95);
}
export const lieReward = (s: State, m: Mods) => refIncome(s, m) * 10 * M(m, 'lieReward');
export const honestReward = (s: State, m: Mods) => refIncome(s, m) * 3;
export const bribeCost = (s: State, m: Mods) => Math.max(1000, refIncome(s, m) * 25) * Math.pow(1.5, s.bribes);

function earn(s: State, v: number) { s.money += v; s.lifeEarned += v; s.totalEarned += v; }

export function doLie(s: State) {
  if ((s.cd.lie ?? 0) > 0 || s.jail > 0) return;
  const m = computeMods(s);
  const reward = lieReward(s, m);
  s.cd.lie = COOLDOWN.lie;
  if (Math.random() < lieChance(s, m)) {
    earn(s, reward);
    s.heat = Math.min(100, s.heat + 6);
    s.rep -= 3;
    stat(s, 'lies');
    hooks.toast(t('toast.lieOk', { v: usd(reward) }), 'good');
  } else {
    const loss = Math.min(Math.max(0, s.money), reward * 0.6);
    s.money -= loss;
    s.heat = Math.min(100, s.heat + 15);
    s.rep -= 10;
    stat(s, 'liesFailed');
    hooks.toast(t('toast.lieFail', { v: usd(loss) }), 'bad');
  }
}

export function doHonest(s: State) {
  if ((s.cd.honest ?? 0) > 0 || s.jail > 0) return;
  const v = honestReward(s, computeMods(s));
  s.cd.honest = COOLDOWN.honest;
  earn(s, v);
  s.rep += 5;
  s.heat = Math.max(0, s.heat - 2);
  hooks.toast(t('toast.honest', { v: usd(v) }), 'good');
}

export function doBribe(s: State) {
  if ((s.cd.bribe ?? 0) > 0) return;
  const cost = bribeCost(s, computeMods(s));
  if (s.money < cost) { hooks.toast(t('toast.noMoney'), 'bad'); return; }
  s.money -= cost;
  s.bribes++;
  stat(s, 'bribes');
  s.cd.bribe = COOLDOWN.bribe;
  if (Math.random() < 0.12) {
    s.heat = Math.min(100, s.heat + 25);
    s.rep -= 10;
    hooks.toast(t('toast.bribeFail'), 'bad');
  } else {
    s.heat = Math.max(0, s.heat - 35);
    hooks.toast(t('toast.bribeOk'), 'good');
  }
}

export function toggleTax(s: State) { s.taxEvasion = !s.taxEvasion; }

// Market

export function buyStock(s: State, id: string, frac: number) {
  const st = s.stocks[id];
  const amount = Math.max(0, s.money) * frac;
  if (amount < 1) { hooks.toast(t('toast.noMoney'), 'bad'); return; }
  s.money -= amount;
  st.shares += amount / st.price;
  st.cost += amount;
  stat(s, 'buys');
}

export function sellStock(s: State, id: string, frac: number) {
  const st = s.stocks[id];
  if (st.shares <= 0) return;
  const sh = st.shares * frac;
  const proceeds = sh * st.price;
  const basis = st.cost * frac;
  s.money += proceeds;
  st.shares -= sh;
  st.cost -= basis;
  if (proceeds > basis) { s.lifeEarned += proceeds - basis; s.totalEarned += proceeds - basis; }
  const tk = TICKERS.find((x) => x.id === id)!;
  if (tk.penny && s.pump >= 1) {
    s.heat = Math.min(100, s.heat + 4 * s.pump);
    s.rep -= Math.round(5 * s.pump);
    st.price = Math.max(0.01, st.price * 0.4);
    s.pump = 0;
    if (proceeds > basis) stat(s, 'dumps');
    hooks.toast(t('toast.dump', { v: usd(proceeds) }), 'info');
    hooks.log(t('toast.dump', { v: usd(proceeds) }));
  }
}

// Priced off the position size: each pump (+20–35%) should pay off unless the rug gets pulled first.
export const pumpCost = (s: State) => Math.max(200, s.stocks.PENZ.shares * s.stocks.PENZ.price * 0.08);
export function pump(s: State) {
  const cost = pumpCost(s);
  if (s.money < cost) { hooks.toast(t('toast.noMoney'), 'bad'); return; }
  s.money -= cost;
  const st = s.stocks.PENZ;
  st.price *= 1.2 + Math.random() * 0.15;
  st.hist[st.hist.length - 1] = st.price;
  s.pump += 1;
  s.heat = Math.min(100, s.heat + 5);
  hooks.toast(t('toast.pump'), 'info');
}

// Legacy

export const legacyGain = (s: State) => Math.max(s.days >= WILL_AGE * 365 ? 1 : 0, Math.floor(Math.pow(s.lifeEarned / 1e4, 0.35)));
export function perkCost(id: string, lvl: number) {
  const d = PERKS.find((p) => p.id === id)!;
  return Math.ceil(d.base * Math.pow(d.growth, lvl));
}
export function buyPerk(s: State, id: string) {
  const d = PERKS.find((p) => p.id === id)!;
  const lvl = perk(s, id);
  if (d.max && lvl >= d.max) return;
  const c = perkCost(id, lvl);
  if (s.points < c) return;
  s.points -= c;
  s.perks[id] = lvl + 1;
}
export function inherit(s: State, bonusMult = 1) {
  if (!s.dead) stat(s, 'wills');
  s.points += Math.floor(legacyGain(s) * bonusMult);
  s.gen++;
  resetLife(s);
  hooks.log(t('log.born', { n: s.gen }));
}

// ---------- Random events ----------

export interface GameEvent { id: string; choices: { key: string; run: (s: State) => string }[] }

const EVENTS: { id: string; when?: (s: State) => boolean; choices: { key: string; run: (s: State) => string }[] }[] = [
  {
    id: 'bulk', choices: [
      { key: 'a', run: (s) => { const v = refIncome(s, computeMods(s)) * 8; earn(s, v); s.rep += 3; return t('evr.gain', { v: usd(v) }); } },
      { key: 'c', run: (s) => {
        if (Math.random() < 0.6) { const v = refIncome(s, computeMods(s)) * 20; earn(s, v); s.heat = Math.min(100, s.heat + 8); s.rep -= 4; return t('evr.gain', { v: usd(v) }); }
        s.rep -= 12; s.heat = Math.min(100, s.heat + 12); return t('evr.busted');
      } },
    ],
  },
  {
    id: 'inspector', when: (s) => s.heat > 20, choices: [
      { key: 'a', run: (s) => { const v = Math.max(0, s.money) * 0.05; s.money -= v; s.heat = Math.max(0, s.heat - 15); return t('evr.calm'); } },
      { key: 'c', run: (s) => {
        s.money -= Math.max(0, s.money) * 0.02;
        if (Math.random() < 0.7) { s.heat = Math.max(0, s.heat - 30); return t('evr.calm'); }
        s.heat = Math.min(100, s.heat + 30); return t('evr.worse');
      } },
    ],
  },
  {
    id: 'uncle', choices: [
      { key: 'a', run: (s) => { const v = refIncome(s, computeMods(s)) * 15; earn(s, v); return t('evr.gain', { v: usd(v) }); } },
      { key: 'c', run: (s) => { s.rep += 8; return t('evr.rep'); } },
    ],
  },
  {
    id: 'crash', when: (s) => TICKERS.some((tk) => s.stocks[tk.id].shares > 0), choices: [
      { key: 'a', run: (s) => {
        const before = s.money;
        for (const tk of TICKERS) s.stocks[tk.id].shares > 0 && sellStock(s, tk.id, 1);
        return t('evr.sold', { v: usd(s.money - before) });
      } },
      { key: 'c', run: (s) => {
        for (const tk of TICKERS) { const st = s.stocks[tk.id]; st.price = Math.max(0.01, st.price * (0.6 + Math.random() * 0.8)); st.hist.push(st.price); }
        return t('evr.held');
      } },
    ],
  },
  {
    id: 'charity', when: (s) => s.money > 1000, choices: [
      { key: 'a', run: (s) => { s.money *= 0.95; s.rep += 15; s.heat = Math.max(0, s.heat - 5); return t('evr.rep'); } },
      { key: 'c', run: (s) => { s.rep -= 2; return t('evr.nothing'); } },
    ],
  },
  {
    id: 'influencer', when: (s) => marketOpen(s) && s.money > 500, choices: [
      { key: 'a', run: (s) => { s.money *= 0.97; const st = s.stocks.PENZ; st.price *= 1.6; st.hist.push(st.price); s.pump += 2; s.heat = Math.min(100, s.heat + 8); return t('evr.pump'); } },
      { key: 'c', run: () => t('evr.nothing') },
    ],
  },
];

function pickEvent(s: State): GameEvent | null {
  const pool = EVENTS.filter((e) => !e.when || e.when(s));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

// ---------- Save / load ----------

export function save(s: State) {
  s.lastSave = Date.now();
  storage.set(SAVE_KEY, JSON.stringify(s));
}

export function exportSave(s: State): string {
  save(s);
  return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
}

export function parseSave(raw: string): State | null {
  try {
    const text = raw.trim().startsWith('{') ? raw : decodeURIComponent(escape(atob(raw.trim())));
    const p = JSON.parse(text);
    if (!p || typeof p !== 'object' || typeof p.money !== 'number') return null;
    const f = freshState();
    const s = { ...f, ...p } as State;
    // make sure content added in newer versions exists in old saves
    for (const j of JOBS) s.jobs[j.id] = { ...prog(), ...(p.jobs?.[j.id] ?? {}) };
    for (const k of SKILLS) s.skills[k.id] = { ...prog(), ...(p.skills?.[k.id] ?? {}) };
    for (const tk of TICKERS) s.stocks[tk.id] = { ...f.stocks[tk.id], ...(p.stocks?.[tk.id] ?? {}) };
    s.active = { ...f.active, ...(p.active ?? {}) };
    if (!JOB[s.job]) s.job = 'penSeller';
    if (!SKILL[s.skill]) s.skill = 'concentration';
    return s;
  } catch {
    return null;
  }
}

export function load(): State | null {
  const raw = storage.get(SAVE_KEY);
  return raw ? parseSave(raw) : null;
}

export function wipe() { storage.remove(SAVE_KEY); }
