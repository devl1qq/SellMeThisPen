// Thin wrapper around the CrazyGames HTML5 SDK v3. Everything degrades gracefully when the SDK is absent
// (local dev, other portals): ads are simulated as successful and storage falls back to localStorage.

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { CrazyGames?: any }
}

let sdk: any = null;
let env: 'local' | 'crazygames' | 'disabled' = 'disabled';
let playing = false;
let adActive = false;

export async function initSdk(): Promise<void> {
  try {
    if (window.CrazyGames?.SDK) {
      await window.CrazyGames.SDK.init();
      sdk = window.CrazyGames.SDK;
      env = sdk.environment ?? 'disabled';
    }
  } catch (e) {
    console.warn('[sdk] init failed', e);
    sdk = null;
    env = 'disabled';
  }
}

export const environment = () => env;
export const isAdPlaying = () => adActive;
const live = () => sdk && env !== 'disabled';
/** False off CrazyGames (e.g. GitHub Pages): ad buttons are hidden there instead of granting free rewards. */
export const adsAvailable = () => !!live();

export function loadingStart() { try { if (live()) sdk.game.loadingStart(); } catch { /* ignore */ } }
export function loadingStop() { try { if (live()) sdk.game.loadingStop(); } catch { /* ignore */ } }

export function gameplayStart() {
  if (playing) return;
  playing = true;
  try { if (live()) sdk.game.gameplayStart(); } catch { /* ignore */ }
}
export function gameplayStop() {
  if (!playing) return;
  playing = false;
  try { if (live()) sdk.game.gameplayStop(); } catch { /* ignore */ }
}
export function happytime() { try { if (live()) sdk.game.happytime(); } catch { /* ignore */ } }

function requestAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
  if (!live()) return Promise.resolve(true); // simulated outside CrazyGames
  return new Promise((resolve) => {
    const wasPlaying = playing;
    const done = (ok: boolean) => {
      adActive = false;
      if (wasPlaying) gameplayStart();
      resolve(ok);
    };
    try {
      sdk.ad.requestAd(type, {
        adStarted: () => { adActive = true; gameplayStop(); },
        adFinished: () => done(true),
        adError: (err: unknown) => { console.warn('[sdk] ad error', err); done(false); },
      });
    } catch (e) {
      console.warn('[sdk] requestAd threw', e);
      done(false);
    }
  });
}

export const rewardedAd = () => requestAd('rewarded');
export const midgameAd = () => requestAd('midgame').then(() => undefined);

// Storage: CrazyGames Data module syncs to the player's account when they are logged in.
export const storage = {
  get(key: string): string | null {
    try {
      if (env === 'crazygames' && sdk?.data) return sdk.data.getItem(key);
    } catch { /* fall through */ }
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try {
      if (env === 'crazygames' && sdk?.data) { sdk.data.setItem(key, value); return; }
    } catch { /* fall through */ }
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
  remove(key: string) {
    try { if (env === 'crazygames' && sdk?.data) sdk.data.removeItem(key); } catch { /* ignore */ }
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};
