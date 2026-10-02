import {
  JOBS, SKILLS, JOB_CATS, SKILL_CATS, SLOTS, PERKS, TICKERS, EFFECT_LABEL, MARKET_UNLOCK,
  baseItems, lastBase, getItem, type Req, type ItemDef, type SlotId, type SkillDef, type Lang,
} from './data';
import {
  type State, type Mods, type GameEvent, JOB, SKILL, START_AGE, WILL_AGE, BONUS_CAP, COOLDOWN,
  hooks, computeMods, M, jobIncome, jobXpGain, skillXpGain, maxXp, lifespanDays, expenses, income, speed, netWorth, wealthTier,
  happiness, marketOpen, turboOn, auditChancePerYear, lieChance, lieReward, honestReward, bribeCost, pumpCost, itemPrice,
  legacyGain, perkCost, perkValue, chooseJob, chooseSkill, buyItem, doLie, doHonest, doBribe, toggleTax, buyStock, sellStock, pump,
  buyPerk, inherit, save, exportSave, parseSave, wipe, freshState, stat,
} from './game';
import { ACHIEVEMENTS, ACH_CATS, ACH, type AchDef } from './achievements';
import { t, L, setLang } from './i18n';
import { fmt, usd, pct, mult, age, dur } from './fmt';
import { itemSvg, sceneSvg, PEN_LOGO } from './art';
import * as sdk from './sdk';

type Tab = 'career' | 'skills' | 'shop' | 'schemes' | 'market' | 'legacy' | 'achievements' | 'settings';
const TABS: { id: Tab; icon: string }[] = [
  { id: 'career', icon: '💼' }, { id: 'skills', icon: '🧠' }, { id: 'shop', icon: '🛍️' }, { id: 'schemes', icon: '🔥' },
  { id: 'market', icon: '📈' }, { id: 'legacy', icon: '👑' }, { id: 'achievements', icon: '🏆' }, { id: 'settings', icon: '⚙️' },
];

let s: State;
let m: Mods;
let tab: Tab = 'career';
let tabSig = '';
let sceneSig = '';
let journalSig = -1;
const journal: string[] = [];

type Bind = { el: HTMLElement; key: string };
let txtBinds: Bind[] = [];
let barBinds: Bind[] = [];
let disBinds: Bind[] = [];
let costBinds: { el: HTMLButtonElement; cost: number }[] = [];
let chartBinds: Bind[] = [];
const chartCache = new Map<string, string>();

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

// ---------- Modal / toast ----------

interface ModalBtn { label: string; cls?: string; run?: () => void | Promise<void> }
const modalQueue: { title: string; body: string; buttons: ModalBtn[] }[] = [];
let modalOpen = false;
export const isModalOpen = () => modalOpen;

function modal(title: string, body: string, buttons: ModalBtn[]) {
  modalQueue.push({ title, body, buttons });
  if (!modalOpen) nextModal();
}

function nextModal() {
  const el = $('modal');
  const md = modalQueue.shift();
  if (!md) {
    modalOpen = false;
    el.className = 'modal hidden';
    el.innerHTML = '';
    if (!s.paused) sdk.gameplayStart();
    return;
  }
  modalOpen = true;
  sdk.gameplayStop();
  el.className = 'modal';
  el.innerHTML = `<div class="mbox"><h2>${md.title}</h2><div class="mbody">${md.body}</div><div class="mbtns">${md.buttons
    .map((b, i) => `<button class="btn ${b.cls ?? ''}" data-mi="${i}">${b.label}</button>`).join('')}</div></div>`;
  el.querySelectorAll<HTMLButtonElement>('[data-mi]').forEach((btn) => {
    btn.onclick = async () => {
      el.querySelectorAll('button').forEach((b) => ((b as HTMLButtonElement).disabled = true));
      await md.buttons[Number(btn.dataset.mi)].run?.();
      nextModal();
    };
  });
}

function toast(msg: string, kind: 'good' | 'bad' | 'info' | 'ach' = 'info') {
  const box = $('toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 4) box.firstChild!.remove();
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 3700);
}

function log(msg: string) {
  journal.unshift(`<b>${Math.floor(s.days / 365)}</b> ${esc(msg)}`);
  if (journal.length > 30) journal.pop();
}

// ---------- Shell ----------

export function initUI(state: State) {
  s = state;
  setLang(s.lang);
  m = computeMods(s);
  $('app').innerHTML = `
  <header class="top">
    <div class="brand">${PEN_LOGO}<span>Sell Me This Pen</span></div>
    <div class="stats">
      <div class="chip"><span class="lbl" data-t="money"></span><b id="v-money"></b><small id="v-net"></small></div>
      <div class="chip wide"><span class="lbl" data-t="age"></span><b id="v-age"></b><div class="bar"><i id="b-age"></i></div></div>
      <div class="chip"><span class="lbl" data-t="happiness"></span><b id="v-happy"></b></div>
      <div class="chip"><span class="lbl" data-t="heat"></span><b id="v-heat"></b><div class="bar heat"><i id="b-heat"></i></div></div>
    </div>
    <div class="ctrl">
      <button class="btn icon" id="btn-pause" data-act="pause"></button>
      <button class="btn turbo" id="btn-turbo" data-act="turbo"></button>
      <button class="btn ad" id="btn-ad" data-act="adTurbo"></button>
    </div>
  </header>
  <main>
    <aside class="side">
      <div class="scene" id="scene"></div>
      <div class="card current">
        <div class="cur"><div class="cl"><span>💼 <b id="cj-name"></b></span><span id="cj-lvl"></span></div><div class="bar big"><i id="cj-bar"></i></div><small id="cj-sub"></small></div>
        <div class="cur"><div class="cl"><span>📖 <b id="cs-name"></b></span><span id="cs-lvl"></span></div><div class="bar big sk"><i id="cs-bar"></i></div><small id="cs-sub"></small></div>
        <div id="jail" class="jail hidden"><span id="jail-txt"></span><button class="btn ad" data-act="bail" id="jail-btn"></button></div>
        <div class="mini">
          <div><span data-t="income"></span><b id="st-inc" class="pos"></b></div>
          <div><span data-t="expenses"></span><b id="st-exp" class="neg"></b></div>
          <div><span data-t="netWorth"></span><b id="st-nw"></b></div>
          <div><span data-t="speed"></span><b id="st-spd"></b></div>
        </div>
      </div>
      <div class="card journal"><h4><span data-t="journal"></span> · <span id="gen"></span></h4><ul id="journal"></ul></div>
    </aside>
    <section class="content">
      <nav class="tabs" id="tabs"></nav>
      <div class="tab" id="tab"></div>
    </section>
  </main>
  <div id="modal" class="modal hidden"></div>
  <div id="toasts" class="toasts"></div>`;

  document.addEventListener('click', onClick);
  hooks.toast = toast;
  hooks.log = log;
  hooks.audit = onAudit;
  hooks.death = () => showInherit(true);
  hooks.event = onEvent;
  hooks.achievement = onAchievement;
  seenAch = s.ach.length;
  applyStatic();
  log(t('log.born', { n: s.gen }));
}

function applyStatic() {
  document.querySelectorAll<HTMLElement>('[data-t]').forEach((el) => (el.textContent = t(el.dataset.t!)));
  $('tabs').innerHTML = TABS.map((x) => `<button class="tabbtn" data-act="tab" data-id="${x.id}"><span>${x.icon}</span><em>${t('tab.' + x.id)}</em></button>`).join('');
  $('btn-ad').textContent = `📺 ${t('adTurbo')}`;
  $('btn-turbo').title = t('turboHint');
  $('jail-btn').textContent = t('audit.bail');
  tabSig = '';
  sceneSig = '';
}

// ---------- Click handling ----------

async function onClick(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!el || (el as HTMLButtonElement).disabled) return;
  const id = el.dataset.id ?? '';
  const f = Number(el.dataset.f ?? 1);
  switch (el.dataset.act) {
    case 'tab': tab = id as Tab; tabSig = ''; break;
    case 'job': chooseJob(s, id); break;
    case 'skill': chooseSkill(s, id); break;
    case 'buy': buyItem(s, id); break;
    case 'lie': doLie(s); break;
    case 'honest': doHonest(s); break;
    case 'bribe': doBribe(s); break;
    case 'tax': toggleTax(s); break;
    case 'goMarket': tab = 'market'; tabSig = ''; break;
    case 'sbuy': buyStock(s, id, f); break;
    case 'ssell': sellStock(s, id, f); break;
    case 'pump': pump(s); break;
    case 'perk': buyPerk(s, id); break;
    case 'will': showInherit(false); break;
    case 'lang': s.lang = id as Lang; setLang(s.lang); applyStatic(); break;
    case 'auto': if (id === 'promote') s.autoPromote = !s.autoPromote; else s.autoLearn = !s.autoLearn; break;
    case 'pause': s.paused = !s.paused; s.paused ? sdk.gameplayStop() : sdk.gameplayStart(); break;
    case 'turbo': s.useBonus = !s.useBonus; break;
    case 'adTurbo': {
      const ok = await sdk.rewardedAd();
      if (ok) { s.bonus = Math.min(BONUS_CAP, s.bonus + 1800); s.useBonus = true; toast(t('toast.turboAdd'), 'good'); }
      else toast(t('toast.adFail'), 'bad');
      break;
    }
    case 'bail': {
      const ok = await sdk.rewardedAd();
      if (ok) { s.jail = 0; toast(t('toast.free'), 'good'); } else toast(t('toast.adFail'), 'bad');
      break;
    }
    case 'export': {
      const str = exportSave(s);
      (document.getElementById('save-io') as HTMLTextAreaElement).value = str;
      navigator.clipboard?.writeText(str).then(() => toast(t('set.copied'), 'good'), () => {});
      break;
    }
    case 'import': {
      const raw = (document.getElementById('save-io') as HTMLTextAreaElement).value;
      const p = parseSave(raw);
      if (!p) { toast(t('set.badSave'), 'bad'); break; }
      Object.assign(s, p);
      setLang(s.lang);
      applyStatic();
      save(s);
      toast(t('set.imported'), 'good');
      break;
    }
    case 'reset':
      modal(t('set.reset'), t('set.resetQ'), [
        { label: t('cancel') },
        { label: t('set.reset'), cls: 'danger', run: () => { wipe(); Object.assign(s, freshState()); journal.length = 0; seenAch = 0; applyStatic(); save(s); } },
      ]);
      break;
  }
  frame(true);
}

// ---------- Game hooks ----------

function onAudit(info: { fine: number; jailDays: number }) {
  let body = t('audit.body', { fine: usd(info.fine) });
  const buttons: ModalBtn[] = [{ label: t('ok') }];
  if (info.jailDays) {
    body += t('audit.jail', { years: Math.round(info.jailDays / 365) });
    buttons.unshift({
      label: t('audit.bail'), cls: 'ad', run: async () => {
        if (await sdk.rewardedAd()) { s.jail = 0; toast(t('toast.free'), 'good'); } else toast(t('toast.adFail'), 'bad');
      },
    });
  }
  log(t('audit.title') + ' ' + usd(info.fine));
  modal(t('audit.title'), body, buttons);
}

let seenAch = 0;

function onAchievement(a: AchDef) {
  toast(`🏆 ${t('toast.ach', { n: `${a.icon} ${L(a.name)}` })}`, 'ach');
  log(`🏆 ${L(a.name)}`);
  sdk.happytime();
}

function onEvent(ev: GameEvent) {
  modal(t(`ev.${ev.id}.t`), t(`ev.${ev.id}.b`), ev.choices.map((c) => ({
    label: t(`ev.${ev.id}.${c.key}`),
    run: () => { const r = c.run(s); stat(s, 'events'); toast(r, 'info'); log(`${t(`ev.${ev.id}.t`)}: ${r}`); },
  })));
}

function showInherit(dead: boolean) {
  const pts = legacyGain(s);
  const finish = async (mul: number) => {
    inherit(s, mul);
    journal.length = 0;
    log(t('log.born', { n: s.gen }));
    sdk.happytime();
    save(s);
    tabSig = '';
    await sdk.midgameAd();
  };
  const body = dead
    ? t('death.body', { age: age(s.days), earned: usd(s.lifeEarned), pts })
    : t('will.body', { pts });
  const buttons: ModalBtn[] = [
    { label: t('death.ad'), cls: 'ad', run: async () => { const ok = await sdk.rewardedAd(); if (!ok) toast(t('toast.adFail'), 'bad'); await finish(ok ? 1.5 : 1); } },
    { label: t('death.next'), cls: 'gold', run: () => finish(1) },
  ];
  if (!dead) buttons.unshift({ label: t('cancel') });
  modal(dead ? `🕊️ ${t('death.title')}` : `📜 ${t('will.title')}`, body, buttons);
}

// ---------- Helpers ----------

function reqText(reqs: Req[]): string {
  return reqs.map((r) => {
    if ('job' in r) { const l = s.jobs[r.job].level; return l >= r.level ? '' : `${L(JOB[r.job].name)} ${l}/${r.level}`; }
    if ('skill' in r) { const l = s.skills[r.skill].level; return l >= r.level ? '' : `${L(SKILL[r.skill].name)} ${l}/${r.level}`; }
    if ('repMax' in r) return s.rep <= r.repMax ? '' : t('repReq', { v: r.repMax });
    return s.gen >= r.gen ? '' : t('genReq', { v: r.gen });
  }).filter(Boolean).join(' · ');
}

function effectText(type: string, value: number): string {
  if (type.startsWith('add:')) return `${L(EFFECT_LABEL[type.slice(4)])} +${pct(value)}`;
  return `${L(EFFECT_LABEL[type] ?? { en: type, uk: type })} ${mult(value)}`;
}

function skillEffect(d: SkillDef, lvl: number): string {
  const label = L(EFFECT_LABEL[d.effect]);
  if (d.mode === 'mul') return `${label} ${mult(1 + lvl * d.per)}`;
  if (d.mode === 'div') return `${label} ${mult(1 / (1 + lvl * d.per))}`;
  return `${label} +${pct(lvl * d.per, 1)}`;
}

function repName(rep: number): string {
  if (rep >= 100) return t('rep.saint');
  if (rep >= 25) return t('rep.honest');
  if (rep > -25) return t('rep.neutral');
  if (rep > -100) return t('rep.shady');
  if (rep > -300) return t('rep.crook');
  return t('rep.villain');
}

const cdText = (k: keyof typeof COOLDOWN, label: string) => {
  const c = s.cd[k] ?? 0;
  return c > 0 ? `⏳ ${Math.ceil(c)} d` : label;
};

// ---------- Tabs ----------

function signature(): string {
  const base = `${tab}|${s.lang}|${s.gen}`;
  switch (tab) {
    case 'career': return `${base}|${s.unlocked.length}|${s.job}`;
    case 'skills': return `${base}|${s.unlocked.length}|${s.skill}`;
    case 'shop': return `${base}|${s.owned.join()}|${Object.values(s.active).join()}|${s.skills.negotiation.level}`;
    case 'schemes': return `${base}|${s.taxEvasion}|${s.jail > 0}`;
    case 'market': return `${base}|${marketOpen(s)}`;
    case 'legacy': return `${base}|${JSON.stringify(s.perks)}`;
    case 'achievements': return `${base}|${s.ach.length}`;
    case 'settings': return `${base}|${s.autoPromote}|${s.autoLearn}|${JSON.stringify(s.perks)}`;
  }
}

function renderTab() {
  const el = $('tab');
  const html = { career: renderCareer, skills: renderSkills, shop: renderShop, schemes: renderSchemes, market: renderMarket, legacy: renderLegacy, achievements: renderAchievements, settings: renderSettings }[tab]();
  const scroll = el.scrollTop;
  el.innerHTML = html;
  el.scrollTop = scroll;
  txtBinds = [...el.querySelectorAll<HTMLElement>('[data-k]')].map((e) => ({ el: e, key: e.dataset.k! }));
  barBinds = [...el.querySelectorAll<HTMLElement>('[data-b]')].map((e) => ({ el: e, key: e.dataset.b! }));
  disBinds = [...el.querySelectorAll<HTMLElement>('[data-d]')].map((e) => ({ el: e, key: e.dataset.d! }));
  costBinds = [...el.querySelectorAll<HTMLButtonElement>('[data-cost]')].map((e) => ({ el: e, cost: Number(e.dataset.cost) }));
  chartBinds = [...el.querySelectorAll<HTMLElement>('[data-c]')].map((e) => ({ el: e, key: e.dataset.c! }));
  chartCache.clear();
  document.querySelectorAll('.tabbtn').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.id === tab));
  if (tab === 'achievements') seenAch = s.ach.length;
}

function renderCareer(): string {
  let h = '';
  for (const c of JOB_CATS) {
    const list = JOBS.filter((j) => j.cat === c.id);
    const un = list.filter((j) => s.unlocked.includes(j.id));
    const next = list.find((j) => !s.unlocked.includes(j.id));
    if (!un.length) {
      if (next) h += `<div class="cat lockedcat"><h3>${c.icon} ${L(c.name)}</h3><div class="lockrow">🔒 ${L(next.name)} — <span data-k="req:${next.id}"></span></div></div>`;
      continue;
    }
    h += `<div class="cat"><h3>${c.icon} ${L(c.name)}</h3>
      <div class="thead grid6"><span>${t('col.job')}</span><span>${t('col.level')}</span><span>${t('col.income')}</span><span class="opt">${t('col.xp')}</span><span class="opt">${t('col.left')}</span><span class="opt">${t('col.max')}</span></div>`;
    for (const j of un) {
      h += `<div class="row grid6 ${s.job === j.id ? 'sel' : ''}" data-act="job" data-id="${j.id}"><i class="fill" data-b="jb:${j.id}"></i>
        <span class="nm">${L(j.name)}</span><span data-k="jl:${j.id}"></span><span class="pos" data-k="ji:${j.id}"></span>
        <span class="opt" data-k="jx:${j.id}"></span><span class="opt" data-k="jr:${j.id}"></span><span class="opt dim">${s.jobs[j.id].maxLevel || '—'}</span></div>`;
    }
    if (next) h += `<div class="lockrow">🔒 ${L(next.name)} — <span data-k="req:${next.id}"></span></div>`;
    h += '</div>';
  }
  return h;
}

function renderSkills(): string {
  let h = '';
  for (const c of SKILL_CATS) {
    const list = SKILLS.filter((k) => k.cat === c.id);
    const un = list.filter((k) => s.unlocked.includes(k.id));
    const next = list.find((k) => !s.unlocked.includes(k.id));
    if (!un.length) {
      if (next) h += `<div class="cat lockedcat"><h3>${c.icon} ${L(c.name)}</h3><div class="lockrow">🔒 ${L(next.name)} — <span data-k="req:${next.id}"></span></div></div>`;
      continue;
    }
    h += `<div class="cat"><h3>${c.icon} ${L(c.name)}</h3>
      <div class="thead grid6"><span>${t('col.skill')}</span><span>${t('col.level')}</span><span>${t('col.effect')}</span><span class="opt">${t('col.xp')}</span><span class="opt">${t('col.left')}</span><span class="opt">${t('col.max')}</span></div>`;
    for (const k of un) {
      h += `<div class="row grid6 sk ${s.skill === k.id ? 'sel' : ''}" data-act="skill" data-id="${k.id}"><i class="fill" data-b="sb:${k.id}"></i>
        <span class="nm">${L(k.name)}</span><span data-k="sl:${k.id}"></span><span class="eff" data-k="se:${k.id}"></span>
        <span class="opt" data-k="sx:${k.id}"></span><span class="opt" data-k="sr:${k.id}"></span><span class="opt dim">${s.skills[k.id].maxLevel || '—'}</span></div>`;
    }
    if (next) h += `<div class="lockrow">🔒 ${L(next.name)} — <span data-k="req:${next.id}"></span></div>`;
    h += '</div>';
  }
  return h;
}

function slotItems(slot: SlotId): ItemDef[] {
  const list = [...baseItems(slot)];
  const last = lastBase(slot);
  if (s.owned.includes(last.id)) {
    let n = 1;
    while (s.owned.includes(`${last.id}+${n}`)) n++;
    for (let i = 1; i <= n; i++) list.push(getItem(`${last.id}+${i}`));
  }
  return list;
}

function renderShop(): string {
  let h = `<p class="hint">${t('shopHint')}</p>`;
  for (const slot of SLOTS) {
    const all = slotItems(slot.id);
    let unownedShown = 0, hidden = 0;
    let cards = '';
    for (const it of all) {
      const owned = s.owned.includes(it.id);
      if (!owned) { if (unownedShown >= 2) { hidden++; continue; } unownedShown++; }
      const active = s.active[slot.id] === it.id;
      const price = itemPrice(m, it);
      let btn: string;
      if (active) btn = slot.def === null ? `<button class="btn ghost" data-act="buy" data-id="${it.id}">${t('unequip')}</button>` : `<button class="btn ghost" disabled>✓ ${t('equipped')}</button>`;
      else if (owned) btn = `<button class="btn" data-act="buy" data-id="${it.id}">${t('equip')}</button>`;
      else btn = `<button class="btn buy" data-act="buy" data-id="${it.id}" data-cost="${price}">${t('buy')} ${usd(price)}</button>`;
      cards += `<div class="item ${active ? 'active' : ''} ${owned ? 'owned' : ''}">
        <div class="iart">${itemSvg(it.art, it.mk)}</div>
        <div class="iname">${L(it.name)}</div>
        <div class="ieff">${it.effects.map((e) => effectText(e.type, e.value)).join('<br>')}</div>
        <div class="iup">${it.upkeep ? `${usd(it.upkeep)}${t('perDay')} ${t('upkeep')}` : t('free')}</div>${btn}</div>`;
    }
    if (hidden) cards += `<div class="item more"><div class="iart q">?</div><div class="iname">${t('moreItems', { n: hidden })}</div></div>`;
    h += `<div class="cat"><h3>${slot.icon} ${L(slot.name)}</h3><div class="items">${cards}</div></div>`;
  }
  return h;
}

function renderSchemes(): string {
  const card = (icon: string, title: string, desc: string, rows: string, fx: string, btn: string, cls = '') =>
    `<div class="scheme ${cls}"><div class="sic">${icon}</div><h4>${title}</h4><p>${desc}</p>${rows}<small class="fx">${fx}</small>${btn}</div>`;
  const kv = (label: string, key: string) => `<div class="kv"><span>${label}</span><b data-k="${key}"></b></div>`;
  return `<div class="card heatcard">
      <div class="kv big"><span>🔥 ${t('sch.heatTitle')}</span><b data-k="heat"></b></div>
      <div class="bar big heat"><i data-b="heatBar"></i></div>
      <div class="kv"><span>${t('sch.rep')}</span><b data-k="rep"></b></div>
      <div class="kv"><span>${t('sch.audit')}</span><b data-k="audit"></b></div>
      ${s.jail > 0 ? `<div class="warn" data-k="jailTxt"></div>` : ''}
    </div>
    <div class="schemes">
      ${card('🤥', t('sch.lie'), t('sch.lie.d'), kv(t('chance'), 'lieChance') + kv(t('reward'), 'lieReward'), t('sch.lie.fx'), `<button class="btn danger" data-act="lie" data-d="lie" data-k="lieBtn"></button>`, 'risky')}
      ${card('🤝', t('sch.honest'), t('sch.honest.d'), kv(t('reward'), 'honestReward'), t('sch.honest.fx'), `<button class="btn good" data-act="honest" data-d="honest" data-k="honestBtn"></button>`)}
      ${card('💼', t('sch.bribe'), t('sch.bribe.d'), kv(t('cost'), 'bribeCost'), t('sch.bribe.fx'), `<button class="btn danger" data-act="bribe" data-d="bribe" data-k="bribeBtn"></button>`, 'risky')}
      ${card('🧾', t('sch.tax'), t('sch.tax.d'), kv(t('saves'), 'taxSave'), t('sch.tax.fx'), `<button class="btn ${s.taxEvasion ? 'danger on' : ''}" data-act="tax">${s.taxEvasion ? t('on') : t('off')}</button>`, 'risky')}
      ${card('📈', t('sch.pump'), t('sch.pump.d'), '', '', `<button class="btn" data-act="goMarket">${t('goMarket')}</button>`, 'risky')}
    </div>`;
}

function renderMarket(): string {
  if (!marketOpen(s)) {
    return `<div class="card center"><div class="bigicon">🏦</div><p>${t('marketLocked', { v: usd(MARKET_UNLOCK) })}</p><div class="bar big"><i data-b="mkUnlock"></i></div></div>`;
  }
  return `<div class="stocks">${TICKERS.map((tk) => `
    <div class="card stock ${tk.penny ? 'penny' : ''}">
      <div class="shead"><b>$${tk.id}</b><span class="dim">${L(tk.name)}</span><span class="price" data-k="mp:${tk.id}"></span><span data-k="mc:${tk.id}"></span></div>
      <div class="chart" data-c="${tk.id}"></div>
      <div class="kv"><span>${t('mk.shares')}</span><b data-k="ms:${tk.id}"></b></div>
      <div class="kv"><span>${t('mk.value')}</span><b data-k="mv:${tk.id}"></b></div>
      <div class="btns">
        ${[0.1, 0.5, 1].map((f) => `<button class="btn sm" data-act="sbuy" data-id="${tk.id}" data-f="${f}">${t('mk.buy', { p: pct(f) })}</button>`).join('')}
        <button class="btn sm" data-act="ssell" data-id="${tk.id}" data-f="0.5" data-d="sell:${tk.id}">${t('mk.sellHalf')}</button>
        <button class="btn sm" data-act="ssell" data-id="${tk.id}" data-f="1" data-d="sell:${tk.id}">${t('mk.sellAll')}</button>
      </div>
      ${tk.penny ? `<div class="pumpbox"><div class="kv"><span>${t('mk.pumpLevel')}</span><b data-k="pump"></b></div>
        <small class="dim" data-k="pumpHint"></small><button class="btn danger" data-act="pump">${t('mk.pump')}</button></div>` : ''}
    </div>`).join('')}</div>`;
}

function renderLegacy(): string {
  const perks = PERKS.map((p) => {
    const lvl = s.perks[p.id] ?? 0;
    const maxed = p.max !== undefined && lvl >= p.max;
    const cur = t('lg.level', { n: lvl });
    const desc = L(p.desc).replace(/\{(\w)\}/g, (_, k) => perkValue(p.id, maxed ? lvl : lvl + 1)[k] ?? '');
    return `<div class="perk"><div class="pic">${p.icon}</div><div class="pinfo"><b>${L(p.name)}</b><small>${desc}</small><span class="dim">${cur}</span></div>
      ${maxed ? `<button class="btn" disabled>${t('lg.max')}</button>` : `<button class="btn gold" data-act="perk" data-id="${p.id}" data-d="perk:${p.id}">⭐ ${fmt(perkCost(p.id, lvl))}</button>`}</div>`;
  }).join('');
  return `<div class="card legacy">
      <h3>👑 ${t('lg.title')} — ${t('gen', { n: s.gen })}</h3>
      <div class="kv big"><span>⭐ ${t('lg.points')}</span><b data-k="lgPoints"></b></div>
      <div class="kv"><span>${t('lg.gain')}</span><b data-k="lgGain"></b></div>
      <p class="dim">${t('lg.info')}</p>
      <button class="btn gold" data-act="will" data-d="will">📜 ${t('lg.will')}</button> <small class="dim">${t('lg.willAge', { a: WILL_AGE })}</small>
    </div>
    <h3 class="sect">${t('lg.perks')}</h3><div class="perks">${perks}</div>`;
}

function bonusSummary(): string {
  const total: Record<string, number> = {};
  for (const id of s.ach) {
    const b = ACH[id]?.bonus;
    if (!b) continue;
    const add = b.type.startsWith('add:');
    total[b.type] = add ? (total[b.type] ?? 0) + b.value : (total[b.type] ?? 1) * b.value;
  }
  const keys = Object.keys(total);
  return keys.length ? keys.map((k) => `<span class="pill">${effectText(k, total[k])}</span>`).join('') : '<span class="dim">—</span>';
}

function renderAchievements(): string {
  const got = new Set(s.ach);
  let h = `<div class="card achhead">
      <div class="kv big"><span>🏆 ${t('tab.achievements')}</span><b>${got.size} / ${ACHIEVEMENTS.length}</b></div>
      <div class="bar big"><i style="width:${(got.size / ACHIEVEMENTS.length) * 100}%"></i></div>
      <p class="dim">${t('ach.info')}</p>
      <div class="pills"><span class="dim">${t('ach.bonus')}:</span>${bonusSummary()}</div>
    </div>`;
  for (const c of ACH_CATS) {
    const done = c.ids.filter((id) => got.has(id)).length;
    h += `<div class="cat"><h3>${L(c.name)} <span class="dim">${done}/${c.ids.length}</span></h3><div class="achs">`;
    for (const id of c.ids) {
      const a = ACH[id];
      const on = got.has(id);
      const hidden = a.secret && !on;
      h += `<div class="ach ${on ? 'on' : ''}"><div class="aic">${hidden ? '❔' : a.icon}</div><div class="ainfo">
        <b>${hidden ? '???' : L(a.name)}</b><small>${hidden ? t('ach.secret') : L(a.desc)}</small>
        <span class="abonus">${effectText(a.bonus.type, a.bonus.value)}</span></div></div>`;
    }
    h += '</div></div>';
  }
  return h;
}

function renderSettings(): string {
  const toggle = (id: string, label: string, on: boolean, perk: string) =>
    (s.perks[perk] ?? 0)
      ? `<button class="btn ${on ? 'good' : ''}" data-act="auto" data-id="${id}">${label}: ${on ? t('on') : t('off')}</button>`
      : `<button class="btn" disabled>🔒 ${label} — ${t('set.needPerk')}</button>`;
  return `<div class="card settings">
      <h3>🌐 ${t('set.lang')}</h3>
      <div class="btns"><button class="btn ${s.lang === 'en' ? 'gold' : ''}" data-act="lang" data-id="en">English</button><button class="btn ${s.lang === 'uk' ? 'gold' : ''}" data-act="lang" data-id="uk">Українська</button></div>
      <h3>🤖 ${t('set.auto')}</h3>
      <div class="btns">${toggle('promote', t('set.autoPromote'), s.autoPromote, 'autoPromote')}${toggle('learn', t('set.autoLearn'), s.autoLearn, 'autoLearn')}</div>
      <h3>💾 ${t('set.save')}</h3>
      <textarea id="save-io" rows="3" spellcheck="false"></textarea>
      <div class="btns"><button class="btn" data-act="export">${t('set.export')}</button><button class="btn" data-act="import">${t('set.import')}</button><button class="btn danger" data-act="reset">${t('set.reset')}</button></div>
      <p class="dim">${t('set.credits')} · v0.1 · ${sdk.environment()}</p>
    </div>`;
}

// ---------- Per-frame updates ----------

function txtValue(key: string): string {
  const [k, id] = key.split(':');
  switch (k) {
    case 'jl': return String(s.jobs[id].level);
    case 'ji': return usd(jobIncome(s, m, JOB[id]));
    case 'jx': return fmt(jobXpGain(s, m, JOB[id]));
    case 'jr': { const p = s.jobs[id]; return fmt(maxXp(JOB[id].maxXp, p.level) - p.xp); }
    case 'sl': return String(s.skills[id].level);
    case 'se': return skillEffect(SKILL[id], s.skills[id].level);
    case 'sx': return fmt(skillXpGain(s, m, SKILL[id]));
    case 'sr': { const p = s.skills[id]; return fmt(maxXp(SKILL[id].maxXp, p.level) - p.xp); }
    case 'req': return reqText((JOB[id] ?? SKILL[id]).req);
    case 'heat': return `${Math.round(s.heat)} / 100`;
    case 'rep': return `${Math.round(s.rep)} · ${repName(s.rep)}`;
    case 'audit': return `${pct(auditChancePerYear(s), 1)}${t('sch.perYear')}`;
    case 'jailTxt': return t('sch.jail', { t: age(s.jail) });
    case 'lieChance': return pct(lieChance(s, m));
    case 'lieReward': return usd(lieReward(s, m));
    case 'lieBtn': return cdText('lie', `🤥 ${t('go')}`);
    case 'honestReward': return usd(honestReward(s, m));
    case 'honestBtn': return cdText('honest', `🤝 ${t('go')}`);
    case 'bribeCost': return usd(bribeCost(s, m));
    case 'bribeBtn': return cdText('bribe', `💼 ${t('go')}`);
    case 'taxSave': return `${usd(expenses(s, m) * (s.taxEvasion ? 1 : 0.5))}${t('perDay')}`;
    case 'mp': return usd(s.stocks[id].price);
    case 'mc': {
      const h = s.stocks[id].hist; const ref = h[Math.max(0, h.length - 31)]; const c = h[h.length - 1] / ref - 1;
      return `${c >= 0 ? '▲' : '▼'} ${pct(Math.abs(c), 1)}`;
    }
    case 'ms': return fmt(s.stocks[id].shares);
    case 'mv': return usd(s.stocks[id].shares * s.stocks[id].price);
    case 'pump': return s.pump > 0 ? '🚀'.repeat(Math.min(10, Math.ceil(s.pump))) + ` ${s.pump.toFixed(1)}` : '—';
    case 'pumpHint': return t('mk.pumpHint', { c: usd(pumpCost(s)) });
    case 'lgPoints': return fmt(s.points);
    case 'lgGain': return `⭐ ${fmt(legacyGain(s))}`;
  }
  return '';
}

function barValue(key: string): number {
  const [k, id] = key.split(':');
  if (k === 'jb') { const p = s.jobs[id]; return p.xp / maxXp(JOB[id].maxXp, p.level); }
  if (k === 'sb') { const p = s.skills[id]; return p.xp / maxXp(SKILL[id].maxXp, p.level); }
  if (k === 'heatBar') return s.heat / 100;
  if (k === 'mkUnlock') return s.lifeEarned / MARKET_UNLOCK;
  return 0;
}

function disabled(key: string): boolean {
  const [k, id] = key.split(':');
  switch (k) {
    case 'lie': return (s.cd.lie ?? 0) > 0 || s.jail > 0;
    case 'honest': return (s.cd.honest ?? 0) > 0 || s.jail > 0;
    case 'bribe': return (s.cd.bribe ?? 0) > 0 || s.money < bribeCost(s, m);
    case 'sell': return s.stocks[id].shares <= 0;
    case 'will': return s.days < WILL_AGE * 365;
    case 'perk': return s.points < perkCost(id, s.perks[id] ?? 0);
  }
  return false;
}

function chartSvg(id: string): string {
  const h = s.stocks[id].hist;
  const min = Math.min(...h), max = Math.max(...h);
  const span = max - min || 1;
  const pts = h.map((v, i) => `${((i / Math.max(1, h.length - 1)) * 300).toFixed(1)},${(66 - ((v - min) / span) * 60).toFixed(1)}`).join(' ');
  const up = h[h.length - 1] >= h[0];
  const col = up ? 'var(--pos)' : 'var(--neg)';
  return `<svg viewBox="0 0 300 70" preserveAspectRatio="none"><polyline points="0,70 ${pts} 300,70" fill="${col}" opacity=".12"/><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

const setText = (el: HTMLElement, v: string) => { if (el.textContent !== v) el.textContent = v; };
const setW = (el: HTMLElement, f: number) => { el.style.width = `${Math.max(0, Math.min(1, f)) * 100}%`; };

function updateTop() {
  const inc = income(s, m), exp = expenses(s, m), net = inc - exp;
  setText($('v-money'), usd(s.money));
  const vn = $('v-net');
  setText(vn, `${net >= 0 ? '+' : ''}${usd(net)}${t('perDay')}`);
  vn.className = net >= 0 ? 'pos' : 'neg';
  const life = lifespanDays(m);
  setText($('v-age'), `${age(s.days)} / ${Math.floor(life / 365)}`);
  setW($('b-age'), (s.days - START_AGE * 365) / (life - START_AGE * 365));
  setText($('v-happy'), mult(happiness(m)));
  setText($('v-heat'), String(Math.round(s.heat)));
  setW($('b-heat'), s.heat / 100);
  setText($('btn-pause'), s.paused ? '▶' : '⏸');
  const tb = $('btn-turbo') as HTMLButtonElement;
  setText(tb, `⏩ ${t('turbo')} ${dur(s.bonus)}`);
  tb.classList.toggle('on', turboOn(s));
  tb.disabled = s.bonus <= 0;

  const jd = JOB[s.job], jp = s.jobs[s.job];
  setText($('cj-name'), L(jd.name));
  setText($('cj-lvl'), `Lv ${jp.level}`);
  setW($('cj-bar'), jp.xp / maxXp(jd.maxXp, jp.level));
  setText($('cj-sub'), `${usd(jobIncome(s, m, jd))}${t('perDay')} · ${fmt(jobXpGain(s, m, jd))} XP${t('perDay')}`);
  const sd = SKILL[s.skill], sp = s.skills[s.skill];
  setText($('cs-name'), L(sd.name));
  setText($('cs-lvl'), `Lv ${sp.level}`);
  setW($('cs-bar'), sp.xp / maxXp(sd.maxXp, sp.level));
  setText($('cs-sub'), skillEffect(sd, sp.level));
  setText($('st-inc'), usd(inc));
  setText($('st-exp'), usd(exp));
  setText($('st-nw'), usd(netWorth(s)));
  setText($('st-spd'), `×${(speed(s, m) / 6).toFixed(2)}`);
  setText($('gen'), t('gen', { n: s.gen }));
  const jail = $('jail');
  jail.classList.toggle('hidden', s.jail <= 0);
  if (s.jail > 0) setText($('jail-txt'), `⛓️ ${t('sch.jail', { t: age(s.jail) })}`);
}

function updateScene() {
  const pick = (slot: SlotId) => { const id = s.active[slot]; if (!id) return null; const it = getItem(id); return { art: it.art, mk: it.mk }; };
  const opts = {
    tier: wealthTier(s), age: s.days / 365, jailed: s.jail > 0, sweating: s.heat > 60,
    housing: pick('housing')!, transport: pick('transport'), water: pick('water'), sky: pick('sky'), heat: s.heat,
  };
  const sig = JSON.stringify({ ...opts, age: opts.age < 40 ? 0 : opts.age < 50 ? 1 : opts.age < 55 ? 2 : opts.age < 62 ? 3 : 4, heat: s.heat > 70 });
  if (sig === sceneSig) return;
  sceneSig = sig;
  $('scene').innerHTML = sceneSvg(opts);
}

function updateJournal() {
  if (journalSig === journal.length + (journal[0]?.length ?? 0)) return;
  journalSig = journal.length + (journal[0]?.length ?? 0);
  $('journal').innerHTML = journal.slice(0, 12).map((x) => `<li>${x}</li>`).join('');
}

let frameNo = 0;
export function frame(force = false) {
  frameNo++;
  m = computeMods(s);
  const sig = signature();
  if (sig !== tabSig) { tabSig = sig; renderTab(); }
  if (!force && frameNo % 2) return; // heavy text updates at ~10 Hz
  if (tab === 'achievements') seenAch = s.ach.length;
  document.querySelector('.tabbtn[data-id=achievements]')?.classList.toggle('dot', s.ach.length > seenAch);
  updateTop();
  updateScene();
  updateJournal();
  for (const b of txtBinds) setText(b.el, txtValue(b.key));
  for (const b of barBinds) setW(b.el, barValue(b.key));
  for (const b of disBinds) (b.el as HTMLButtonElement).disabled = disabled(b.key);
  for (const b of costBinds) b.el.disabled = s.money < b.cost;
  for (const b of chartBinds) {
    const h = s.stocks[b.key].hist;
    const ck = `${h.length}:${h[h.length - 1]}`;
    if (chartCache.get(b.key) !== ck) { chartCache.set(b.key, ck); b.el.innerHTML = chartSvg(b.key); }
  }
}

export function offlineToast(sec: number) {
  toast(t('toast.offline', { t: dur(sec) }), 'good');
}
