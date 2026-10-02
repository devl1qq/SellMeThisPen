// All game content lives here. Systems only read these tables, so balance can be tuned without touching logic.

export type Lang = 'en' | 'uk';
export type T = { en: string; uk: string };

export type Req =
  | { job: string; level: number }
  | { skill: string; level: number }
  | { repMax: number }
  | { gen: number };

const J = (job: string, level: number): Req => ({ job, level });
const S = (skill: string, level: number): Req => ({ skill, level });

// ---------- Careers ----------

export type JobCat = 'street' | 'office' | 'finance' | 'shadow' | 'entre';

export interface JobDef {
  id: string;
  cat: JobCat;
  name: T;
  income: number; // $ per day at level 0
  maxXp: number; // base XP for level 0 → 1
  req: Req[];
}

export const JOB_CATS: { id: JobCat; name: T; icon: string; income: string }[] = [
  { id: 'street', name: { en: 'Street Hustle', uk: 'Вулична торгівля' }, icon: '🛒', income: 'incomeSales' },
  { id: 'office', name: { en: 'Corporate Sales', uk: 'Корпоративні продажі' }, icon: '🏢', income: 'incomeSales' },
  { id: 'finance', name: { en: 'Finance', uk: 'Фінанси' }, icon: '📈', income: 'incomeFinance' },
  { id: 'shadow', name: { en: 'Shadow Business', uk: 'Тіньовий бізнес' }, icon: '🕶️', income: 'incomeShadow' },
  { id: 'entre', name: { en: 'Entrepreneurship', uk: 'Підприємництво' }, icon: '🚀', income: 'incomeEntre' },
];

const job = (id: string, cat: JobCat, en: string, uk: string, income: number, maxXp: number, req: Req[] = []): JobDef => ({
  id, cat, name: { en, uk }, income, maxXp, req,
});

export const JOBS: JobDef[] = [
  job('penSeller', 'street', 'Pen Seller', 'Продавець ручок', 5, 50),
  job('marketTrader', 'street', 'Market Trader', 'Торговець на ринку', 9, 100, [J('penSeller', 10)]),
  job('kioskOwner', 'street', 'Kiosk Owner', 'Власник кіоску', 15, 200, [J('marketTrader', 10)]),
  job('kioskChain', 'street', 'Kiosk Chain Owner', 'Власник мережі кіосків', 40, 400, [J('kioskOwner', 10), S('charisma', 10)]),
  job('streetBoss', 'street', 'Street Retail Boss', 'Король вуличної торгівлі', 80, 800, [J('kioskChain', 10), S('negotiation', 10)]),
  job('retailMagnate', 'street', 'Retail Magnate', 'Магнат роздрібу', 150, 1600, [J('streetBoss', 10), S('negotiation', 30)]),

  job('callCenter', 'office', 'Call Center Agent', 'Оператор кол-центру', 8, 100, [S('charisma', 5)]),
  job('salesManager', 'office', 'Sales Manager', 'Менеджер з продажу', 50, 1000, [J('callCenter', 10), S('charisma', 20)]),
  job('seniorManager', 'office', 'Senior Sales Manager', 'Старший менеджер', 120, 1e4, [J('salesManager', 10), S('negotiation', 30)]),
  job('headOfSales', 'office', 'Head of Sales', 'Директор з продажу', 300, 1e5, [J('seniorManager', 10), S('leadership', 20)]),
  job('vpSales', 'office', 'VP of Sales', 'Віцепрезидент з продажу', 1000, 1e6, [J('headOfSales', 10), S('leadership', 60)]),
  job('ceo', 'office', 'CEO', 'Генеральний директор', 4000, 7.5e6, [J('vpSales', 10), S('leadership', 120), S('negotiation', 120)]),

  job('internBroker', 'finance', 'Intern Broker', 'Стажер-брокер', 100, 1e4, [J('callCenter', 10), S('math', 20)]),
  job('broker', 'finance', 'Stockbroker', 'Брокер', 300, 5e4, [J('internBroker', 10), S('math', 40)]),
  job('analyst', 'finance', 'Analyst', 'Аналітик', 900, 2e5, [J('broker', 10), S('marketAnalysis', 40)]),
  job('portfolioMgr', 'finance', 'Portfolio Manager', 'Портфельний менеджер', 3000, 1e6, [J('analyst', 10), S('marketAnalysis', 100)]),
  job('hedgeFund', 'finance', 'Hedge Fund Manager', 'Керівник хедж-фонду', 12000, 1e7, [J('portfolioMgr', 10), S('math', 200)]),
  job('investBanker', 'finance', 'Investment Banker', 'Інвестбанкір', 50000, 1e8, [J('hedgeFund', 10), S('negotiation', 300)]),

  job('reseller', 'shadow', 'Reseller', 'Перекупник', 60, 2000, [{ repMax: -25 }]),
  job('schemer', 'shadow', 'Schemer', 'Схематоз', 250, 2e4, [J('reseller', 10), S('storytelling', 30)]),
  job('consultant', 'shadow', '"Consultant"', '«Консультант»', 1000, 2e5, [J('schemer', 10), S('manipulation', 40)]),
  job('offshoreMagnate', 'shadow', 'Offshore Magnate', 'Офшорний магнат', 5000, 2e6, [J('consultant', 10), S('offshore', 50)]),
  job('oligarch', 'shadow', 'Oligarch', 'Олігарх', 30000, 2e7, [J('offshoreMagnate', 10), S('connections', 100), { repMax: -300 }]),

  job('startupFounder', 'entre', 'Startup Founder', 'Засновник стартапу', 400, 2e4, [{ gen: 2 }, S('leadership', 20)]),
  job('serialEntre', 'entre', 'Serial Entrepreneur', 'Серійний підприємець', 2500, 3e5, [J('startupFounder', 10), S('negotiation', 80)]),
  job('ventureInvestor', 'entre', 'Venture Investor', 'Венчурний інвестор', 15000, 4e6, [J('serialEntre', 10), S('math', 150)]),
  job('conglomerate', 'entre', 'Conglomerate Owner', 'Власник конгломерату', 1e5, 5e7, [J('ventureInvestor', 10), S('leadership', 250)]),
  job('megacorp', 'entre', 'Megacorp Overlord', 'Володар мегакорпорації', 1e6, 1e9, [J('conglomerate', 10), S('leadership', 500)]),
];

// ---------- Skills ----------

export type SkillCat = 'basics' | 'sales' | 'finance' | 'dark';
export type EffMode = 'mul' | 'div' | 'add';

export interface SkillDef {
  id: string;
  cat: SkillCat;
  name: T;
  maxXp: number;
  effect: string;
  per: number;
  mode: EffMode;
  req: Req[];
}

export const SKILL_CATS: { id: SkillCat; name: T; icon: string }[] = [
  { id: 'basics', name: { en: 'Self-Improvement', uk: 'Саморозвиток' }, icon: '🧠' },
  { id: 'sales', name: { en: 'Sales', uk: 'Продажі' }, icon: '🤝' },
  { id: 'finance', name: { en: 'Finance', uk: 'Фінанси' }, icon: '🧮' },
  { id: 'dark', name: { en: 'Dark Arts', uk: 'Темні мистецтва' }, icon: '🦹' },
];

const skill = (id: string, cat: SkillCat, en: string, uk: string, maxXp: number, effect: string, per: number, mode: EffMode, req: Req[] = []): SkillDef => ({
  id, cat, name: { en, uk }, maxXp, effect, per, mode, req,
});

export const SKILLS: SkillDef[] = [
  skill('concentration', 'basics', 'Deep Work', 'Глибока робота', 100, 'skillXp', 0.01, 'mul'),
  skill('productivity', 'basics', 'Hustle', 'Наполегливість', 100, 'jobXp', 0.01, 'mul', [S('concentration', 5)]),
  skill('frugality', 'basics', 'Frugality', 'Ощадливість', 150, 'expenses', 0.01, 'div', [S('concentration', 10)]),
  skill('meditation', 'basics', 'Work-Life Balance', 'Баланс роботи й життя', 200, 'happiness', 0.01, 'mul', [S('concentration', 15), S('productivity', 15)]),
  skill('fitness', 'basics', 'Fitness', 'Фітнес', 500, 'lifespan', 0.002, 'mul', [S('productivity', 25)]),

  skill('charisma', 'sales', 'Charisma', 'Харизма', 100, 'incomeSales', 0.01, 'mul'),
  skill('negotiation', 'sales', 'Negotiation', 'Переговори', 200, 'shopPrice', 0.01, 'div', [S('charisma', 10)]),
  skill('storytelling', 'sales', 'Storytelling', 'Сторітелінг', 300, 'lieChance', 0.002, 'add', [S('charisma', 20)]),
  skill('leadership', 'sales', 'Leadership', 'Лідерство', 800, 'incomeAll', 0.005, 'mul', [S('charisma', 30), S('negotiation', 15)]),

  skill('math', 'finance', 'Mathematics', 'Математика', 250, 'incomeFinance', 0.01, 'mul', [S('concentration', 20)]),
  skill('marketAnalysis', 'finance', 'Market Analysis', 'Аналіз ринку', 1000, 'jobXp:finance', 0.01, 'mul', [S('math', 25)]),
  skill('accounting', 'finance', 'Creative Accounting', 'Креативна бухгалтерія', 2000, 'fine', 0.01, 'div', [S('math', 40)]),

  skill('manipulation', 'dark', 'Manipulation', 'Маніпуляція', 500, 'lieReward', 0.01, 'mul', [{ repMax: -25 }]),
  skill('connections', 'dark', 'Connections', "Зв'язки", 1500, 'heatDecay', 0.01, 'mul', [{ repMax: -25 }, S('manipulation', 20)]),
  skill('offshore', 'dark', 'Offshore Schemes', 'Офшорні схеми', 3000, 'incomeShadow', 0.01, 'mul', [{ repMax: -25 }, S('connections', 20)]),
];

// ---------- Effects ----------

export const EFFECT_LABEL: Record<string, T> = {
  happiness: { en: 'Happiness', uk: 'Щастя' },
  xpAll: { en: 'All XP', uk: 'Весь досвід' },
  jobXp: { en: 'Job XP', uk: 'Досвід роботи' },
  skillXp: { en: 'Skill XP', uk: 'Досвід навиків' },
  'jobXp:finance': { en: 'Finance job XP', uk: 'Досвід у фінансах' },
  incomeAll: { en: 'All income', uk: 'Весь дохід' },
  incomeSales: { en: 'Sales income', uk: 'Дохід з продажів' },
  incomeFinance: { en: 'Finance income', uk: 'Дохід з фінансів' },
  incomeShadow: { en: 'Shadow income', uk: 'Тіньовий дохід' },
  incomeEntre: { en: 'Business income', uk: 'Дохід з бізнесу' },
  expenses: { en: 'Expenses', uk: 'Витрати' },
  lifespan: { en: 'Lifespan', uk: 'Тривалість життя' },
  heatDecay: { en: 'Heat cooldown', uk: 'Охолодження 🔥' },
  fine: { en: 'Fines', uk: 'Штрафи' },
  lieChance: { en: 'Lie success', uk: 'Успіх брехні' },
  lieReward: { en: 'Lie payout', uk: 'Виграш від брехні' },
  shopPrice: { en: 'Shop prices', uk: 'Ціни в магазині' },
  speed: { en: 'Game speed', uk: 'Швидкість часу' },
};

// ---------- Shop ----------

export type SlotId = 'housing' | 'transport' | 'water' | 'sky' | 'staff' | 'style';
export interface Effect { type: string; value: number }

export interface ItemDef {
  id: string;
  slot: SlotId;
  name: T;
  price: number;
  upkeep: number; // $ per day while equipped
  effects: Effect[];
  art: string;
  mk: number; // 0 = handmade, n>0 = procedurally generated tier beyond the last handmade item
}

export const SLOTS: { id: SlotId; name: T; icon: string; def: string | null }[] = [
  { id: 'housing', name: { en: 'Housing', uk: 'Житло' }, icon: '🏠', def: 'box' },
  { id: 'transport', name: { en: 'Transport', uk: 'Транспорт' }, icon: '🚗', def: 'feet' },
  { id: 'water', name: { en: 'Water', uk: 'Вода' }, icon: '⛵', def: null },
  { id: 'sky', name: { en: 'Sky', uk: 'Небо' }, icon: '✈️', def: null },
  { id: 'staff', name: { en: 'Staff', uk: 'Персонал' }, icon: '👔', def: null },
  { id: 'style', name: { en: 'Style', uk: 'Стиль' }, icon: '💎', def: null },
];

const item = (id: string, slot: SlotId, en: string, uk: string, price: number, upkeep: number, effects: Effect[]): ItemDef => ({
  id, slot, name: { en, uk }, price, upkeep, effects, art: id, mk: 0,
});
const E = (type: string, value: number): Effect => ({ type, value });

const BASE_ITEMS: ItemDef[] = [
  item('box', 'housing', 'Cardboard Box', 'Картонна коробка', 0, 0, [E('happiness', 1)]),
  item('room', 'housing', 'Rented Room', 'Орендована кімната', 400, 6, [E('happiness', 1.5)]),
  item('apartment', 'housing', 'Apartment', 'Квартира', 6000, 40, [E('happiness', 2.2)]),
  item('townhouse', 'housing', 'Townhouse', 'Таунхаус', 8e4, 250, [E('happiness', 3.5)]),
  item('penthouse', 'housing', 'Penthouse', 'Пентхаус', 1.2e6, 1800, [E('happiness', 6)]),
  item('villa', 'housing', 'Seaside Villa', 'Вілла біля моря', 2e7, 1.5e4, [E('happiness', 10)]),
  item('castle', 'housing', 'Castle', 'Замок', 4e8, 1.2e5, [E('happiness', 18)]),
  item('island', 'housing', 'Private Island', 'Приватний острів', 1e10, 1.5e6, [E('happiness', 35)]),
  item('station', 'housing', 'Orbital Station', 'Орбітальна станція', 5e11, 3e7, [E('happiness', 70)]),

  item('feet', 'transport', 'Your Own Feet', 'Власні ноги', 0, 0, [E('jobXp', 1)]),
  item('scooter', 'transport', 'Scooter', 'Самокат', 250, 1, [E('jobXp', 1.1)]),
  item('usedSedan', 'transport', 'Used Sedan', 'Вживаний седан', 3500, 12, [E('jobXp', 1.25)]),
  item('bizSedan', 'transport', 'Business Sedan', 'Бізнес-седан', 6e4, 120, [E('jobXp', 1.45)]),
  item('sportsCar', 'transport', 'Sports Car', 'Спорткар', 8e5, 900, [E('jobXp', 1.7)]),
  item('hypercar', 'transport', 'Hypercar', 'Гіперкар', 1.5e7, 9000, [E('jobXp', 2)]),
  item('limo', 'transport', 'Armored Limo', 'Броньований лімузин', 3e8, 8e4, [E('jobXp', 2.4)]),

  item('rubberBoat', 'water', 'Rubber Boat', 'Надувний човен', 1500, 4, [E('incomeAll', 1.05)]),
  item('speedboat', 'water', 'Speedboat', 'Катер', 1e5, 200, [E('incomeAll', 1.12)]),
  item('yacht', 'water', 'Yacht', 'Яхта', 4e6, 5000, [E('incomeAll', 1.25)]),
  item('megayacht', 'water', 'Megayacht', 'Мегаяхта', 2e8, 2e5, [E('incomeAll', 1.45)]),
  item('subYacht', 'water', 'Yacht with Submarine', 'Яхта з підводним човном', 1e10, 8e6, [E('incomeAll', 1.7)]),

  item('paramotor', 'sky', 'Paramotor', 'Парамотор', 2e4, 50, [E('skillXp', 1.1)]),
  item('helicopter', 'sky', 'Helicopter', 'Гелікоптер', 2e6, 3000, [E('skillXp', 1.25)]),
  item('bizjet', 'sky', 'Business Jet', 'Бізнес-джет', 8e7, 1e5, [E('skillXp', 1.5)]),
  item('airliner', 'sky', 'Private Airliner', 'Приватний лайнер', 4e9, 3e6, [E('skillXp', 1.8)]),
  item('spaceship', 'sky', 'Spaceship', 'Космічний корабель', 2e11, 1e8, [E('skillXp', 2.2)]),

  item('assistant', 'staff', 'Personal Assistant', 'Особистий асистент', 3000, 25, [E('heatDecay', 1.25)]),
  item('lawyer', 'staff', 'Lawyer', 'Юрист', 1.5e5, 600, [E('heatDecay', 1.6), E('fine', 0.8)]),
  item('lawFirm', 'staff', 'Law Firm', 'Юридична фірма', 1.5e7, 3e4, [E('heatDecay', 2.5), E('fine', 0.6)]),
  item('lobbyist', 'staff', 'Lobbyist', 'Лобіст', 2e9, 1.5e6, [E('heatDecay', 4), E('fine', 0.4)]),

  item('cheapSuit', 'style', 'Cheap Suit', 'Дешевий костюм', 150, 1, [E('incomeSales', 1.1), E('add:lieChance', 0.02)]),
  item('tailoredSuit', 'style', 'Tailored Suit', 'Костюм на замовлення', 1.2e4, 25, [E('incomeSales', 1.25), E('add:lieChance', 0.04)]),
  item('goldWatch', 'style', 'Gold Watch', 'Золотий годинник', 3e5, 150, [E('incomeSales', 1.45), E('add:lieChance', 0.06)]),
  item('luxuryPen', 'style', 'Luxury Pen', 'Розкішна ручка', 8e6, 800, [E('incomeSales', 1.7), E('add:lieChance', 0.08)]),
  item('diamondPen', 'style', 'Diamond Pen', 'Діамантова ручка', 4e8, 1e4, [E('incomeSales', 2.2), E('add:lieChance', 0.1)]),
];

const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(BASE_ITEMS.map((i) => [i.id, i]));

export function baseItems(slot: SlotId): ItemDef[] {
  return BASE_ITEMS.filter((i) => i.slot === slot);
}

/** Procedural tier N beyond the last handmade item of a slot. Id format: "<lastId>+N". */
function makeMk(last: ItemDef, n: number): ItemDef {
  return {
    ...last,
    id: `${last.id}+${n}`,
    name: { en: `${last.name.en} Mk.${n + 1}`, uk: `${last.name.uk} Mk.${n + 1}` },
    price: last.price * Math.pow(60, n),
    upkeep: last.upkeep * Math.pow(45, n),
    effects: last.effects.map((e) => ({
      type: e.type,
      value: e.type.startsWith('add:') ? e.value * (1 + 0.5 * n) : e.value >= 1 ? 1 + (e.value - 1) * Math.pow(1.6, n) : e.value * Math.pow(0.85, n),
    })),
    mk: n,
  };
}

export function getItem(id: string): ItemDef {
  const plus = id.indexOf('+');
  if (plus < 0) return ITEM_BY_ID[id];
  return makeMk(ITEM_BY_ID[id.slice(0, plus)], Number(id.slice(plus + 1)));
}

export function lastBase(slot: SlotId): ItemDef {
  const list = baseItems(slot);
  return list[list.length - 1];
}

// ---------- Legacy perks ----------

export interface PerkDef { id: string; icon: string; name: T; desc: T; base: number; growth: number; max?: number }

export const PERKS: PerkDef[] = [
  { id: 'startCapital', icon: '💵', name: { en: 'Trust Fund', uk: 'Трастовий фонд' }, desc: { en: 'Start each life with {v}', uk: 'Починай кожне життя з {v}' }, base: 1, growth: 1.8 },
  { id: 'fastLearner', icon: '📚', name: { en: 'Good Genes', uk: 'Хороші гени' }, desc: { en: 'All XP ×{v}', uk: 'Весь досвід ×{v}' }, base: 2, growth: 1.7 },
  { id: 'silverSpoon', icon: '🥄', name: { en: 'Silver Spoon', uk: 'Срібна ложка' }, desc: { en: 'All income ×{v}', uk: 'Весь дохід ×{v}' }, base: 2, growth: 1.7 },
  { id: 'longevity', icon: '🧬', name: { en: 'Longevity', uk: 'Довголіття' }, desc: { en: 'Lifespan +{v} years', uk: 'Життя +{v} років' }, base: 3, growth: 2 },
  { id: 'cleanRecord', icon: '🧼', name: { en: 'Clean Record', uk: 'Чиста репутація роду' }, desc: { en: 'Heat cooldown ×{v}, fines ×{w}', uk: 'Охолодження 🔥 ×{v}, штрафи ×{w}' }, base: 2, growth: 1.8 },
  { id: 'timeMaster', icon: '⏳', name: { en: 'Time Is Money', uk: 'Час — гроші' }, desc: { en: 'Game speed ×{v}', uk: 'Швидкість часу ×{v}' }, base: 5, growth: 2.2 },
  { id: 'autoPromote', icon: '🤖', name: { en: 'Career Elevator', uk: "Кар'єрний ліфт" }, desc: { en: 'Automatically take the best job in the current career', uk: 'Автоматично бере найкращу посаду в поточній кар\'єрі' }, base: 3, growth: 1, max: 1 },
  { id: 'autoLearn', icon: '🎓', name: { en: 'Self-Study', uk: 'Самоосвіта' }, desc: { en: 'Automatically trains the fastest-to-level skill', uk: 'Автоматично тренує навик, що найшвидше качається' }, base: 5, growth: 1, max: 1 },
];

// ---------- Stock market ----------

export interface TickerDef { id: string; name: T; start: number; vol: number; drift: number; revert: number; penny?: boolean }

export const TICKERS: TickerDef[] = [
  { id: 'PENZ', name: { en: 'Penz Corp (penny stock)', uk: 'Penz Corp (копійчана акція)' }, start: 0.5, vol: 0.06, drift: 0, revert: 0.008, penny: true },
  { id: 'BLUE', name: { en: 'BlueChip Inc.', uk: 'BlueChip Inc.' }, start: 100, vol: 0.01, drift: 0.0006, revert: 0 },
  { id: 'OIL', name: { en: 'Global Oil', uk: 'Global Oil' }, start: 50, vol: 0.02, drift: 0.0002, revert: 0 },
  { id: 'MOON', name: { en: 'MoonCoin', uk: 'MoonCoin' }, start: 10, vol: 0.05, drift: 0.0003, revert: 0 },
];

export const MARKET_UNLOCK = 1000; // lifetime earnings this life needed to open the market
