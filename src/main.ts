import './style.css';
import { BONUS_CAP, freshState, load, save, tick } from './game';
import { setLang } from './i18n';
import { frame, initUI, isModalOpen, offlineToast } from './ui';
import * as sdk from './sdk';

async function boot() {
  await sdk.initSdk();
  sdk.loadingStart();

  const s = load() ?? freshState();
  setLang(s.lang);

  // Time away is banked as Turbo time instead of simulated, so nobody dies of old age while offline.
  const away = (Date.now() - s.lastSave) / 1000;
  const banked = away > 60 ? Math.min(BONUS_CAP - s.bonus, away) : 0;
  if (banked > 0) s.bonus += banked;

  if (import.meta.env.DEV) (window as unknown as { __s: typeof s }).__s = s; // debug handle, stripped from builds
  initUI(s);
  frame(true);
  if (banked > 60) offlineToast(banked);

  sdk.loadingStop();
  sdk.gameplayStart();

  let last = performance.now();
  let sinceSave = 0;
  setInterval(() => {
    const now = performance.now();
    const dt = Math.min(5, (now - last) / 1000);
    last = now;
    if (!s.paused && !isModalOpen() && !sdk.isAdPlaying()) tick(s, dt);
    frame();
    sinceSave += dt;
    if (sinceSave > 10) { sinceSave = 0; save(s); }
  }, 50);

  const persist = () => save(s);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
  window.addEventListener('pagehide', persist);
  window.addEventListener('beforeunload', persist);

  // CrazyGames guideline: keep the page from scrolling on arrow/space, and block the context menu.
  window.addEventListener('keydown', (e) => {
    if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key) && e.target === document.body) e.preventDefault();
  });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

boot();
