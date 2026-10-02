// Achievements are dynasty-wide: once earned they stay forever and each grants a small permanent bonus.
import type { Effect, T } from './data';
import type { State } from './game';

export interface AchCtx { netWorth: number; maxJob: number; maxSkill: number; stockValue: number }

export interface AchDef {
  id: string;
  icon: string;
  name: T;
  desc: T;
  bonus: Effect;
  secret?: boolean; // name and description hidden until earned
  check: (s: State, c: AchCtx) => boolean;
}

const st = (s: State, k: string) => s.stats[k] ?? 0;
const has = (s: State, id: string) => s.owned.includes(id);
const unl = (s: State, id: string) => s.unlocked.includes(id);
const a = (id: string, icon: string, en: string, uk: string, dEn: string, dUk: string, bonus: Effect, check: AchDef['check'], secret = false): AchDef => ({
  id, icon, name: { en, uk }, desc: { en: dEn, uk: dUk }, bonus, check, secret,
});
const B = (type: string, value: number): Effect => ({ type, value });

export const ACH_CATS: { id: string; name: T; ids: string[] }[] = [];
const group = (id: string, en: string, uk: string, list: AchDef[]) => {
  ACH_CATS.push({ id, name: { en, uk }, ids: list.map((x) => x.id) });
  return list;
};

export const ACHIEVEMENTS: AchDef[] = [
  ...group('money', 'Wealth', 'Статки', [
    a('k1', '💵', 'First Thousand', 'Перша тисяча', 'Reach $1K net worth', 'Маєш $1K статків', B('incomeAll', 1.02), (_, c) => c.netWorth >= 1e3),
    a('m1', '💰', 'Millionaire', 'Мільйонер', 'Reach $1M net worth', 'Маєш $1M статків', B('incomeAll', 1.03), (_, c) => c.netWorth >= 1e6),
    a('b1', '🏦', 'Billionaire', 'Мільярдер', 'Reach $1B net worth', 'Маєш $1B статків', B('incomeAll', 1.04), (_, c) => c.netWorth >= 1e9),
    a('t1', '🪙', 'Trillionaire', 'Трильйонер', 'Reach $1T net worth', 'Маєш $1T статків', B('incomeAll', 1.05), (_, c) => c.netWorth >= 1e12),
    a('q1', '🌌', 'Money Is Just a Number', 'Гроші — це просто цифри', 'Reach $1Qa net worth', 'Маєш $1Qa статків', B('incomeAll', 1.08), (_, c) => c.netWorth >= 1e15),
  ]),
  ...group('career', 'Career', "Кар'єра", [
    a('promo', '📈', 'Moving Up', 'Вгору', 'Become a Market Trader', 'Стань торговцем на ринку', B('jobXp', 1.02), (s) => unl(s, 'marketTrader')),
    a('office', '☎️', 'Hello, How Can I Help?', 'Добрий день, чим допомогти?', 'Get an office job', 'Отримай офісну роботу', B('jobXp', 1.02), (s) => unl(s, 'callCenter')),
    a('ceo', '👔', 'Corner Office', 'Кабінет з видом', 'Become CEO', 'Стань генеральним директором', B('jobXp', 1.05), (s) => unl(s, 'ceo')),
    a('banker', '🏛️', 'Master of the Universe', 'Володар всесвіту', 'Become an Investment Banker', 'Стань інвестбанкіром', B('jobXp', 1.05), (s) => unl(s, 'investBanker')),
    a('oligarch', '🛢️', 'Oligarch', 'Олігарх', 'Climb to the top of the shadow economy', 'Досягни вершини тіньової економіки', B('incomeShadow', 1.1), (s) => unl(s, 'oligarch')),
    a('megacorp', '🌐', 'Too Big to Fail', 'Занадто великий, щоб впасти', 'Become Megacorp Overlord', 'Стань володарем мегакорпорації', B('incomeAll', 1.1), (s) => unl(s, 'megacorp')),
    a('lvl100', '💯', 'Workaholic', 'Трудоголік', 'Reach level 100 in any job', 'Досягни 100 рівня на будь-якій роботі', B('jobXp', 1.03), (_, c) => c.maxJob >= 100),
    a('lvl500', '⚙️', 'Machine', 'Машина', 'Reach level 500 in any job', 'Досягни 500 рівня на будь-якій роботі', B('jobXp', 1.06), (_, c) => c.maxJob >= 500),
  ]),
  ...group('skills', 'Skills', 'Навики', [
    a('smooth', '🗣️', 'Smooth Talker', 'Язик без кісток', 'Charisma level 50', 'Харизма 50 рівня', B('skillXp', 1.03), (s) => s.skills.charisma.level >= 50),
    a('skill100', '🎓', 'Expert', 'Експерт', 'Any skill level 100', 'Будь-який навик 100 рівня', B('skillXp', 1.03), (_, c) => c.maxSkill >= 100),
    a('skill300', '🧙', 'Grandmaster', 'Гросмейстер', 'Any skill level 300', 'Будь-який навик 300 рівня', B('skillXp', 1.06), (_, c) => c.maxSkill >= 300),
    a('dark', '🦹', 'Dark Side', 'Темна сторона', 'Unlock the Dark Arts', 'Відкрий Темні мистецтва', B('lieReward', 1.1), (s) => unl(s, 'manipulation')),
  ]),
  ...group('shop', 'Lifestyle', 'Стиль життя', [
    a('roof', '🏠', 'A Roof Over Your Head', 'Дах над головою', 'Rent a room', 'Орендуй кімнату', B('happiness', 1.02), (s) => has(s, 'room')),
    a('wheels', '🚗', 'Got Wheels', 'На колесах', 'Buy a car', 'Купи авто', B('happiness', 1.02), (s) => has(s, 'usedSedan')),
    a('captain', '🛥️', 'Captain', 'Капітан', 'Buy a yacht', 'Купи яхту', B('happiness', 1.04), (s) => has(s, 'yacht')),
    a('jetset', '🛩️', 'Jet Set', 'Джетсет', 'Buy a business jet', 'Купи бізнес-джет', B('happiness', 1.04), (s) => has(s, 'bizjet')),
    a('island', '🏝️', 'Island Life', 'Острівне життя', 'Buy a private island', 'Купи приватний острів', B('happiness', 1.06), (s) => has(s, 'island')),
    a('space', '🛰️', 'Out of This World', 'Не з цього світу', 'Buy an orbital station', 'Купи орбітальну станцію', B('happiness', 1.08), (s) => has(s, 'station')),
    a('mk', '✨', 'Off the Catalog', 'Поза каталогом', 'Buy any Mk.2+ item', 'Купи будь-яку річ Mk.2+', B('happiness', 1.08), (s) => s.owned.some((id) => id.includes('+'))),
    a('collector', '🗃️', 'Hoarder', 'Колекціонер', 'Own 20 items in one life', 'Май 20 речей за одне життя', B('happiness', 1.05), (s) => s.owned.length >= 20),
    a('golden', '🖋️', 'The Pen Is Mightier', 'Перо сильніше за меч', 'Buy the Diamond Pen', 'Купи діамантову ручку', B('incomeSales', 1.1), (s) => has(s, 'diamondPen')),
  ]),
  ...group('schemes', 'Schemes', 'Схеми', [
    a('lie1', '🤥', 'White Lie', 'Біла брехня', 'Successfully lie to a client', 'Успішно набреши клієнту', B('lieReward', 1.03), (s) => st(s, 'lies') >= 1),
    a('lie50', '🎭', 'Pathological', 'Патологічний брехун', '50 successful lies', '50 успішних брехень', B('lieReward', 1.08), (s) => st(s, 'lies') >= 50),
    a('busted', '🚨', 'Busted', 'Спалився', 'Get caught lying', 'Попадись на брехні', B('add:lieChance', 0.02), (s) => st(s, 'liesFailed') >= 1, true),
    a('audit', '🧾', 'Paper Trail', 'Паперовий слід', 'Survive a tax audit', 'Переживи податкову перевірку', B('fine', 0.95), (s) => st(s, 'audits') >= 1, true),
    a('jail', '⛓️', 'Orange Is the New Black', 'Помаранчевий — новий чорний', 'Go to prison', 'Потрап у в\'язницю', B('heatDecay', 1.1), (s) => st(s, 'jails') >= 1, true),
    a('wanted', '🔥', 'Most Wanted', 'Розшукується', 'Reach 100 heat', 'Набери 100 уваги', B('heatDecay', 1.05), (s) => s.heat >= 99.5),
    a('briber', '💼', 'Greasing the Wheels', 'Змащені колеса', 'Bribe 10 officials', 'Дай 10 хабарів', B('heatDecay', 1.1), (s) => st(s, 'bribes') >= 10),
    a('saint', '😇', 'Saint', 'Святий', 'Reach +100 reputation', 'Досягни +100 репутації', B('incomeSales', 1.05), (s) => s.rep >= 100),
    a('villain', '😈', 'Super-villain', 'Суперлиходій', 'Reach −300 reputation', 'Опустись до −300 репутації', B('incomeShadow', 1.1), (s) => s.rep <= -300),
  ]),
  ...group('market', 'Market', 'Біржа', [
    a('investor', '📊', 'Investor', 'Інвестор', 'Buy your first stock', 'Купи першу акцію', B('incomeFinance', 1.02), (s) => st(s, 'buys') >= 1),
    a('diamond', '💎', 'Diamond Hands', 'Діамантові руки', 'Hold $1M in stocks', 'Тримай $1M в акціях', B('incomeFinance', 1.05), (_, c) => c.stockValue >= 1e6),
    a('wolf', '🐺', 'Wolf of Pen Street', 'Вовк з Пен-стріт', 'Pump & dump $PENZ for a profit', 'Зароби на pump & dump $PENZ', B('incomeFinance', 1.05), (s) => st(s, 'dumps') >= 1),
    a('rugged', '🪤', 'Rugged', 'Rug pull', 'Get rug-pulled', 'Потрап під rug pull', B('incomeFinance', 1.03), (s) => st(s, 'rugs') >= 1, true),
  ]),
  ...group('life', 'Life & Legacy', 'Життя і спадок', [
    a('retire', '📜', 'Early Retirement', 'Рання пенсія', 'Write a will and retire', 'Напиши заповіт і піди на пенсію', B('xpAll', 1.03), (s) => st(s, 'wills') >= 1),
    a('gen2', '👶', 'Heir Apparent', 'Спадкоємець', 'Reach generation 2', 'Досягни 2-го покоління', B('xpAll', 1.03), (s) => s.gen >= 2),
    a('gen5', '🏰', 'Dynasty', 'Династія', 'Reach generation 5', 'Досягни 5-го покоління', B('xpAll', 1.05), (s) => s.gen >= 5),
    a('gen10', '👑', 'Old Money', 'Старі гроші', 'Reach generation 10', 'Досягни 10-го покоління', B('xpAll', 1.08), (s) => s.gen >= 10),
    a('old', '🧓', 'Golden Years', 'Золоті роки', 'Live to 80', 'Доживи до 80', B('lifespan', 1.02), (s) => s.days >= 80 * 365),
    a('turbo', '⏩', 'Speed Demon', 'Демон швидкості', 'Use Turbo', 'Увімкни Турбо', B('xpAll', 1.01), (s) => st(s, 'turbo') >= 1),
    a('choices', '🎲', 'Choices Matter', 'Вибір має значення', 'Make 10 event choices', 'Зроби 10 виборів у подіях', B('xpAll', 1.02), (s) => st(s, 'events') >= 10),
  ]),
];

export const ACH: Record<string, AchDef> = Object.fromEntries(ACHIEVEMENTS.map((x) => [x.id, x]));
