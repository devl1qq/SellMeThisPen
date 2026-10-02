import { t } from './i18n';

const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'];

const trim = (n: number, d: number) => String(Number(n.toFixed(d)));

export function fmt(n: number): string {
  if (!isFinite(n)) return '∞';
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a < 1000) return sign + (a >= 100 ? String(Math.floor(a)) : a >= 10 ? trim(a, 1) : trim(a, 2));
  const e = Math.floor(Math.log10(a) / 3);
  if (e < SUFFIX.length) {
    const v = a / Math.pow(1000, e);
    return sign + (v >= 100 ? trim(v, 0) : v >= 10 ? trim(v, 1) : trim(v, 2)) + SUFFIX[e];
  }
  return sign + a.toExponential(2).replace('+', '');
}

export const usd = (n: number) => (n < 0 ? '−$' : '$') + fmt(Math.abs(n));
export const pct = (n: number, d = 0) => `${(n * 100).toFixed(d)}%`;
export const mult = (n: number) => `×${n >= 100 ? fmt(n) : n.toFixed(2)}`;

export function age(days: number): string {
  return t('ageFmt', { y: Math.floor(days / 365), d: Math.floor(days % 365) });
}

/** Real-time duration in seconds → "1:05:09" / "12:34". */
export function dur(sec: number): string {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = (x: number) => String(x).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}
