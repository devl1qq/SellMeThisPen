// Hand-drawn flat SVG art. Every item is a 64×64 drawing; the scene composes them around the avatar.

const shadow = (cx = 32, cy = 58, rx = 26) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="3.5" fill="#000" opacity=".18"/>`;
const waves = `<path d="M0 52q8-4 16 0t16 0 16 0 16 0V64H0Z" fill="#4fb3e8"/><path d="M0 56q8-3 16 0t16 0 16 0 16 0" stroke="#bfe6fb" stroke-width="1.5" fill="none"/>`;

function windows(x: number, y: number, cols: number, rows: number, w: number, h: number, gx: number, gy: number, lit = '#ffe08a', dark = '#3d4f66') {
  let s = '';
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) s += `<rect x="${x + c * gx}" y="${y + r * gy}" width="${w}" height="${h}" fill="${(r * 7 + c * 3) % 5 < 3 ? lit : dark}"/>`;
  return s;
}

function car(body: string, path: string, extra = '', wheels: [number, number] = [17, 48], glass = '#bfe3f5') {
  return `${shadow(32, 53, 28)}<path d="${path}" fill="${body}"/>
  <path d="M26 27h9v6H20Z" fill="${glass}"/><path d="M37 27h6l6 6H37Z" fill="${glass}"/>${extra}
  ${wheels.map((x) => `<circle cx="${x}" cy="47" r="6" fill="#222"/><circle cx="${x}" cy="47" r="2.6" fill="#b0b7bf"/>`).join('')}
  <rect x="57" y="37" width="4" height="3" rx="1" fill="#ffe08a"/><rect x="3" y="38" width="3" height="3" rx="1" fill="#e53935"/>`;
}

function person(suit: string, extra = '', skin = '#f1c27d', hair = '#3b2a1a') {
  return `${shadow(32, 60, 16)}<path d="M18 60V40q0-8 8-8h12q8 0 8 8v20Z" fill="${suit}"/>
  <path d="M28 32l4 8 4-8Z" fill="#fff"/><rect x="29" y="25" width="6" height="8" fill="${skin}"/>
  <circle cx="32" cy="19" r="9" fill="${skin}"/><path d="M23 18q0-9 9-9t9 9q-3-4-9-4t-9 4Z" fill="${hair}"/>
  <circle cx="29" cy="20" r="1" fill="#222"/><circle cx="35" cy="20" r="1" fill="#222"/><path d="M29 24q3 2 6 0" stroke="#7a4a2a" stroke-width="1" fill="none"/>${extra}`;
}

function boatHull(hull: string, x1: number, x2: number, y: number, depth: number) {
  return `<path d="M${x1} ${y}H${x2}l-7 ${depth}H${x1 + 6}Z" fill="${hull}"/>`;
}

export const ART: Record<string, string> = {
  // ---------- housing ----------
  box: `${shadow()}<path d="M8 27l24 8 24-8v23l-24 8-24-8Z" fill="#b8854a"/><path d="M32 35l24-8v23l-24 8Z" fill="#9d6c35"/>
    <path d="M8 27l24-8 24 8-24 8Z" fill="#5a3d1e"/><path d="M8 27 1 17l24-7 7 9Z" fill="#cf9b5c"/><path d="M56 27l7-10-24-7-7 9Z" fill="#c38c4c"/>
    <path d="M14 41l10 3M14 45l7 2" stroke="#7a5228" stroke-width="1.6"/><text x="42" y="47" font-size="7" fill="#6d4a22" font-family="sans-serif">⬆</text>`,
  room: `${shadow()}<rect x="12" y="24" width="40" height="34" fill="#d6c4a5"/><path d="M7 26 32 8l25 18Z" fill="#8a4b36"/>
    <rect x="17" y="31" width="13" height="12" fill="#ffd66b" stroke="#6b5a45" stroke-width="2"/><path d="M23.5 31v12M17 37h13" stroke="#6b5a45" stroke-width="1.4"/>
    <rect x="36" y="38" width="11" height="20" fill="#6b4226"/><circle cx="44.5" cy="48" r="1.1" fill="#e8c26a"/><rect x="40" y="10" width="5" height="9" fill="#5d3b2d"/>`,
  apartment: `${shadow()}<rect x="13" y="6" width="38" height="52" fill="#7488a3"/><rect x="11" y="4" width="42" height="4" fill="#56677c"/>
    ${windows(17, 11, 4, 6, 5, 5, 8.2, 6.8)}<rect x="27" y="49" width="10" height="9" fill="#33414f"/><rect x="25" y="47" width="14" height="2" fill="#56677c"/>`,
  townhouse: `${shadow()}${[['#c96b5b', 4], ['#e0b45c', 23], ['#6b9ac4', 42]]
    .map(([c, x]) => `<rect x="${x}" y="27" width="18" height="31" fill="${c}"/><path d="M${Number(x) - 1} 28l10-13 10 13Z" fill="#5d4037"/>
      <rect x="${Number(x) + 3}" y="32" width="5" height="6" fill="#ffe08a"/><rect x="${Number(x) + 10}" y="32" width="5" height="6" fill="#ffe08a"/>
      <rect x="${Number(x) + 6}" y="45" width="6" height="13" fill="#4e342e"/>`).join('')}`,
  penthouse: `${shadow()}<rect x="17" y="10" width="30" height="48" fill="#3f6e8f"/>
    ${[21, 27, 33, 39].map((x) => `<rect x="${x}" y="14" width="3" height="44" fill="#8ec5e6" opacity=".55"/>`).join('')}
    <rect x="14" y="3" width="36" height="9" fill="#ffe7a0"/><rect x="14" y="3" width="36" height="2" fill="#c9a227"/>
    ${windows(17, 6, 6, 1, 4, 4, 6, 0, '#ffb300', '#ffb300')}<rect x="26" y="50" width="12" height="8" fill="#203a4d"/>`,
  villa: `<rect x="0" y="50" width="64" height="10" rx="3" fill="#7cc576"/><rect x="5" y="30" width="40" height="22" fill="#f6f3ec"/>
    <rect x="20" y="19" width="28" height="12" fill="#fff"/><rect x="3" y="28" width="44" height="3" fill="#b8b0a0"/><rect x="18" y="17" width="32" height="3" fill="#b8b0a0"/>
    <rect x="9" y="34" width="12" height="13" fill="#5fa8d3"/><rect x="25" y="34" width="16" height="9" fill="#5fa8d3"/><rect x="24" y="22" width="20" height="6" fill="#5fa8d3"/>
    <rect x="33" y="52" width="27" height="6" rx="2" fill="#4fc3f7"/><path d="M55 50c0-10 1-17 3-22" stroke="#8d6e63" stroke-width="2.4" fill="none"/>
    <path d="M58 28c-6-2-10 0-12 3M58 28c6-3 9 0 11 2M58 28c-2-5-6-6-9-6M58 28c3-5 6-5 8-4" stroke="#43a047" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  castle: `${shadow()}<rect x="11" y="28" width="42" height="30" fill="#a3a3a3"/>
    ${[11, 19, 27, 35, 43].map((x) => `<rect x="${x}" y="24" width="5" height="5" fill="#a3a3a3"/>`).join('')}
    <rect x="3" y="17" width="14" height="41" fill="#8f8f8f"/><rect x="47" y="17" width="14" height="41" fill="#8f8f8f"/>
    <path d="M2 18 10 4l8 14Z" fill="#5a5fbf"/><path d="M46 18l8-14 8 14Z" fill="#5a5fbf"/>
    <path d="M26 58V46a6 6 0 0 1 12 0v12Z" fill="#5b3a29"/><rect x="8" y="26" width="3" height="7" fill="#333"/><rect x="53" y="26" width="3" height="7" fill="#333"/>
    <path d="M32 24V9" stroke="#555" stroke-width="1.5"/><path d="M32 9l9 3-9 3Z" fill="#e53935"/>`,
  island: `<ellipse cx="32" cy="52" rx="31" ry="9" fill="#4fb3e8"/><ellipse cx="32" cy="48" rx="23" ry="6.5" fill="#f3d9a4"/>
    <path d="M36 47c0-12 2-22 6-28" stroke="#8d6e63" stroke-width="3" fill="none"/>
    <path d="M42 19c-8-3-13 0-15 4M42 19c8-4 12 0 14 3M42 19c-2-6-8-8-12-7M42 19c4-6 9-6 11-5" stroke="#43a047" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <rect x="12" y="38" width="12" height="9" fill="#c8a165"/><path d="M10 39l8-7 8 7Z" fill="#a1785a"/><circle cx="48" cy="46" r="1.6" fill="#ffca28"/>`,
  station: `<circle cx="32" cy="32" r="31" fill="#141a2e"/>${[[10, 12], [52, 9], [56, 44], [8, 46], [22, 6], [44, 56]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#fff"/>`).join('')}
    <ellipse cx="32" cy="32" rx="25" ry="9" fill="none" stroke="#cfd8dc" stroke-width="4"/><rect x="27" y="13" width="10" height="38" rx="4" fill="#eceff1"/>
    <rect x="3" y="29" width="15" height="6" fill="#3f51b5"/><rect x="46" y="29" width="15" height="6" fill="#3f51b5"/>
    <circle cx="32" cy="22" r="2" fill="#4fc3f7"/><circle cx="32" cy="32" r="2" fill="#ffd54f"/><circle cx="32" cy="42" r="2" fill="#4fc3f7"/>`,

  // ---------- transport ----------
  feet: `${shadow(32, 52, 26)}<path d="M6 44c0-9 9-13 17-13l6-8 11 2c2 8 10 11 18 13 3 1 3 8 0 9H8c-2 0-2-1-2-3Z" fill="#e53935"/>
    <rect x="6" y="45" width="54" height="5" rx="2.5" fill="#fafafa"/><path d="M27 29l5 3M30 26l5 3M33 24l5 2" stroke="#fff" stroke-width="1.6"/><path d="M14 40h10" stroke="#b71c1c" stroke-width="2"/>`,
  scooter: `${shadow(32, 56, 24)}<circle cx="14" cy="50" r="5.5" fill="#222"/><circle cx="50" cy="50" r="5.5" fill="#222"/>
    <rect x="13" y="44" width="34" height="4" rx="2" fill="#43a047"/><path d="M47 46 43 14" stroke="#555" stroke-width="3"/><path d="M37 14h12" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>`,
  usedSedan: car('#8d6e63', 'M4 44l4-9 10-2 8-8h18l8 8 8 2v11H4Z', '<circle cx="12" cy="40" r="2.4" fill="#5d4037"/><circle cx="44" cy="41" r="1.8" fill="#5d4037"/><path d="M30 36l4 3" stroke="#4e342e" stroke-width="1.4"/>'),
  bizSedan: car('#263238', 'M4 44l4-9 10-2 8-8h18l8 8 8 2v11H4Z', '<path d="M8 39h50" stroke="#90a4ae" stroke-width=".8"/>'),
  sportsCar: car('#e53935', 'M2 45l4-7 16-4 10-6h12l10 6 8 4v7H2Z', '<path d="M24 32h10v3H20Z" fill="#bfe3f5"/>'),
  hypercar: car('#fdd835', 'M2 45l2-5 26-10h12l18 8 2 7H2Z', '<path d="M2 37h8v3H2Z" fill="#333"/><path d="M32 33h9l7 4H30Z" fill="#37474f"/>', [16, 49]),
  limo: `${shadow(32, 52, 31)}<path d="M1 45l3-8 9-2 6-7h28l6 7 9 2v8H1Z" fill="#111"/>
    ${[20, 28, 36, 44].map((x) => `<rect x="${x}" y="30" width="6" height="5" fill="#9fb8c8"/>`).join('')}<path d="M3 39h58" stroke="#c9a227" stroke-width=".8"/>
    ${[12, 52].map((x) => `<circle cx="${x}" cy="46" r="5.5" fill="#222"/><circle cx="${x}" cy="46" r="2.3" fill="#c9a227"/>`).join('')}`,

  // ---------- water ----------
  rubberBoat: `${waves}<path d="M9 42h46a6 6 0 0 1 0 12H9a6 6 0 0 1 0-12Z" fill="#ff7043"/><path d="M12 46h40" stroke="#ffab91" stroke-width="2"/>
    <path d="M40 30 50 52" stroke="#795548" stroke-width="2.2"/><ellipse cx="50.5" cy="52" rx="2" ry="4" fill="#795548"/>`,
  speedboat: `${waves}${boatHull('#fafafa', 4, 60, 42, 10)}<path d="M8 46h48" stroke="#e53935" stroke-width="2.5"/>
    <path d="M26 42l6-8h10l-2 8Z" fill="#81d4fa"/><path d="M60 42 54 39" stroke="#fafafa" stroke-width="3"/>`,
  yacht: `${waves}${boatHull('#fafafa', 2, 62, 44, 10)}<path d="M6 48h52" stroke="#1565c0" stroke-width="2"/>
    <rect x="13" y="35" width="38" height="9" fill="#f5f5f5"/><rect x="15" y="38" width="34" height="3" fill="#37474f"/>
    <rect x="21" y="27" width="22" height="8" fill="#eeeeee"/><rect x="23" y="29.5" width="18" height="2.6" fill="#37474f"/><path d="M33 27V14" stroke="#9e9e9e" stroke-width="1.4"/>`,
  megayacht: `${waves}${boatHull('#1a237e', 1, 63, 44, 10)}<rect x="8" y="35" width="50" height="9" fill="#fafafa"/><rect x="10" y="38" width="46" height="3" fill="#263238"/>
    <rect x="14" y="27" width="38" height="8" fill="#f5f5f5"/><rect x="16" y="29.5" width="34" height="2.6" fill="#263238"/>
    <rect x="22" y="20" width="22" height="7" fill="#eeeeee"/><rect x="24" y="22" width="18" height="2.4" fill="#263238"/>
    <ellipse cx="51" cy="26.5" rx="5" ry="1.2" fill="#c9a227"/><text x="48.6" y="28" font-size="3.6" fill="#1a237e" font-family="sans-serif" font-weight="bold">H</text>`,
  subYacht: `${waves}${boatHull('#fafafa', 6, 62, 40, 9)}<rect x="16" y="32" width="36" height="8" fill="#f5f5f5"/><rect x="18" y="34.6" width="32" height="2.6" fill="#37474f"/>
    <rect x="24" y="25" width="20" height="7" fill="#eee"/><path d="M6 44h50" stroke="#c9a227" stroke-width="1.6"/>
    <ellipse cx="22" cy="59" rx="11" ry="4" fill="#fbc02d"/><rect x="20" y="53" width="5" height="3" fill="#fbc02d"/><circle cx="18" cy="59" r="1.4" fill="#1565c0"/><circle cx="23" cy="59" r="1.4" fill="#1565c0"/>`,

  // ---------- sky ----------
  paramotor: `<path d="M8 24Q32 0 56 24" stroke="#e53935" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M10 24 30 44M54 24 34 44M22 14l9 30M42 14l-9 30" stroke="#757575" stroke-width=".8"/><circle cx="32" cy="42" r="3.2" fill="#f1c27d"/>
    <rect x="29" y="45" width="6" height="8" rx="2" fill="#1565c0"/><circle cx="32" cy="50" r="8" fill="none" stroke="#9e9e9e" stroke-width="1.4"/>`,
  helicopter: `<path d="M8 16h48" stroke="#333" stroke-width="2.4"/><rect x="30" y="16" width="3" height="6" fill="#333"/>
    <ellipse cx="30" cy="32" rx="16" ry="10" fill="#1e88e5"/><path d="M44 30h16v4H44Z" fill="#1e88e5"/><path d="M58 26v12" stroke="#333" stroke-width="2"/>
    <path d="M18 30a10 9 0 0 1 10-6v10H17Z" fill="#bbdefb"/><path d="M18 46h26M22 42v4M38 42v4" stroke="#333" stroke-width="2"/>`,
  bizjet: `<path d="M3 33q0-6 10-6l42 2q8 2 1 6l-43 2q-10 0-10-4Z" fill="#fafafa" stroke="#cfd8dc"/>
    <path d="M28 33l-8 13h6l14-12Z" fill="#cfd8dc"/><path d="M49 29l7-11h4l-4 12Z" fill="#c9a227"/>
    ${[16, 21, 26, 31, 36, 41].map((x) => `<circle cx="${x}" cy="31" r="1.2" fill="#455a64"/>`).join('')}<path d="M6 30q2-2 6-2v4H5Z" fill="#455a64"/>`,
  airliner: `<path d="M2 32q0-7 12-7l42 2q8 3 0 7l-42 3q-12 0-12-5Z" fill="#fafafa" stroke="#cfd8dc"/><path d="M4 34h52" stroke="#1565c0" stroke-width="2"/>
    <path d="M26 33 14 52h8l18-18Z" fill="#cfd8dc"/><path d="M26 28 18 14h6l12 13Z" fill="#e0e0e0"/><path d="M48 27l8-14h5l-4 15Z" fill="#1565c0"/>
    <rect x="18" y="40" width="9" height="4" rx="2" fill="#90a4ae"/>${[12, 16, 20, 24, 28, 32, 36, 40, 44].map((x) => `<circle cx="${x}" cy="29.5" r="1" fill="#455a64"/>`).join('')}`,
  spaceship: `<path d="M32 2c8 8 10 20 10 34H22c0-14 2-26 10-34Z" fill="#eceff1"/><path d="M32 2c4 4 6 9 7 14H25c1-5 3-10 7-14Z" fill="#e53935"/>
    <circle cx="32" cy="24" r="4" fill="#4fc3f7" stroke="#90a4ae" stroke-width="1.4"/><path d="M22 30 12 44h10ZM42 30l10 14H42Z" fill="#e53935"/>
    <path d="M24 36h16l-3 6H27Z" fill="#78909c"/><path d="M27 42q5 18 10 0Z" fill="#ffb300"/><path d="M29 42q3 10 6 0Z" fill="#fff59d"/>`,

  // ---------- staff ----------
  assistant: person('#7e57c2', '<rect x="40" y="38" width="11" height="14" rx="1" fill="#efebe9" stroke="#8d6e63" stroke-width="1.4"/><path d="M42 42h7M42 45h7M42 48h5" stroke="#9e9e9e"/>', '#e0ac69', '#6d4c41'),
  lawyer: person('#263238', '<path d="M31 33l1 12 1-12Z" fill="#c62828"/><rect x="42" y="48" width="14" height="10" rx="1.5" fill="#6d4c41"/><path d="M46 48v-2h6v2" stroke="#4e342e" stroke-width="1.4" fill="none"/>'),
  lawFirm: `${shadow()}<path d="M6 22 32 8l26 14Z" fill="#cfd8dc"/><rect x="8" y="22" width="48" height="4" fill="#b0bec5"/>
    ${[11, 21, 31, 41, 50].map((x) => `<rect x="${x}" y="27" width="4" height="25" fill="#eceff1"/>`).join('')}<rect x="6" y="52" width="52" height="6" fill="#b0bec5"/>
    <path d="M32 11v8M27 14h10" stroke="#c9a227" stroke-width="1.2"/><path d="M27 14l-2 4h4ZM37 14l-2 4h4Z" fill="#c9a227"/>`,
  lobbyist: `${shadow()}<rect x="6" y="40" width="52" height="18" fill="#eceff1"/>${[9, 17, 25, 35, 43, 51].map((x) => `<rect x="${x}" y="42" width="3" height="14" fill="#cfd8dc"/>`).join('')}
    <rect x="20" y="32" width="24" height="8" fill="#e0e0e0"/><path d="M20 32a12 12 0 0 1 24 0Z" fill="#fafafa" stroke="#cfd8dc"/><path d="M32 20v-8" stroke="#9e9e9e" stroke-width="1.4"/>
    <path d="M32 12l8 2-8 2Z" fill="#1565c0"/><text x="25" y="50" font-size="8" fill="#2e7d32" font-family="sans-serif" font-weight="bold">$$</text>`,

  // ---------- style ----------
  cheapSuit: `${shadow(32, 60, 18)}<path d="M14 58V24l12-6 6 10 6-10 12 6v34Z" fill="#8d8d8d"/><path d="M26 18l6 10 6-10-6 34Z" fill="#e0e0e0"/>
    <circle cx="20" cy="40" r="3" fill="#757575"/><path d="M44 30l3 6" stroke="#bdbdbd"/><circle cx="32" cy="38" r="1" fill="#555"/><circle cx="32" cy="44" r="1" fill="#555"/>`,
  tailoredSuit: `${shadow(32, 60, 18)}<path d="M14 58V24l12-6 6 10 6-10 12 6v34Z" fill="#1f2d4d"/><path d="M26 18l6 10 6-10-6 34Z" fill="#fafafa"/>
    <path d="M30 24h4l1 5-3 18-3-18Z" fill="#c62828"/><path d="M26 18l-4 16 10 4ZM38 18l4 16-10 4Z" fill="#2c3e66"/><path d="M41 31h5" stroke="#fafafa" stroke-width="1.6"/>`,
  goldWatch: `<rect x="24" y="4" width="16" height="16" rx="3" fill="#8d6e63"/><rect x="24" y="44" width="16" height="16" rx="3" fill="#8d6e63"/>
    <circle cx="32" cy="32" r="16" fill="#e0b13a"/><circle cx="32" cy="32" r="12.5" fill="#fffde7"/><path d="M32 32V23M32 32l6 4" stroke="#333" stroke-width="1.8" stroke-linecap="round"/>
    <rect x="47" y="29" width="4" height="6" rx="1" fill="#c9a227"/>${[0, 90, 180, 270].map((a) => `<rect x="31.3" y="20.5" width="1.4" height="2.4" fill="#c9a227" transform="rotate(${a} 32 32)"/>`).join('')}`,
  luxuryPen: `<g transform="rotate(-40 32 32)"><rect x="8" y="28" width="40" height="8" rx="4" fill="#111"/><path d="M48 28h6l6 4-6 4h-6Z" fill="#e0b13a"/>
    <rect x="20" y="27" width="3" height="10" fill="#e0b13a"/><path d="M12 26h18" stroke="#e0b13a" stroke-width="1.6" stroke-linecap="round"/><circle cx="9" cy="32" r="2" fill="#fafafa"/></g>`,
  diamondPen: `<g transform="rotate(-40 32 32)"><rect x="12" y="28" width="38" height="8" rx="4" fill="#e0b13a"/><path d="M50 28h5l6 4-6 4h-5Z" fill="#fafafa"/>
    <path d="M4 32l5-6h6l5 6-8 7Z" fill="#b3e5fc" stroke="#4fc3f7" stroke-width=".8"/><path d="M9 26l3 6 3-6M4 32h16" stroke="#4fc3f7" stroke-width=".6"/></g>
    <path d="M48 10l1.5 3.5L53 15l-3.5 1.5L48 20l-1.5-3.5L43 15l3.5-1.5Z" fill="#fff59d"/><path d="M12 46l1 2.4 2.4 1-2.4 1L12 53l-1-2.6-2.4-1 2.4-1Z" fill="#fff59d"/>`,
};

export function itemSvg(art: string, mk = 0, cls = 'art'): string {
  const hue = mk ? ` style="filter:hue-rotate(${(mk * 67) % 360}deg) saturate(1.3)"` : '';
  const badge = mk ? `<g><rect x="40" y="1" width="23" height="11" rx="5.5" fill="#c9a227"/><text x="51.5" y="9.4" font-size="7.5" text-anchor="middle" fill="#111" font-family="sans-serif" font-weight="bold">Mk${mk + 1}</text></g>` : '';
  return `<svg class="${cls}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><g${hue}>${ART[art] ?? ''}</g>${badge}</svg>`;
}

export const PEN_LOGO = `<svg viewBox="0 0 64 64" class="logo"><g transform="rotate(-40 32 32)"><rect x="8" y="27" width="40" height="10" rx="5" fill="#f5c542"/>
  <path d="M48 27h6l7 5-7 5h-6Z" fill="#fafafa"/><rect x="18" y="26" width="4" height="12" fill="#c9a227"/><path d="M12 25h18" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g></svg>`;

// ---------- Avatar ----------

export interface AvatarOpts { tier: number; age: number; jailed: boolean; sweating: boolean }

const OUTFITS = [
  { top: '#8a8f98', pants: '#5d6d7e', shoes: '#4e4e4e' }, // hoodie
  { top: '#4f8fd6', pants: '#34495e', shoes: '#5d4037' }, // shirt
  { top: '#66727f', pants: '#4a5560', shoes: '#212121', tie: '#c0392b' }, // grey suit
  { top: '#1f2d4d', pants: '#1a2540', shoes: '#111', tie: '#c62828', shades: true }, // navy suit
  { top: '#141414', pants: '#101010', shoes: '#000', tie: '#141414', shades: true, chain: true, bow: true }, // tux
  { top: '#f4f1ea', pants: '#e8e3d8', shoes: '#c9a227', tie: '#e0b13a', shades: true, chain: true, hat: true }, // white suit
];

export function avatarSvg(o: AvatarOpts): string {
  const f = o.jailed ? { top: '#ff8c1a', pants: '#ff8c1a', shoes: '#555' } : OUTFITS[Math.min(o.tier, OUTFITS.length - 1)];
  const skin = '#f1c27d';
  const hair = o.age < 40 ? '#3b2a1a' : o.age < 55 ? '#7d6b5c' : '#d5d5d5';
  const bald = o.age >= 62;
  const x = f as Record<string, unknown>;
  return `<ellipse cx="30" cy="106" rx="20" ry="3.5" fill="#000" opacity=".2"/>
  <rect x="18" y="70" width="10" height="33" fill="${f.pants}"/><rect x="32" y="70" width="10" height="33" fill="${f.pants}"/>
  <rect x="15" y="100" width="14" height="6" rx="3" fill="${f.shoes}"/><rect x="31" y="100" width="14" height="6" rx="3" fill="${f.shoes}"/>
  <path d="M13 42q0-9 9-9h16q9 0 9 9v31H13Z" fill="${f.top}"/>
  ${o.tier === 0 && !o.jailed ? `<rect x="18" y="56" width="7" height="6" fill="#6f747c"/><path d="M22 34q8 7 16 0" stroke="#6f747c" stroke-width="2.5" fill="none"/>` : ''}
  ${o.tier >= 2 && !o.jailed ? `<path d="M25 33l5 9 5-9Z" fill="#fff"/>` : ''}
  ${x.tie && !x.bow && !o.jailed ? `<path d="M28.5 36h3l1 4-2.5 18-2.5-18Z" fill="${x.tie}"/>` : ''}
  ${x.bow && !o.jailed ? `<path d="M25 37l5 2 5-2v5l-5-2-5 2Z" fill="#111" stroke="#333" stroke-width=".5"/>` : ''}
  ${x.chain && !o.jailed ? `<path d="M22 35q8 14 16 0" stroke="#e0b13a" stroke-width="1.6" fill="none"/><circle cx="30" cy="47" r="2.2" fill="#e0b13a"/>` : ''}
  <rect x="9" y="40" width="7" height="26" rx="3.5" fill="${f.top}"/><circle cx="12.5" cy="67" r="3.6" fill="${skin}"/>
  <path d="M44 41l10-17" stroke="${f.top}" stroke-width="7" stroke-linecap="round"/><circle cx="55" cy="22" r="3.8" fill="${skin}"/>
  <path d="M55 22l4-13" stroke="${o.tier >= 4 && !o.jailed ? '#e0b13a' : '#1565c0'}" stroke-width="2.6" stroke-linecap="round"/>
  ${o.tier >= 4 && !o.jailed ? `<rect x="49.5" y="27" width="5" height="3.5" rx="1" fill="#e0b13a" transform="rotate(-60 52 28)"/>` : ''}
  <rect x="26" y="27" width="8" height="8" fill="${skin}"/><circle cx="30" cy="20" r="11.5" fill="${skin}"/>
  ${bald ? `<path d="M18.5 19q-1-6 3-8M41.5 19q1-6-3-8" stroke="${hair}" stroke-width="3.5" fill="none"/>` : `<path d="M18.5 19q0-12 11.5-12t11.5 12q-4-6-11.5-6t-11.5 6Z" fill="${hair}"/>`}
  ${x.shades && !o.jailed ? `<rect x="21" y="17" width="8" height="5" rx="2" fill="#111"/><rect x="31" y="17" width="8" height="5" rx="2" fill="#111"/><path d="M29 19h2" stroke="#111"/>` :
    `<circle cx="26" cy="20" r="1.3" fill="#222"/><circle cx="34" cy="20" r="1.3" fill="#222"/>`}
  ${o.jailed ? `<path d="M26 27q4-2 8 0" stroke="#7a4a2a" stroke-width="1.3" fill="none"/>` : `<path d="M25.5 25.5q4.5 3.5 9 0" stroke="#7a4a2a" stroke-width="1.3" fill="none"/>`}
  ${o.age >= 50 ? `<path d="M23 15h3M34 15h3" stroke="#c9a37a" stroke-width=".8"/>` : ''}
  ${x.hat && !o.jailed ? `<rect x="17" y="9" width="26" height="3" rx="1.5" fill="#111"/><rect x="21" y="-6" width="18" height="16" fill="#111"/><rect x="21" y="5" width="18" height="3" fill="#e0b13a"/>` : ''}
  ${o.sweating ? `<path d="M41 12q2 3 0 5-2-2 0-5Z" fill="#4fc3f7"/>` : ''}`;
}

// ---------- Scene ----------

export interface SceneOpts extends AvatarOpts {
  housing: { art: string; mk: number };
  transport: { art: string; mk: number } | null;
  water: { art: string; mk: number } | null;
  sky: { art: string; mk: number } | null;
  heat: number;
}

const nested = (it: { art: string; mk: number }, x: number, y: number, w: number) =>
  `<svg x="${x}" y="${y}" width="${w}" height="${w}" viewBox="0 0 64 64">${itemSvg(it.art, it.mk, 'n')}</svg>`;

export function sceneSvg(o: SceneOpts): string {
  const space = o.housing.art === 'station';
  const island = o.housing.art === 'island';
  const urban = ['box', 'room', 'apartment', 'penthouse'].includes(o.housing.art);
  const danger = Math.min(1, Math.max(0, (o.heat - 40) / 60));
  let bg: string;
  if (space) {
    bg = `<rect width="360" height="200" fill="#0b1022"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % 360}" cy="${(i * 53) % 200}" r="${i % 3 ? 0.8 : 1.4}" fill="#fff" opacity=".8"/>`).join('')}
      <circle cx="300" cy="230" r="120" fill="#1e88e5"/><path d="M200 190q60-40 160-30v40H200Z" fill="#43a047" opacity=".8"/>`;
  } else {
    bg = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${danger > 0.5 ? '#b0486a' : '#7ec8f0'}"/><stop offset="1" stop-color="${danger > 0.5 ? '#f3a46b' : '#dff3fc'}"/></linearGradient></defs>
      <rect width="360" height="200" fill="url(#sky)"/><circle cx="320" cy="34" r="16" fill="#fff3b0"/>
      <g fill="#fff" opacity=".85"><ellipse cx="90" cy="38" rx="22" ry="7"/><ellipse cx="104" cy="32" rx="14" ry="7"/><ellipse cx="240" cy="22" rx="18" ry="5"/></g>
      ${urban ? `<g fill="#a9bccd" opacity=".75">${[[0, 90], [26, 70], [58, 100], [300, 80], [326, 60]].map(([x, y]) => `<rect x="${x}" y="${y}" width="28" height="${200 - y}"/>`).join('')}</g>` : ''}
      ${island ? `<rect y="140" width="360" height="60" fill="#4fb3e8"/>` : `<rect y="164" width="360" height="36" fill="${urban ? '#9aa3ad' : '#7cb85b'}"/>${urban ? `<path d="M0 182h360" stroke="#c9d0d6" stroke-width="2" stroke-dasharray="14 10"/>` : ''}`}`;
  }
  const water = o.water && !space ? `${island ? '' : `<path d="M250 168q55-8 110 0v32H250Z" fill="#4fb3e8"/>`}${nested(o.water, 258, 118, 96)}` : '';
  const house = space ? nested(o.housing, 170, 15, 160) : island ? nested(o.housing, 150, 35, 160) : nested(o.housing, 148, 18, 152);
  const veh = o.transport && o.transport.art !== 'feet' && !space ? nested(o.transport, 8, 120, 82) : '';
  const air = o.sky ? nested(o.sky, 14, 4, 70) : '';
  const bars = o.jailed ? `<g stroke="#444" stroke-width="4">${[96, 110, 124, 138, 152].map((x) => `<path d="M${x} 62v118"/>`).join('')}</g><rect x="90" y="58" width="68" height="6" fill="#444"/>` : '';
  return `<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${bg}${air}${house}${water}${veh}
    <svg x="95" y="68" width="62" height="112" viewBox="0 -8 60 116">${avatarSvg(o)}</svg>${bars}</svg>`;
}
